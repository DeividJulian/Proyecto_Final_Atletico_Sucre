import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { CrudApi } from '../../core/api/admin-api.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../confirm/confirm.service';
import { FieldError } from '../forms/field-error';

export type CrudFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'time' | 'lines';

export interface CrudOption {
  value: string | number | null;
  label: string;
}

export interface CrudField {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  wide?: boolean;
  hint?: string;
  default?: unknown;
  /** Options of a select; a function so they can come from data loaded later (e.g. categories). */
  options?: () => CrudOption[];
}

export interface CrudColumn<T> {
  label: string;
  value: (item: T) => string;
}

export interface CrudConfig<T extends { id: number }> {
  /** API path, e.g. "/admin/venues" (GET/POST on it, PUT/DELETE on path/id). */
  path: string;
  singular: string;
  fields: CrudField[];
  columns: CrudColumn<T>[];
  /** Title shown on each card. */
  heading: (item: T) => string;
  deleteWarning?: string;
}

/**
 * Factory-style generic page: list + create/edit form + delete, built from a config.
 * Used for categories, venues, schedule, news and gallery, so all of them behave the same.
 */
@Component({
  selector: 'app-crud-page',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './crud-page.html',
  styleUrl: './crud-page.css',
})
export class CrudPage<T extends { id: number }> implements OnInit {
  readonly config = input.required<CrudConfig<T>>();

  private readonly api = inject(CrudApi);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  protected readonly items = signal<T[] | null>(null);
  protected readonly error = signal<string | null>(null);
  /** undefined = form closed, null = creating, number = editing that id */
  protected readonly editing = signal<number | null | undefined>(undefined);
  protected readonly saving = signal(false);
  protected form = new FormGroup<Record<string, AbstractControl>>({});

  protected readonly formOpen = computed(() => this.editing() !== undefined);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.list<T>(this.config().path).subscribe({
      next: (items) => this.items.set(items),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  open(item: T | null): void {
    this.form = buildForm(this.config().fields, item as Record<string, unknown> | null);
    this.editing.set(item ? item.id : null);
    setTimeout(() => document.querySelector<HTMLElement>('.crud-form input, .crud-form select, .crud-form textarea')?.focus());
  }

  close(): void {
    this.editing.set(undefined);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.notify.error('Revisa los campos marcados en rojo.');
      return;
    }
    const id = this.editing() ?? null;
    this.saving.set(true);
    this.api.save<T>(this.config().path, id, toPayload(this.config().fields, this.form.getRawValue())).subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.notify.success(`${this.config().singular} guardado(a).`);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  async remove(item: T): Promise<void> {
    const answer = await this.confirm.ask({
      title: `Eliminar ${this.config().singular.toLowerCase()}`,
      message: `¿Seguro que quieres eliminar "${this.config().heading(item)}"? ${this.config().deleteWarning ?? ''}`.trim(),
      confirmText: 'Eliminar',
      danger: true,
    });
    if (answer === null) return;
    this.api.remove(this.config().path, item.id).subscribe({
      next: () => {
        this.notify.success('Eliminado.');
        this.load();
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  control(key: string): AbstractControl | null {
    return this.form.get(key);
  }
}

// ---------- pure helpers (tested in crud-page.spec.ts)

export function buildForm(fields: CrudField[], item: Record<string, unknown> | null): FormGroup<Record<string, AbstractControl>> {
  const controls: Record<string, AbstractControl> = {};
  for (const field of fields) {
    const validators: ValidatorFn[] = [];
    if (field.required && field.type !== 'checkbox') validators.push(Validators.required);
    if (field.min !== undefined) validators.push(Validators.min(field.min));
    if (field.max !== undefined) validators.push(Validators.max(field.max));
    if (field.maxLength !== undefined) validators.push(Validators.maxLength(field.maxLength));
    controls[field.key] = new FormControl(initialValue(field, item?.[field.key]), validators);
  }
  return new FormGroup(controls);
}

function initialValue(field: CrudField, value: unknown): unknown {
  if (value === undefined) value = field.default ?? (field.type === 'checkbox' ? false : null);
  if (field.type === 'lines') return Array.isArray(value) ? value.join('\n') : (value ?? '');
  if (field.type === 'time' && typeof value === 'string') return value.slice(0, 5);
  return value ?? (field.type === 'select' ? null : '');
}

export function toPayload(fields: CrudField[], raw: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = raw[field.key];
    switch (field.type) {
      case 'number':
        payload[field.key] = value === '' || value === null || value === undefined ? null : Number(value);
        break;
      case 'checkbox':
        payload[field.key] = !!value;
        break;
      case 'lines':
        payload[field.key] = String(value ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        break;
      case 'text':
      case 'textarea':
        payload[field.key] = typeof value === 'string' && value.trim() ? value.trim() : null;
        break;
      default:
        payload[field.key] = value === '' ? null : value;
    }
  }
  return payload;
}
