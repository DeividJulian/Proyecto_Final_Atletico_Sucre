import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Player } from '../../../core/models/family';
import { formatCop } from '../../../core/utils/format';
import { PrivatePhoto } from '../../../shared/private-photo/private-photo';

@Component({
  selector: 'app-children',
  imports: [RouterLink, PrivatePhoto],
  template: `
    @if (loading()) {
      <div class="kids">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    } @else if (error(); as message) {
      <p class="alert">{{ message }} <button class="btn btn--outline" type="button" (click)="load()">Reintentar</button></p>
    } @else if (players().length === 0) {
      <div class="empty card">
        <p>Todavía no tienes hijos inscritos.</p>
        <a class="btn btn--primary" routerLink="/padre/inscribir">Inscribir a mi hijo</a>
      </div>
    } @else {
      <ul class="kids" role="list">
        @for (player of players(); track player.id) {
          <li class="card kid">
            <div class="kid__head">
              <app-private-photo
                [source]="player.has_photo ? photoOf(player) : null"
                [initials]="initials(player)"
                [alt]="'Foto de ' + player.first_names"
                imgClass="kid__photo"
              />
              <div>
                <h2 class="kid__name">{{ player.full_name }}</h2>
                <span class="pill" [class]="'pill pill--' + player.enrollment_status">{{ label('enrollment', player.enrollment_status) }}</span>
              </div>
            </div>
            <dl class="data-list">
              <div><dt>Categoría</dt><dd>{{ player.category?.name ?? 'Por asignar' }}</dd></div>
              <div><dt>Edad</dt><dd>{{ player.age }} años</dd></div>
              <div><dt>Entrena en</dt><dd>{{ label('trainingShift', player.training_shift) }}</dd></div>
              <div><dt>Mensualidad</dt><dd>{{ cop(player.monthly_fee) }}</dd></div>
            </dl>
            @if (player.enrollment_status === 'pending') {
              <p class="notice kid__note">El club está revisando la inscripción. Te avisaremos por correo cuando sea aprobada.</p>
            }
            @if (player.enrollment_status === 'rejected' && player.rejection_reason) {
              <p class="alert kid__note">Motivo: {{ player.rejection_reason }}</p>
            }
            <a class="btn btn--primary btn--block" [routerLink]="['/padre/hijos', player.id]">Ver horario, asistencia y pagos</a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .kids { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .kid { display: grid; gap: 14px; align-content: start; }
    .kid__head { display: flex; gap: 14px; align-items: center; }
    :host ::ng-deep .kid__photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid var(--color-gold); flex-shrink: 0; }
    .kid__name { font-size: 1.25rem; margin: 0 0 4px; }
    .kid__note { margin: 0; font-size: 0.9rem; }
    @media (min-width: 768px) { .kids { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  `,
})
export class Children implements OnInit {
  private readonly api = inject(FamilyApiService);
  protected readonly players = signal<Player[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly label = label;
  protected readonly cop = formatCop;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.players().subscribe({
      next: (players) => {
        this.players.set(players);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  /** Same loader for the same child, so the photo is downloaded once (signal inputs compare by reference). */
  private readonly loaders = new Map<number, () => Observable<Blob>>();

  photoOf(player: Player): () => Observable<Blob> {
    let loader = this.loaders.get(player.id);
    if (!loader) {
      loader = () => this.api.photo(player.id);
      this.loaders.set(player.id, loader);
    }
    return loader;
  }

  initials(player: Player): string {
    return `${player.first_names[0] ?? ''}${player.last_names[0] ?? ''}`;
  }
}
