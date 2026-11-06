import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { DEFAULT_WHATSAPP } from '../../../core/config/api-url';
import { MONTHS, label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { AccountStatus, Payment, PlayerDetail } from '../../../core/models/family';
import { NotificationService } from '../../../core/services/notification.service';
import { PublicContentStore } from '../../../core/state/public-content.store';
import { formatCop, formatPhone, whatsappLink } from '../../../core/utils/format';
import { FieldError } from '../../../shared/forms/field-error';

const MAX_RECEIPT_MB = 5;

@Component({
  selector: 'app-child-payments',
  imports: [ReactiveFormsModule, DatePipe, FieldError],
  templateUrl: './child-payments.html',
  styleUrl: './child-payments.css',
})
export class ChildPayments implements OnInit {
  readonly player = input.required<PlayerDetail>();

  private readonly api = inject(FamilyApiService);
  private readonly notify = inject(NotificationService);
  protected readonly store = inject(PublicContentStore);

  protected readonly account = signal<AccountStatus | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly sending = signal(false);
  protected readonly receipt = signal<File | null>(null);
  protected readonly receiptError = signal<string | null>(null);
  protected readonly year = signal(new Date().getFullYear());

  protected readonly label = label;
  protected readonly cop = formatCop;
  protected readonly phone = formatPhone;
  protected readonly months = MONTHS;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];
  protected readonly approved = computed(() => this.player().enrollment_status === 'approved');
  protected readonly whatsappUrl = computed(() =>
    whatsappLink(this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP, `Hola, quiero los datos de pago para ${this.player().full_name}.`),
  );

  protected readonly form = new FormGroup({
    concept: new FormControl<'enrollment' | 'monthly'>('monthly', { nonNullable: true, validators: [Validators.required] }),
    period_year: new FormControl(new Date().getFullYear(), { nonNullable: true }),
    period_month: new FormControl(new Date().getMonth() + 1, { nonNullable: true }),
    amount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1), Validators.max(5_000_000)] }),
    method: new FormControl<'cash' | 'nequi'>('nequi', { nonNullable: true, validators: [Validators.required] }),
    paid_on: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    reference_number: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  ngOnInit(): void {
    void this.store.load(); // fees and Nequi data
    this.load();
  }

  load(): void {
    this.api.account(this.player().id, this.year()).subscribe({
      next: (data) => this.account.set(data),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  changeYear(delta: number): void {
    this.year.update((y) => y + delta);
    this.account.set(null);
    this.load();
  }

  openForm(concept: 'enrollment' | 'monthly', month?: number, year?: number): void {
    const club = this.store.club();
    const amount = concept === 'enrollment' ? (club?.enrollment_fee ?? null) : this.player().monthly_fee;
    this.form.reset({
      concept,
      period_year: year ?? new Date().getFullYear(),
      period_month: month ?? new Date().getMonth() + 1,
      amount,
      method: 'nequi',
      paid_on: this.today,
      reference_number: '',
      notes: '',
    });
    this.receipt.set(null);
    this.receiptError.set(null);
    this.showForm.set(true);
  }

  pickReceipt(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.receiptError.set(null);
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.receiptError.set('Solo se aceptan imágenes JPG, PNG o WEBP.');
      this.receipt.set(null);
      return;
    }
    if (file && file.size > MAX_RECEIPT_MB * 1024 * 1024) {
      this.receiptError.set(`La imagen pesa más de ${MAX_RECEIPT_MB} MB.`);
      this.receipt.set(null);
      return;
    }
    this.receipt.set(file);
  }

  send(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (value.method === 'nequi' && !this.receipt()) {
      this.receiptError.set('Adjunta la foto o captura del comprobante de Nequi.');
    }
    if (value.paid_on > this.today) {
      this.notify.error('La fecha de pago no puede ser futura.');
      return;
    }
    if (this.form.invalid || this.receiptError()) return;

    const body = new FormData();
    body.append('concept', value.concept);
    if (value.concept === 'monthly') {
      body.append('period_year', String(value.period_year));
      body.append('period_month', String(value.period_month));
    }
    body.append('amount', String(value.amount));
    body.append('method', value.method);
    body.append('paid_on', value.paid_on);
    if (value.reference_number.trim()) body.append('reference_number', value.reference_number.trim());
    if (value.notes.trim()) body.append('notes', value.notes.trim());
    const file = this.receipt();
    if (file) body.append('receipt', file);

    this.sending.set(true);
    this.api.reportPayment(this.player().id, body).subscribe({
      next: () => {
        this.sending.set(false);
        this.showForm.set(false);
        this.notify.success('Pago reportado. El club lo verificará pronto.');
        this.load();
      },
      error: (err) => {
        this.sending.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  viewReceipt(payment: Payment): void {
    // Open the tab now (popup blockers allow it inside the click) and fill it when the image arrives
    const tab = window.open('', '_blank');
    this.api.receipt(payment.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (tab) tab.location.href = url;
        else window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err) => {
        tab?.close();
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  period(payment: Payment): string {
    if (payment.concept === 'enrollment') return 'Inscripción';
    return `${MONTHS[(payment.period_month ?? 1) - 1]} ${payment.period_year}`;
  }

  canPay(status: string): boolean {
    return status === 'due' || status === 'overdue' || status === 'upcoming';
  }
}
