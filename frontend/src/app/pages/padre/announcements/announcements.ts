import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Announcement } from '../../../core/models/family';

@Component({
  selector: 'app-parent-announcements',
  imports: [DatePipe],
  template: `
    @if (error(); as message) {
      <p class="alert">{{ message }}</p>
    } @else if (items(); as list) {
      @if (list.length) {
        <ul class="news" role="list">
          @for (item of list; track item.id) {
            <li class="card item" [class.item--general]="!item.category_id">
              <span class="badge" [class.badge--red]="!item.category_id">{{ item.category_name ?? 'Todo el club' }}</span>
              <h2>{{ item.title }}</h2>
              <time>{{ item.created_at | date: 'longDate' }}</time>
              <p>{{ item.body }}</p>
            </li>
          }
        </ul>
      } @else {
        <p class="empty card">No hay avisos por ahora. Aquí verás los avisos del club y de las categorías de tus hijos.</p>
      }
    } @else {
      <div class="skeleton"></div>
    }
  `,
  styles: `
    .news { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
    .item { display: grid; gap: 4px; border-left: 5px solid var(--color-gold); }
    .item--general { border-left-color: var(--color-red); }
    .item h2 { font-size: 1.2rem; margin: 6px 0 0; }
    .item time { font-size: 0.82rem; color: var(--color-gray-500); }
    .item p { margin: 6px 0 0; white-space: pre-line; }
  `,
})
export class ParentAnnouncements implements OnInit {
  private readonly api = inject(FamilyApiService);
  protected readonly items = signal<Announcement[] | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.announcements().subscribe({
      next: (list) => this.items.set(list),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }
}
