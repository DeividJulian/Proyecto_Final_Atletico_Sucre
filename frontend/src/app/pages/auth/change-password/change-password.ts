import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/services/notification.service';
import { FieldError } from '../../../shared/forms/field-error';
import { matchFields, strongPassword } from '../../../shared/forms/validators';

/** Change of password. Mandatory (no way around it) when the account has must_change_password. */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, FieldError],
  template: `
    <section class="auth-page">
      <div class="container">
        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="eyebrow">Seguridad de tu cuenta</p>
          <h1>Cambiar contraseña</h1>
          @if (auth.mustChangePassword()) {
            <p class="notice">Por seguridad, cambia la contraseña inicial antes de continuar.</p>
          }
          @if (error(); as message) {
            <p class="alert" role="alert">{{ message }}</p>
          }
          <div class="form-grid single">
            <div class="field">
              <label for="current">Contraseña actual</label>
              <input id="current" type="password" formControlName="current" autocomplete="current-password" />
              <app-field-error [control]="form.controls.current" />
            </div>
            <div class="field">
              <label for="new">Nueva contraseña</label>
              <input id="new" type="password" formControlName="password" autocomplete="new-password" />
              <app-field-error [control]="form.controls.password" />
              <p class="field-hint">Mínimo 8 caracteres, con letras y números.</p>
            </div>
            <div class="field">
              <label for="confirm">Repite la nueva contraseña</label>
              <input id="confirm" type="password" formControlName="confirm" autocomplete="new-password" />
              @if (form.hasError('mismatch') && form.controls.confirm.touched) {
                <p class="field-error">Las contraseñas no coinciden.</p>
              }
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary btn--block" type="submit" [disabled]="loading()">
              {{ loading() ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
            <button class="btn btn--outline btn--block" type="button" (click)="auth.logout()">Cerrar sesión</button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: `.single { grid-template-columns: 1fr; }`,
})
export class ChangePassword {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = new FormGroup(
    {
      current: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPassword] }),
      confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchFields('password', 'confirm') },
  );

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { current, password } = this.form.getRawValue();
    if (current === password) {
      this.error.set('La nueva contraseña debe ser distinta de la actual.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.changePassword(current, password).subscribe({
      next: () => {
        this.notify.success('Contraseña actualizada.');
        void this.router.navigateByUrl(this.auth.homeUrl());
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
