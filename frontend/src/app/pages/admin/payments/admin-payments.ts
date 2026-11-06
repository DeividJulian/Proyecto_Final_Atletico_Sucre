import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AdminApiService } from '../../../core/api/admin-api.service';
import { MONTHS, label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Player } from '../../../core/models/family';
import { Overdue, PaymentAdmin } from '../../../core/models/staff';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCop, formatPhone } from '../../../core/utils/format';
import { downloadBlob, prepareTab, showBlob } from '../../../shared/blob';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { FieldError } from '../../../shared/forms/field-error';

type View = 'verificar' | 'todos' | 'mora' | 'efectivo';

@Component({
  selector: 'app-admin-payments',
  imports: [DatePipe, ReactiveFormsModule, FieldError],
  templateUrl: './admin-payments.html',
  styleUrl: './admin-payments.css',
})
export class AdminPayments implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);

  protected readonly view = signal<View>('verificar');
  protected readonly payments = signal<PaymentAdmin[] | null>(null);
  protected readonly overdue = signal<Overdue[] | null>(null);
  protected readonly players = signal<Player[]>([]);
  protected readonly busy = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly label = label;
  protected readonly cop = formatCop;
  protected readonly phone = formatPhone;
  protected readonly months = MONTHS;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  protected readonly cashForm = new FormGroup({
    player_id: new FormControl<number | null>(null, Validators.required),
    concept: new FormControl<'enrollment' | 'monthly'>('monthly', { nonNullable: true }),
    period_year: new FormControl(new Date().getFullYear(), { nonNullable: true }),
    period_month: new FormControl(new Date().getMonth() + 1, { nonNullable: true }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    paid_on: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    reference_number: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    const initial = this.route.snapshot.queryParamMap.get('vista') as View | null;
    this.show(initial && ['verificar', 'todos', 'mora', 'efectivo'].includes(initial) ? initial : 'verificar');
  }

  show(view: View): void {
    this.view.set(view);
    if (view === 'verificar' || view === 'todos') this.loadPayments();
    if (view === 'mora') this.loadOverdue();
    if (view === 'efectivo' && this.players().length === 0) {
      this.api.players({ status: 'approved' }).subscribe({ next: (list) => this.players.set(list) });
      this.api.players({ status: 'pending' }).subscribe({ next: (list) => this.players.update((all) => [...all, ...list]) });
    }
  }

  loadPayments(): void {
    this.payments.set(null);
    this.api.payments({ status: this.view() === 'verificar' ? 'pending_verification' : null }).subscribe({
      next: (list) => this.payments.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  loadOverdue(): void {
    this.overdue.set(null);
    this.api.overdue().subscribe({
      next: (list) => this.overdue.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  period(payment: PaymentAdmin): string {
    return payment.concept === 'enrollment' ? 'Inscripción' : `${MONTHS[(payment.period_month ?? 1) - 1]} ${payment.period_year}`;
  }

  receipt(payment: PaymentAdmin): void {
    const tab = prepareTab();
    this.api.receipt(payment.id).subscribe({
      next: (blob) => showBlob(tab, blob),
      error: (err) => {
        tab?.close();
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  verify(payment: PaymentAdmin): void {
    this.busy.set(payment.id);
    this.api.verifyPayment(payment.id).subscribe({
      next: () => {
        this.busy.set(null);
        this.notify.success(`Pago de ${payment.player_name} verificado.`);
        this.loadPayments();
      },
      error: (err) => {
        this.busy.set(null);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  async reject(payment: PaymentAdmin): Promise<void> {
    const reason = await this.confirm.ask({
      title: 'Rechazar pago',
      message: `${payment.guardian_name} verá el motivo y podrá reportar el pago de nuevo.`,
      confirmText: 'Rechazar',
      danger: true,
      askReason: { label: 'Motivo (ej. el comprobante no corresponde)', minLength: 5 },
    });
    if (!reason) return;
    this.busy.set(payment.id);
    this.api.rejectPayment(payment.id, reason).subscribe({
      next: () => {
        this.busy.set(null);
        this.notify.success('Pago rechazado.');
        this.loadPayments();
      },
      error: (err) => {
        this.busy.set(null);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  pickPlayer(): void {
    const player = this.players().find((p) => p.id === this.cashForm.controls.player_id.value);
    if (player && !this.cashForm.controls.amount.value) this.cashForm.controls.amount.setValue(player.monthly_fee);
  }

  registerCash(): void {
    this.cashForm.markAllAsTouched();
    if (this.cashForm.invalid) return;
    const v = this.cashForm.getRawValue();
    this.saving.set(true);
    this.api
      .registerPayment({
        player_id: v.player_id!,
        concept: v.concept,
        period_year: v.concept === 'monthly' ? v.period_year : null,
        period_month: v.concept === 'monthly' ? v.period_month : null,
        amount: Number(v.amount),
        method: 'cash',
        paid_on: v.paid_on,
        reference_number: v.reference_number.trim() || null,
        notes: v.notes.trim() || null,
      })
      .subscribe({
        next: (payment) => {
          this.saving.set(false);
          this.notify.success(`Pago en efectivo de ${payment.player_name} registrado y verificado.`);
          this.cashForm.reset({ concept: 'monthly', period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1, paid_on: this.today, player_id: null, amount: null, reference_number: '', notes: '' });
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  exportCsv(): void {
    this.api.exportPayments().subscribe({
      next: (blob) => downloadBlob(blob, `pagos-atletico-sucre-${this.today}.csv`),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }
}
