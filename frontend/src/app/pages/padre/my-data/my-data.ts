import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Guardian } from '../../../core/models/family';
import { NotificationService } from '../../../core/services/notification.service';
import { GuardianForm, guardianForm, guardianPayload } from '../../../shared/forms/family-forms';
import { GuardianFields } from '../../../shared/forms/guardian-fields';

/** The parent edits their own profile. The document identifies them and stays locked. */
@Component({
  selector: 'app-my-data',
  imports: [GuardianFields, RouterLink],
  template: `
    @if (error(); as message) {
      <p class="alert">{{ message }}</p>
    }
    @if (form) {
      <section class="card">
        <h2 class="title">Mis datos de acudiente</h2>
        <p class="field-hint">Correo de la cuenta: <strong>{{ guardian()?.email }}</strong>. El documento no se puede cambiar desde aquí.</p>
        <app-guardian-fields [form]="form" />
        <div class="form-actions">
          <button type="button" class="btn btn--primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Guardando…' : 'Guardar cambios' }}</button>
          <a class="btn btn--outline" routerLink="/cambiar-clave">Cambiar contraseña</a>
        </div>
      </section>
    } @else if (!error()) {
      <div class="skeleton"></div>
    }
  `,
  styles: `.title { font-size: 1.2rem; text-transform: uppercase; }`,
})
export class MyData implements OnInit {
  private readonly api = inject(FamilyApiService);
  private readonly notify = inject(NotificationService);
  protected readonly guardian = signal<Guardian | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected form: GuardianForm | null = null;

  ngOnInit(): void {
    this.api.guardian().subscribe({
      next: (guardian) => {
        this.guardian.set(guardian);
        this.form = guardianForm(guardian);
        this.form.controls.document_type.disable();
        this.form.controls.document_number.disable();
      },
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  save(): void {
    const form = this.form;
    if (!form) return;
    form.markAllAsTouched();
    if (form.invalid) {
      this.notify.error('Revisa los campos marcados en rojo.');
      return;
    }
    const { document_type: _t, document_number: _n, ...changes } = guardianPayload(form);
    this.saving.set(true);
    this.api.updateGuardian(changes).subscribe({
      next: (guardian) => {
        this.guardian.set(guardian);
        this.saving.set(false);
        this.notify.success('Tus datos quedaron actualizados.');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }
}
