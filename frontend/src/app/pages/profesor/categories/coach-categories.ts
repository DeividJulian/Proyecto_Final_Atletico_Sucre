import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CoachApiService } from '../../../core/api/coach-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Player } from '../../../core/models/family';
import { Category } from '../../../core/models/public';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-coach-categories',
  imports: [RouterLink],
  template: `
    @if (error(); as message) {
      <p class="alert">{{ message }}</p>
    } @else if (categories(); as list) {
      @if (list.length === 0) {
        <p class="empty card">Todavía no tienes categorías asignadas. El administrador te las asigna desde su panel.</p>
      } @else {
        <div class="chips" role="group" aria-label="Elige una categoría">
          @for (category of list; track category.id) {
            <button type="button" class="chip" [attr.aria-pressed]="selected()?.id === category.id" (click)="select(category)">
              {{ category.name }}
            </button>
          }
        </div>

        @if (selected(); as category) {
          <section class="card">
            <h2 class="title">{{ category.name }}</h2>
            <p class="field-hint">Nacidos entre {{ category.birth_year_from }} y {{ category.birth_year_to }} · solo deportistas aprobados</p>
            @if (players(); as kids) {
              @if (kids.length) {
                <ul class="players" role="list">
                  @for (player of kids; track player.id) {
                    <li>
                      <a [routerLink]="[base, 'deportistas', player.id]">
                        <span class="players__jersey">{{ player.jersey_number ?? '–' }}</span>
                        <span class="players__name">
                          <strong>{{ player.full_name }}</strong>
                          <small>{{ player.age }} años · {{ label('position', player.position) }} · {{ label('trainingShift', player.training_shift) }}</small>
                        </span>
                        <span aria-hidden="true">›</span>
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="empty">Esta categoría todavía no tiene deportistas aprobados.</p>
              }
            } @else {
              <div class="skeleton"></div>
            }
          </section>
        }
      }
    } @else {
      <div class="skeleton"></div>
    }
  `,
  styles: `
    :host { display: grid; gap: 16px; }
    .title { font-size: 1.3rem; text-transform: uppercase; margin: 0; }
    .players { list-style: none; padding: 0; margin: 12px 0 0; }
    .players a {
      display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center;
      padding: 12px 4px; border-bottom: 1px solid var(--color-gray-100); color: inherit; text-decoration: none;
    }
    .players a:hover { background: var(--color-gray-50); }
    .players__jersey {
      width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%;
      background: var(--color-black); color: var(--color-gold-light); font-weight: 700;
    }
    .players__name { display: grid; }
    .players__name small { color: var(--color-gray-500); }
  `,
})
export class CoachCategories implements OnInit {
  private readonly api = inject(CoachApiService);
  private readonly notify = inject(NotificationService);
  protected readonly categories = signal<Category[] | null>(null);
  protected readonly selected = signal<Category | null>(null);
  protected readonly players = signal<Player[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly label = label;
  protected readonly base = '/profesor';

  ngOnInit(): void {
    this.api.categories().subscribe({
      next: (list) => {
        this.categories.set(list);
        if (list.length) this.select(list[0]);
      },
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  select(category: Category): void {
    this.selected.set(category);
    this.players.set(null);
    this.api.players(category.id).subscribe({
      next: (list) => this.players.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }
}
