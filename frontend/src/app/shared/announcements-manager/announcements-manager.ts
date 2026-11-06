import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CoachApiService } from '../../core/api/coach-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { Announcement } from '../../core/models/family';
import { Category } from '../../core/models/public';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../confirm/confirm.service';
import { FieldError } from '../forms/field-error';

/** Notices for categories (coach) or for the whole club (admin only). Shared by both panels. */
@Component({
  selector: 'app-announcements-manager',
  imports: [ReactiveFormsModule, DatePipe, FieldError],
  templateUrl: './announcements-manager.html',
  styleUrl: './announcements-manager.css',
})
export class AnnouncementsManager implements OnInit {
  private readonly api = inject(CoachApiService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  protected readonly items = signal<Announcement[] | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly editingId = signal<number | null | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly isAdmin = computed(() => this.auth.role() === 'admin');

  protected readonly form = new FormGroup({
    category_id: new FormControl<number | null>(null),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(120)] }),
    body: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(4000)] }),
    expires_at: new FormControl<string>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
    this.api.categories().subscribe({ next: (list) => this.categories.set(list) });
  }

  load(): void {
    this.api.announcements().subscribe({
      next: (list) => this.items.set(list),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  open(item: Announcement | null): void {
    const firstCategory = this.categories()[0]?.id ?? null;
    this.form.reset({
      category_id: item ? item.category_id : this.isAdmin() ? null : firstCategory,
      title: item?.title ?? '',
      body: item?.body ?? '',
      expires_at: item?.expires_at ? item.expires_at.slice(0, 10) : '',
    });
    this.editingId.set(item ? item.id : null);
  }

  save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (!this.isAdmin() && value.category_id === null) {
      this.notify.error('Elige la categoría del aviso.');
      return;
    }
    if (this.form.invalid) return;
    const payload = {
      category_id: value.category_id,
      title: value.title.trim(),
      body: value.body.trim(),
      expires_at: value.expires_at ? `${value.expires_at}T23:59:59` : null,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.api.updateAnnouncement(id, payload) : this.api.createAnnouncement(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(undefined);
        this.notify.success(id ? 'Aviso actualizado.' : 'Aviso publicado.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  async remove(item: Announcement): Promise<void> {
    const answer = await this.confirm.ask({
      title: 'Eliminar aviso',
      message: `¿Eliminar "${item.title}"? Los padres dejarán de verlo.`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (answer === null) return;
    this.api.deleteAnnouncement(item.id).subscribe({
      next: () => {
        this.notify.success('Aviso eliminado.');
        this.load();
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }
}
