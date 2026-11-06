import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/services/notification.service';
import { FieldError } from '../../../shared/forms/field-error';
import { matchFields, strongPassword } from '../../../shared/forms/validators';

/** Two steps: ask for a code by email → type the code and the new password. */
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-page">
      <div class="container">
        <div class="auth-card">
          <p class="eyebrow">Recuperar acceso</p>
          <h1>¿Olvidaste tu contraseña?</h1>

          @if (error(); as message) {
            <p class="alert" role="alert">{{ message }}</p>
          }

          @if (step() === 'email') {
            <p class="lead">Escribe tu correo y te enviaremos un código de 6 dígitos.</p>
            <form [formGroup]="emailForm" (ngSubmit)="requestCode()" novalidate>
              <div class="field">
                <label for="email">Correo</label>
                <input id="email" type="email" formControlName="email" autocomplete="email" />
                <app-field-error [control]="emailForm.controls.email" />
              </div>
              <div class="form-actions">
                <button class="btn btn--primary btn--block" type="submit" [disabled]="loading()">
                  {{ loading() ? 'Enviando…' : 'Enviar código' }}
                </button>
              </div>
            </form>
          } @else {
            <p class="alert alert--ok">{{ info() }}</p>
            <form [formGroup]="resetForm" (ngSubmit)="reset()" novalidate class="form-grid reset-grid">
              <div class="field">
                <label for="code">Código de 6 dígitos</label>
                <input id="code" formControlName="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" />
                <app-field-error [control]="resetForm.controls.code" />
              </div>
              <div class="field">
                <label for="new">Nueva contraseña</label>
                <input id="new" type="password" formControlName="password" autocomplete="new-password" />
                <app-field-error [control]="resetForm.controls.password" />
              </div>
              <div class="field">
                <label for="confirm">Repite la contraseña</label>
                <input id="confirm" type="password" formControlName="confirm" autocomplete="new-password" />
                @if (resetForm.hasError('mismatch') && resetForm.controls.confirm.touched) {
                  <p class="field-error">Las contraseñas no coinciden.</p>
                }
              </div>
              <div class="form-actions">
                <button class="btn btn--primary btn--block" type="submit" [disabled]="loading()">
                  {{ loading() ? 'Guardando…' : 'Cambiar contraseña' }}
                </button>
                <button class="btn btn--outline btn--block" type="button" (click)="step.set('email')">Pedir otro código</button>
              </div>
            </form>
          }

          <div class="auth-links"><a routerLink="/ingresar">Volver a ingresar</a></div>
        </div>
      </div>
    </section>
  `,
  styles: `.reset-grid { grid-template-columns: 1fr; }`,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly step = signal<'email' | 'code'>('email');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal('');

  protected readonly emailForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  protected readonly resetForm = new FormGroup(
    {
      code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPassword] }),
      confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchFields('password', 'confirm') },
  );

  requestCode(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.forgotPassword(this.emailForm.getRawValue().email).subscribe({
      next: (answer) => {
        this.loading.set(false);
        this.info.set(answer.detail);
        this.step.set('code');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }

  reset(): void {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { code, password } = this.resetForm.getRawValue();
    this.auth.resetPassword(this.emailForm.getRawValue().email, code, password).subscribe({
      next: (answer) => {
        this.notify.success(answer.detail);
        void this.router.navigateByUrl('/ingresar');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
