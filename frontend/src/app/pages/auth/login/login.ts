import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { ConnectionService } from '../../../core/services/connection.service';
import { FieldError } from '../../../shared/forms/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  template: `
    <section class="auth-page">
      <div class="container">
        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <p class="eyebrow">Plataforma del club</p>
          <h1>Ingresar</h1>
          <p class="lead">Padres de familia, profesores y administradores.</p>

          @if (error(); as message) {
            <p class="alert" role="alert">{{ message }}</p>
          }

          <div class="form-grid login-grid">
            <div class="field field--wide">
              <label for="email">Correo</label>
              <input id="email" type="email" formControlName="email" autocomplete="email" inputmode="email" />
              <app-field-error [control]="form.controls.email" />
            </div>
            <div class="field field--wide">
              <label for="password">Contraseña</label>
              <div class="password">
                <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
                <button type="button" class="password__toggle" (click)="showPassword.set(!showPassword())" [attr.aria-pressed]="showPassword()">
                  {{ showPassword() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
              <app-field-error [control]="form.controls.password" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn--primary btn--block" [disabled]="loading()">
              {{ loading() ? (waking() ? 'Despertando el servidor…' : 'Ingresando…') : 'Ingresar' }}
            </button>
          </div>

          <div class="auth-links">
            <a routerLink="/recuperar-clave">¿Olvidaste tu contraseña?</a>
            <a routerLink="/registro">Inscribe a tu hijo</a>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: `
    .login-grid { grid-template-columns: 1fr; }
    .password { position: relative; }
    .password input { padding-right: 80px !important; }
    .password__toggle {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      border: 0; background: var(--color-gray-100); border-radius: var(--radius-sm);
      padding: 6px 10px; font-weight: 600; cursor: pointer;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly connection = inject(ConnectionService);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly waking = () => this.connection.status() === 'waking';

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.connection.whenOnline();
    } catch {
      this.loading.set(false);
      this.error.set('No pudimos conectar con el servidor. Intenta de nuevo en un momento.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const back = this.route.snapshot.queryParamMap.get('volver');
        const target = this.auth.mustChangePassword() ? '/cambiar-clave' : back || this.auth.homeUrl();
        void this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
