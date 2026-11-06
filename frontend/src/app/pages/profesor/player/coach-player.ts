import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { CoachApiService } from '../../../core/api/coach-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { AccountStatus, Note, PlayerDetail } from '../../../core/models/family';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCop, formatPhone } from '../../../core/utils/format';
import { FieldError } from '../../../shared/forms/field-error';
import { PrivatePhoto } from '../../../shared/private-photo/private-photo';

export const POSITIONS = [
  { value: 'goalkeeper', label: 'Portero' },
  { value: 'defender', label: 'Defensa' },
  { value: 'midfielder', label: 'Mediocampista' },
  { value: 'forward', label: 'Delantero' },
];

/** Player sheet for the coach: health/emergency data, whether they are up to date, jersey/position and notes. */
@Component({
  selector: 'app-coach-player',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, FieldError, PrivatePhoto],
  templateUrl: './coach-player.html',
  styleUrl: './coach-player.css',
})
export class CoachPlayer implements OnInit {
  readonly id = input.required<string>();

  private readonly api = inject(CoachApiService);
  private readonly notify = inject(NotificationService);

  protected readonly player = signal<PlayerDetail | null>(null);
  protected readonly account = signal<AccountStatus | null>(null);
  protected readonly notes = signal<Note[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly savingSports = signal(false);
  protected readonly savingNote = signal(false);
  protected readonly label = label;
  protected readonly phone = formatPhone;
  protected readonly cop = formatCop;
  protected readonly positions = POSITIONS;
  protected readonly playerId = computed(() => Number(this.id()));
  protected readonly photoLoader = computed<(() => Observable<Blob>) | null>(() => {
    const id = this.playerId();
    return this.player()?.has_photo ? () => this.api.photo(id) : null;
  });

  protected readonly sports = new FormGroup({
    jersey_number: new FormControl<number | null>(null, [Validators.min(1), Validators.max(99)]),
    position: new FormControl<string | null>(null),
  });

  protected readonly noteForm = new FormGroup({
    content: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(2000)] }),
    visible_to_guardian: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = this.playerId();
    this.api.player(id).subscribe({
      next: (player) => {
        this.player.set(player);
        this.sports.setValue({ jersey_number: player.jersey_number, position: player.position });
      },
      error: (err) => this.error.set(apiErrorMessage(err)),
    });
    this.api.account(id).subscribe({ next: (data) => this.account.set(data), error: () => this.account.set(null) });
    this.api.notes(id).subscribe({ next: (list) => this.notes.set(list), error: () => this.notes.set([]) });
  }

  saveSports(): void {
    this.sports.markAllAsTouched();
    if (this.sports.invalid) return;
    const value = this.sports.getRawValue();
    this.savingSports.set(true);
    this.api
      .updateSports(this.playerId(), {
        jersey_number: value.jersey_number === null || (value.jersey_number as unknown) === '' ? null : Number(value.jersey_number),
        position: value.position || null,
      })
      .subscribe({
        next: (player) => {
          this.savingSports.set(false);
          this.player.update((p) => (p ? { ...p, jersey_number: player.jersey_number, position: player.position } : p));
          this.notify.success('Dorsal y posición guardados.');
        },
        error: (err) => {
          this.savingSports.set(false);
          this.notify.error(apiErrorMessage(err));
        },
      });
  }

  addNote(): void {
    this.noteForm.markAllAsTouched();
    if (this.noteForm.invalid) return;
    const value = this.noteForm.getRawValue();
    const today = new Date();
    const noteDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    this.savingNote.set(true);
    this.api.addNote(this.playerId(), { note_date: noteDate, content: value.content.trim(), visible_to_guardian: value.visible_to_guardian }).subscribe({
      next: (note) => {
        this.savingNote.set(false);
        this.notes.update((list) => [note, ...list]);
        this.noteForm.reset({ content: '', visible_to_guardian: true });
        this.notify.success('Observación registrada.');
      },
      error: (err) => {
        this.savingNote.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  initials(player: PlayerDetail): string {
    return `${player.first_names[0] ?? ''}${player.last_names[0] ?? ''}`;
  }
}
