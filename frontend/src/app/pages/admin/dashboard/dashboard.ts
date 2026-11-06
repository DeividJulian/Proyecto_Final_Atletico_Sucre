import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminApiService } from '../../../core/api/admin-api.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Stats } from '../../../core/models/staff';
import { formatCop } from '../../../core/utils/format';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
    @if (error(); as message) {
      <p class="alert">{{ message }} <button type="button" class="btn btn--outline" (click)="load()">Reintentar</button></p>
    } @else if (stats(); as s) {
      <section class="tiles">
        <a class="tile tile--alert" routerLink="/admin/inscripciones">
          <strong>{{ s.players_pending }}</strong><span>Inscripciones pendientes</span>
        </a>
        <a class="tile tile--alert" routerLink="/admin/pagos">
          <strong>{{ s.payments_to_verify }}</strong><span>Pagos por verificar</span>
        </a>
        <div class="tile"><strong>{{ s.players_approved }}</strong><span>Deportistas activos</span></div>
        <div class="tile"><strong>{{ s.guardians }}</strong><span>Familias registradas</span></div>
        <div class="tile tile--ok"><strong>{{ s.players_up_to_date }}</strong><span>Al día</span></div>
        <a class="tile tile--bad" routerLink="/admin/pagos" [queryParams]="{ vista: 'mora' }">
          <strong>{{ s.players_overdue }}</strong><span>Con pagos pendientes</span>
        </a>
        <div class="tile"><strong>{{ cop(s.revenue_this_month) }}</strong><span>Recaudo verificado del mes</span></div>
        <div class="tile"><strong>{{ s.attendance_rate_30_days }}%</strong><span>Asistencia (30 días)</span></div>
      </section>

      <section class="card">
        <h2 class="title">Deportistas por categoría</h2>
        @if (s.by_category.length) {
          <ul class="bars" role="list">
            @for (row of s.by_category; track row.category_name) {
              <li>
                <span class="bars__label">{{ row.category_name }}</span>
                <span class="bars__track" aria-hidden="true"><span class="bars__fill" [style.width.%]="(row.players / maxCount()) * 100"></span></span>
                <span class="bars__value">{{ row.players }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">Aún no hay deportistas aprobados.</p>
        }
      </section>
    } @else {
      <div class="tiles">
        @for (n of [1, 2, 3, 4]; track n) {
          <div class="skeleton"></div>
        }
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: 16px; }
    .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .tile {
      display: grid; gap: 4px; padding: 16px; border-radius: var(--radius-md);
      background: var(--color-white); border: 1px solid var(--color-gray-200); border-top: 4px solid var(--color-gray-200);
      color: inherit; text-decoration: none;
    }
    .tile strong { font-family: var(--font-display); font-size: clamp(1.4rem, 6vw, 2rem); line-height: 1.1; }
    .tile span { font-size: 0.85rem; color: var(--color-gray-500); }
    .tile--alert { border-top-color: var(--color-gold); }
    .tile--ok { border-top-color: var(--color-success); }
    .tile--bad { border-top-color: var(--color-red); }
    a.tile:hover { box-shadow: var(--shadow-md); }
    .title { font-size: 1.15rem; text-transform: uppercase; }
    .bars { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    .bars li { display: grid; grid-template-columns: minmax(110px, 160px) 1fr 32px; gap: 10px; align-items: center; }
    .bars__label { font-size: 0.9rem; font-weight: 600; }
    .bars__track { height: 14px; border-radius: 999px; background: var(--color-gray-100); overflow: hidden; }
    .bars__fill { display: block; height: 100%; background: var(--color-red); border-radius: 999px; }
    .bars__value { text-align: right; font-weight: 700; }
    @media (min-width: 900px) { .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  `,
})
export class AdminDashboard implements OnInit {
  private readonly api = inject(AdminApiService);
  protected readonly stats = signal<Stats | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cop = formatCop;
  protected readonly maxCount = computed(() => Math.max(1, ...(this.stats()?.by_category.map((r) => r.players) ?? [1])));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.api.stats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }
}
