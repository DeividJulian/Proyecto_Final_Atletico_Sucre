import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { NotificationService } from '../../../core/services/notification.service';
import { PublicContentStore } from '../../../core/state/public-content.store';
import { playerForm, playerPayload } from '../../../shared/forms/family-forms';
import { PlayerFields } from '../../../shared/forms/player-fields';

/** Enroll one more child. The data authorization given at sign-up covers the new child too. */
@Component({
  selector: 'app-add-child',
  imports: [PlayerFields],
  template: `
    <section class="card">
      <h2 class="title">Inscribir otro hijo</h2>
      <p class="field-hint">Quedará pendiente hasta que el club apruebe la inscripción.</p>
      @if (error(); as message) {
        <p class="alert" role="alert">{{ message }}</p>
      }
      <app-player-fields [form]="form" prefix="new" />
      <p class="field-hint consent">
        Al enviar, la autorización de tratamiento de datos que aceptaste al registrarte (Ley 1581 de 2012) aplica
        también a este deportista.
      </p>
      <div class="form-actions">
        <button type="button" class="btn btn--primary" (click)="send()" [disabled]="saving()">{{ saving() ? 'Enviando…' : 'Enviar inscripción' }}</button>
      </div>
    </section>
  `,
  styles: `.title { font-size: 1.2rem; text-transform: uppercase; } .consent { margin-top: 16px; }`,
})
export class AddChild implements OnInit {
  private readonly api = inject(FamilyApiService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly store = inject(PublicContentStore);

  protected readonly form = playerForm();
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.store.load();
  }

  send(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.addPlayer(playerPayload(this.form)).subscribe({
      next: (player) => {
        this.notify.success(`Inscripción de ${player.first_names} enviada. El club la revisará pronto.`);
        void this.router.navigateByUrl('/padre');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err));
      },
    });
  }
}
