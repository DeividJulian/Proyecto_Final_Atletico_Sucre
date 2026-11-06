import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { FamilyApiService } from '../../../core/api/family-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { AttendanceSummary, Note, PlayerDetail, PlayerInput } from '../../../core/models/family';
import { NotificationService } from '../../../core/services/notification.service';
import { formatPhone, formatTime } from '../../../core/utils/format';
import { PlayerForm, playerForm, playerPayload } from '../../../shared/forms/family-forms';
import { PlayerFields } from '../../../shared/forms/player-fields';
import { PrivatePhoto } from '../../../shared/private-photo/private-photo';
import { ChildPayments } from '../child-payments/child-payments';

type Tab = 'ficha' | 'asistencia' | 'pagos' | 'observaciones';

@Component({
  selector: 'app-child-detail',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, PrivatePhoto, PlayerFields, ChildPayments],
  templateUrl: './child-detail.html',
  styleUrl: './child-detail.css',
})
export class ChildDetail implements OnInit {
  /** Route param :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(FamilyApiService);
  private readonly notify = inject(NotificationService);

  protected readonly player = signal<PlayerDetail | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly tab = signal<Tab>('ficha');
  protected readonly attendance = signal<AttendanceSummary | null>(null);
  protected readonly notes = signal<Note[] | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly photoVersion = signal(0);
  protected form: PlayerForm | null = null;

  protected readonly label = label;
  protected readonly time = formatTime;
  protected readonly phone = formatPhone;
  protected readonly playerId = computed(() => Number(this.id()));
  protected readonly photoLoader = computed<(() => Observable<Blob>) | null>(() => {
    const id = this.playerId();
    return this.player()?.has_photo ? () => this.api.photo(id) : null;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.api.player(this.playerId()).subscribe({
      next: (player) => this.player.set(player),
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
  }

  open(tab: Tab): void {
    this.tab.set(tab);
    const id = this.playerId();
    if (tab === 'asistencia' && !this.attendance()) {
      this.api.attendance(id).subscribe({
        next: (data) => this.attendance.set(data),
        error: (err) => this.notify.error(apiErrorMessage(err)),
      });
    }
    if (tab === 'observaciones' && !this.notes()) {
      this.api.notes(id).subscribe({
        next: (data) => this.notes.set(data),
        error: (err) => this.notify.error(apiErrorMessage(err)),
      });
    }
  }

  startEdit(player: PlayerDetail): void {
    const initial: Partial<PlayerInput> = {
      first_names: player.first_names,
      last_names: player.last_names,
      document_type: player.document_type,
      document_number: player.document_number,
      birth_date: player.birth_date,
      sex: player.sex,
      school_name: player.school_name,
      school_shift: player.school_shift,
      ...player.health,
    };
    this.form = playerForm(initial);
    // The document identifies the child; to change it, the parent contacts the club
    this.form.controls.document_type.disable();
    this.form.controls.document_number.disable();
    this.editing.set(true);
  }

  save(): void {
    const form = this.form;
    if (!form) return;
    form.markAllAsTouched();
    if (form.invalid) {
      this.notify.error('Revisa los campos marcados en rojo.');
      return;
    }
    const { document_type: _type, document_number: _number, ...changes } = playerPayload(form);
    this.saving.set(true);
    this.api.updatePlayer(this.playerId(), changes).subscribe({
      next: (player) => {
        this.player.set(player);
        this.editing.set(false);
        this.saving.set(false);
        this.notify.success('Datos actualizados.');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  uploadPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.notify.error('La foto pesa más de 5 MB.');
      return;
    }
    this.api.uploadPhoto(this.playerId(), file).subscribe({
      next: () => {
        this.player.update((p) => (p ? { ...p, has_photo: true } : p));
        this.photoVersion.update((v) => v + 1);
        this.notify.success('Foto actualizada.');
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  initials(player: PlayerDetail): string {
    return `${player.first_names[0] ?? ''}${player.last_names[0] ?? ''}`;
  }
}
