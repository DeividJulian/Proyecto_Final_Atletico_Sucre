import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService, CrudApi } from '../../../core/api/admin-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { EnrollmentStatus, Player } from '../../../core/models/family';
import { Category } from '../../../core/models/public';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCop } from '../../../core/utils/format';
import { POSITIONS } from '../../profesor/player/coach-player';

interface Draft {
  category_id: number | null;
  monthly_fee: number;
  enrollment_status: EnrollmentStatus;
  jersey_number: number | null;
  position: string | null;
}

@Component({
  selector: 'app-admin-players',
  imports: [FormsModule],
  template: `
    <form class="card filters" (ngSubmit)="search()">
      <div class="field">
        <label for="q">Buscar</label>
        <input id="q" name="q" [(ngModel)]="q" placeholder="Nombre o documento" />
      </div>
      <div class="field">
        <label for="f-cat">Categoría</label>
        <select id="f-cat" name="cat" [(ngModel)]="categoryId" (ngModelChange)="search()">
          <option [ngValue]="null">Todas</option>
          @for (c of categories(); track c.id) {
            <option [ngValue]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="f-status">Estado</label>
        <select id="f-status" name="status" [(ngModel)]="status" (ngModelChange)="search()">
          <option [ngValue]="null">Todos</option>
          @for (s of statuses; track s) {
            <option [ngValue]="s">{{ label('enrollment', s) }}</option>
          }
        </select>
      </div>
      <button type="submit" class="btn btn--primary">Buscar</button>
    </form>

    @if (players(); as list) {
      <p class="field-hint">{{ list.length }} deportista(s)</p>
      <ul class="list" role="list">
        @for (p of list; track p.id) {
          <li class="card item">
            <div class="item__head">
              <div>
                <h3>{{ p.full_name }}</h3>
                <p class="field-hint">{{ p.category?.name ?? 'Sin categoría' }} · {{ p.age }} años · {{ cop(p.monthly_fee) }}/mes · #{{ p.jersey_number ?? '–' }} {{ label('position', p.position) }}</p>
              </div>
              <span class="pill" [class]="'pill pill--' + p.enrollment_status">{{ label('enrollment', p.enrollment_status) }}</span>
            </div>
            @if (drafts[p.id]; as d) {
              <div class="form-grid">
                <div class="field">
                  <label [for]="'c' + p.id">Categoría</label>
                  <select [id]="'c' + p.id" [(ngModel)]="d.category_id">
                    <option [ngValue]="null">Sin categoría</option>
                    @for (c of categories(); track c.id) {
                      <option [ngValue]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label [for]="'s' + p.id">Estado</label>
                  <select [id]="'s' + p.id" [(ngModel)]="d.enrollment_status">
                    @for (s of statuses; track s) {
                      <option [ngValue]="s">{{ label('enrollment', s) }}</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label [for]="'f' + p.id">Mensualidad (COP)</label>
                  <input [id]="'f' + p.id" type="number" min="0" [(ngModel)]="d.monthly_fee" />
                </div>
                <div class="field">
                  <label [for]="'j' + p.id">Dorsal</label>
                  <input [id]="'j' + p.id" type="number" min="1" max="99" [(ngModel)]="d.jersey_number" />
                </div>
                <div class="field field--wide">
                  <label [for]="'p' + p.id">Posición</label>
                  <select [id]="'p' + p.id" [(ngModel)]="d.position">
                    <option [ngValue]="null">Sin definir</option>
                    @for (o of positions; track o.value) {
                      <option [ngValue]="o.value">{{ o.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="actions">
                <button type="button" class="btn btn--primary" (click)="save(p)" [disabled]="busy() === p.id">Guardar</button>
                <button type="button" class="btn btn--outline" (click)="edit(p, false)">Cancelar</button>
              </div>
            } @else {
              <button type="button" class="btn btn--outline edit" (click)="edit(p, true)">Editar</button>
            }
          </li>
        } @empty {
          <li class="empty card">No hay deportistas con esos filtros.</li>
        }
      </ul>
    } @else {
      <div class="skeleton"></div>
    }
  `,
  styles: `
    :host { display: grid; gap: 12px; }
    .filters { display: grid; gap: 12px; align-items: end; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
    .item { display: grid; gap: 12px; }
    .item__head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .item h3 { font-size: 1.1rem; margin: 0 0 2px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .edit { justify-self: start; min-height: 40px; padding: 6px 16px; }
    @media (min-width: 768px) { .filters { grid-template-columns: 2fr 1fr 1fr auto; } }
    @media (min-width: 1100px) { .list { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; } }
  `,
})
export class AdminPlayers implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly crud = inject(CrudApi);
  private readonly notify = inject(NotificationService);

  protected q = '';
  protected categoryId: number | null = null;
  protected status: EnrollmentStatus | null = 'approved';
  protected readonly statuses: EnrollmentStatus[] = ['approved', 'pending', 'rejected', 'inactive'];
  protected readonly players = signal<Player[] | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly busy = signal<number | null>(null);
  protected drafts: Record<number, Draft | undefined> = {};
  protected readonly label = label;
  protected readonly cop = formatCop;
  protected readonly positions = POSITIONS;

  ngOnInit(): void {
    this.crud.list<Category>('/admin/categories').subscribe({ next: (list) => this.categories.set(list) });
    this.search();
  }

  search(): void {
    this.players.set(null);
    this.drafts = {};
    this.api.players({ q: this.q.trim(), category_id: this.categoryId, status: this.status }).subscribe({
      next: (list) => this.players.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  edit(player: Player, open: boolean): void {
    this.drafts = {
      ...this.drafts,
      [player.id]: open
        ? {
            category_id: player.category?.id ?? null,
            monthly_fee: player.monthly_fee,
            enrollment_status: player.enrollment_status,
            jersey_number: player.jersey_number,
            position: player.position,
          }
        : undefined,
    };
    this.players.update((list) => (list ? [...list] : list));
  }

  save(player: Player): void {
    const draft = this.drafts[player.id];
    if (!draft) return;
    this.busy.set(player.id);
    const jersey = draft.jersey_number === null || (draft.jersey_number as unknown) === '' ? null : Number(draft.jersey_number);
    this.api
      .updatePlayer(player.id, { ...draft, monthly_fee: Number(draft.monthly_fee), jersey_number: jersey })
      .subscribe({
        next: () => {
          this.busy.set(null);
          this.notify.success(`Datos de ${player.first_names} guardados.`);
          this.search();
        },
        error: (err) => {
          this.busy.set(null);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }
}
