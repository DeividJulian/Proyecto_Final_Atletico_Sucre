import { Component, OnInit, inject, signal } from '@angular/core';

import { AdminApiService, CrudApi } from '../../../core/api/admin-api.service';
import { Category, Venue } from '../../../core/models/public';
import { CoachProfile } from '../../../core/models/staff';
import { formatTime } from '../../../core/utils/format';
import { CrudConfig, CrudPage } from '../../../shared/crud/crud-page';

interface TrainingSession {
  id: number;
  category_id: number;
  venue_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  shift: string;
}

type Tab = 'categorias' | 'sedes' | 'horarios';

const WEEKDAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SHIFTS: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde', all: 'Ambas jornadas' };

/** Categories (birth-year ranges and coach in charge), venues and weekly schedule, with the generic CRUD. */
@Component({
  selector: 'app-admin-catalog',
  imports: [CrudPage],
  template: `
    <div class="chips" role="tablist" aria-label="Catálogo">
      <button type="button" class="chip" role="tab" [attr.aria-pressed]="tab() === 'categorias'" (click)="tab.set('categorias')">Categorías</button>
      <button type="button" class="chip" role="tab" [attr.aria-pressed]="tab() === 'sedes'" (click)="tab.set('sedes')">Sedes</button>
      <button type="button" class="chip" role="tab" [attr.aria-pressed]="tab() === 'horarios'" (click)="tab.set('horarios')">Horarios</button>
    </div>
    @switch (tab()) {
      @case ('categorias') { <app-crud-page [config]="categoryConfig" /> }
      @case ('sedes') { <app-crud-page [config]="venueConfig" /> }
      @case ('horarios') {
        <p class="notice">Cada horario es un entrenamiento semanal de una categoría. La jornada define quién lo ve: los de jornada escolar contraria, o todos.</p>
        <app-crud-page [config]="sessionConfig" />
      }
    }
  `,
  styles: `:host { display: grid; gap: 16px; }`,
})
export class AdminCatalog implements OnInit {
  private readonly crud = inject(CrudApi);
  private readonly admin = inject(AdminApiService);
  protected readonly tab = signal<Tab>('categorias');

  private readonly categories = signal<Category[]>([]);
  private readonly venues = signal<Venue[]>([]);
  private readonly coaches = signal<CoachProfile[]>([]);

  ngOnInit(): void {
    this.crud.list<Category>('/admin/categories').subscribe({ next: (list) => this.categories.set(list) });
    this.crud.list<Venue>('/admin/venues').subscribe({ next: (list) => this.venues.set(list) });
    this.admin.coaches().subscribe({ next: (list) => this.coaches.set(list) });
  }

  private categoryName = (id: number) => this.categories().find((c) => c.id === id)?.name ?? `#${id}`;
  private venueName = (id: number) => this.venues().find((v) => v.id === id)?.name ?? `#${id}`;
  private coachName = (id: number | null) => (id === null ? 'Sin asignar' : (this.coaches().find((c) => c.id === id)?.full_name ?? `#${id}`));

  protected readonly categoryConfig: CrudConfig<Category> = {
    path: '/admin/categories',
    singular: 'Categoría',
    heading: (c) => c.name,
    deleteWarning: 'Sus horarios se borran y los deportistas quedan sin categoría.',
    columns: [
      { label: 'Años de nacimiento', value: (c) => `${c.birth_year_from} – ${c.birth_year_to}` },
      { label: 'Tipo', value: (c) => (c.gender === 'female' ? 'Femenina' : 'Mixta') },
      { label: 'Profesor a cargo', value: (c) => this.coachName(c.coach_id) },
      { label: 'Estado', value: (c) => (c.is_active ? 'Activa' : 'Inactiva') },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 60, wide: true },
      { key: 'birth_year_from', label: 'Año inicial', type: 'number', required: true, min: 1990, max: 2100 },
      { key: 'birth_year_to', label: 'Año final', type: 'number', required: true, min: 1990, max: 2100 },
      { key: 'gender', label: 'Tipo', type: 'select', required: true, default: 'mixed',
        options: () => [{ value: 'mixed', label: 'Mixta' }, { value: 'female', label: 'Femenina' }] },
      { key: 'coach_id', label: 'Profesor a cargo', type: 'select',
        options: () => [{ value: null, label: 'Sin asignar' }, ...this.coaches().map((c) => ({ value: c.id, label: c.full_name + (c.has_account ? '' : ' (sin cuenta)') }))] },
      { key: 'description', label: 'Descripción', type: 'textarea', maxLength: 300 },
      { key: 'display_order', label: 'Orden', type: 'number', default: 0 },
      { key: 'is_active', label: 'Activa (aparece en el sitio y en el registro)', type: 'checkbox', default: true },
    ],
  };

  protected readonly venueConfig: CrudConfig<Venue> = {
    path: '/admin/venues',
    singular: 'Sede',
    heading: (v) => v.name,
    deleteWarning: 'No se puede eliminar si tiene horarios asignados.',
    columns: [
      { label: 'Tipo', value: (v) => (v.is_main ? 'Sede principal' : 'Sede alterna') },
      { label: 'Superficie', value: (v) => v.surface ?? '—' },
      { label: 'Dirección', value: (v) => v.address ?? '—' },
      { label: 'Estado', value: (v) => (v.is_active ? 'Activa' : 'Inactiva') },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 100, wide: true },
      { key: 'surface', label: 'Superficie', type: 'text', maxLength: 60 },
      { key: 'address', label: 'Dirección', type: 'text', maxLength: 160 },
      { key: 'maps_url', label: 'Enlace de Google Maps', type: 'text', maxLength: 500, wide: true, hint: 'Opcional. Si está vacío se busca el nombre en Ipiales.' },
      { key: 'description', label: 'Descripción', type: 'textarea', maxLength: 300 },
      { key: 'is_main', label: 'Sede principal', type: 'checkbox' },
      { key: 'is_active', label: 'Activa', type: 'checkbox', default: true },
    ],
  };

  protected readonly sessionConfig: CrudConfig<TrainingSession> = {
    path: '/admin/training-sessions',
    singular: 'Horario',
    heading: (s) => `${this.categoryName(s.category_id)} · ${WEEKDAYS[s.weekday]}`,
    columns: [
      { label: 'Hora', value: (s) => `${formatTime(s.start_time)} – ${formatTime(s.end_time)}` },
      { label: 'Jornada', value: (s) => SHIFTS[s.shift] ?? s.shift },
      { label: 'Sede', value: (s) => this.venueName(s.venue_id) },
    ],
    fields: [
      { key: 'category_id', label: 'Categoría', type: 'select', required: true,
        options: () => this.categories().map((c) => ({ value: c.id, label: c.name })) },
      { key: 'venue_id', label: 'Sede', type: 'select', required: true,
        options: () => this.venues().map((v) => ({ value: v.id, label: v.name })) },
      { key: 'weekday', label: 'Día', type: 'select', required: true, default: 2,
        options: () => WEEKDAYS.slice(1).map((label, i) => ({ value: i + 1, label })) },
      { key: 'shift', label: 'Jornada', type: 'select', required: true, default: 'all',
        options: () => Object.entries(SHIFTS).map(([value, label]) => ({ value, label })) },
      { key: 'start_time', label: 'Hora de inicio', type: 'time', required: true },
      { key: 'end_time', label: 'Hora de fin', type: 'time', required: true },
    ],
  };
}
