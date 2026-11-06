import { Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { ConnectionService } from '../../../core/services/connection.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PublicContentStore } from '../../../core/state/public-content.store';
import { estimateCategory } from '../../../core/utils/category';
import { formatCop } from '../../../core/utils/format';
import { guardianForm, guardianPayload, playerForm, playerPayload, PlayerForm } from '../../../shared/forms/family-forms';
import { FieldError } from '../../../shared/forms/field-error';
import { GuardianFields } from '../../../shared/forms/guardian-fields';
import { PlayerFields } from '../../../shared/forms/player-fields';
import { matchFields, strongPassword } from '../../../shared/forms/validators';

const MAX_PLAYERS = 6;

/** Parent sign-up in 4 steps. Everything is sent in one request at the end (one transaction in the API). */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FieldError, GuardianFields, PlayerFields],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly connection = inject(ConnectionService);
  protected readonly store = inject(PublicContentStore);

  protected readonly steps = ['Acudiente', 'Hijos', 'Autorizaciones', 'Confirmar'];
  protected readonly step = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly maxPlayers = MAX_PLAYERS;
  protected readonly label = label;
  protected readonly cop = formatCop;

  private readonly top = viewChild<ElementRef<HTMLElement>>('top');

  protected readonly account = new FormGroup(
    {
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPassword] }),
      confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchFields('password', 'confirm') },
  );
  protected readonly guardian = guardianForm();
  protected readonly players = new FormArray<PlayerForm>([playerForm()]);
  protected readonly consents = new FormGroup({
    data: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    image: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.store.load(); // categories (category preview) and the data policy text
  }

  addPlayer(): void {
    if (this.players.length >= MAX_PLAYERS) return;
    const previous = this.players.at(this.players.length - 1).getRawValue();
    // Siblings usually share last names, EPS and emergency contact
    this.players.push(
      playerForm({
        last_names: previous.last_names,
        eps: previous.eps,
        emergency_contact_name: previous.emergency_contact_name,
        emergency_contact_phone: previous.emergency_contact_phone,
      }),
    );
  }

  removePlayer(index: number): void {
    if (this.players.length > 1) this.players.removeAt(index);
  }

  /** Validates the current step before moving forward. */
  next(): void {
    const groups = [[this.account, this.guardian], [this.players], [this.consents], []][this.step()];
    groups.forEach((group) => group.markAllAsTouched());
    if (groups.some((group) => group.invalid)) {
      this.error.set('Revisa los campos marcados en rojo.');
      this.focusFirstError();
      return;
    }
    if (this.step() === 1 && this.duplicatedDocuments()) {
      this.error.set('Hay dos deportistas con el mismo número de documento.');
      return;
    }
    this.error.set(null);
    this.goTo(this.step() + 1);
  }

  back(): void {
    this.error.set(null);
    this.goTo(this.step() - 1);
  }

  goTo(step: number): void {
    this.step.set(Math.max(0, Math.min(step, this.steps.length - 1)));
    this.top()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  category(index: number): string {
    const value = this.players.at(index).getRawValue();
    return estimateCategory(value.birth_date, value.sex, this.store.categories()) ?? '—';
  }

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.connection.whenOnline();
    } catch {
      this.loading.set(false);
      this.error.set('No pudimos conectar con el servidor. Intenta de nuevo en un momento.');
      return;
    }
    const { email, password } = this.account.getRawValue();
    this.auth
      .register({
        email: email.trim().toLowerCase(),
        password,
        guardian: guardianPayload(this.guardian),
        players: this.players.controls.map((form) => playerPayload(form)),
        accept_data_policy: this.consents.controls.data.value,
        accept_image_use: this.consents.controls.image.value,
      })
      .subscribe({
        next: () => {
          this.notify.success('¡Registro enviado! El club revisará la inscripción y te avisará cuando sea aprobada.');
          void this.router.navigateByUrl('/padre');
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(apiErrorMessage(err));
          this.top()?.nativeElement.scrollIntoView?.({ behavior: 'smooth' });
        },
      });
  }

  private duplicatedDocuments(): boolean {
    const documents = this.players.controls.map((form) => form.getRawValue().document_number.replace(/[\s.-]/g, ''));
    return new Set(documents).size !== documents.length;
  }

  private focusFirstError(): void {
    setTimeout(() => document.querySelector<HTMLElement>('.register input.ng-invalid, .register select.ng-invalid')?.focus());
  }
}
