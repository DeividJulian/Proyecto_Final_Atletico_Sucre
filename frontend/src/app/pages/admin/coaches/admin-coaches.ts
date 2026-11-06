import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminApiService } from '../../../core/api/admin-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { CoachProfile } from '../../../core/models/staff';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { FieldError } from '../../../shared/forms/field-error';
import { personName, strongPassword } from '../../../shared/forms/validators';

/** Coaching staff: public profile (shown on the site) and, optionally, a login with role coach. */
@Component({
  selector: 'app-admin-coaches',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './admin-coaches.html',
  styleUrl: './admin-coaches.css',
})
export class AdminCoaches implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  protected readonly coaches = signal<CoachProfile[] | null>(null);
  protected readonly editing = signal<number | null | undefined>(undefined);
  protected readonly accountFor = signal<number | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    full_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), personName] }),
    role_title: new FormControl('Entrenador', { nonNullable: true, validators: [Validators.required] }),
    credentials: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),
    photo_position: new FormControl('top', { nonNullable: true }),
    display_order: new FormControl(0, { nonNullable: true }),
    is_public: new FormControl(true, { nonNullable: true }),
  });

  protected readonly accountForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPassword] }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.coaches().subscribe({
      next: (list) => this.coaches.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  open(coach: CoachProfile | null): void {
    this.accountFor.set(null);
    this.form.reset({
      full_name: coach?.full_name ?? '',
      role_title: coach?.role_title ?? 'Entrenador',
      credentials: coach?.credentials.join('\n') ?? '',
      photo_url: coach?.photo_url ?? '',
      photo_position: coach?.photo_position ?? 'top',
      display_order: coach?.display_order ?? (this.coaches()?.length ?? 0),
      is_public: coach?.is_public ?? true,
    });
    this.editing.set(coach ? coach.id : null);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .saveCoach(this.editing() ?? null, {
        full_name: v.full_name.trim(),
        role_title: v.role_title.trim(),
        credentials: v.credentials.split('\n').map((line) => line.trim()).filter(Boolean),
        photo_url: v.photo_url.trim() || null,
        photo_position: v.photo_position.trim() || 'top',
        display_order: Number(v.display_order) || 0,
        is_public: v.is_public,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(undefined);
          this.notify.success('Perfil guardado.');
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  openAccount(coach: CoachProfile): void {
    this.editing.set(undefined);
    this.accountForm.reset({ email: '', password: '' });
    this.accountFor.set(coach.id);
  }

  createAccount(coach: CoachProfile): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) return;
    const { email, password } = this.accountForm.getRawValue();
    this.saving.set(true);
    this.api.createCoachAccount(coach.id, email.trim().toLowerCase(), password).subscribe({
      next: () => {
        this.saving.set(false);
        this.accountFor.set(null);
        this.notify.success(`Cuenta creada. ${coach.full_name} deberá cambiar la contraseña al ingresar.`);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  async toggleActive(coach: CoachProfile, active: boolean): Promise<void> {
    if (!active) {
      const answer = await this.confirm.ask({
        title: 'Desactivar cuenta',
        message: `${coach.full_name} no podrá ingresar hasta que la reactives. Su perfil público no cambia.`,
        confirmText: 'Desactivar',
        danger: true,
      });
      if (answer === null) return;
    }
    this.api.setCoachActive(coach.id, active).subscribe({
      next: () => {
        this.notify.success(active ? 'Cuenta activada.' : 'Cuenta desactivada.');
        this.load();
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }
}
