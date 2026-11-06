import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CoachApiService } from '../../../core/api/coach-api.service';
import { label } from '../../../core/content/labels';
import { apiErrorMessage } from '../../../core/http/api-error';
import { AttendanceStatus } from '../../../core/models/family';
import { ScheduleItem } from '../../../core/models/public';
import { AttendanceSheet } from '../../../core/models/staff';
import { NotificationService } from '../../../core/services/notification.service';
import { formatTime } from '../../../core/utils/format';

export const ATTENDANCE_OPTIONS: { value: AttendanceStatus; short: string }[] = [
  { value: 'present', short: 'Asistió' },
  { value: 'late', short: 'Tarde' },
  { value: 'excused', short: 'Excusa' },
  { value: 'absent', short: 'Faltó' },
];

function isoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Attendance of a day: pick the session, mark each player, save in one request. */
@Component({
  selector: 'app-coach-attendance',
  imports: [DatePipe],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class CoachAttendance implements OnInit {
  private readonly api = inject(CoachApiService);
  private readonly notify = inject(NotificationService);

  protected readonly today = isoDate(new Date());
  protected readonly day = signal(this.today);
  protected readonly sessions = signal<ScheduleItem[] | null>(null);
  protected readonly selected = signal<ScheduleItem | null>(null);
  protected readonly sheet = signal<AttendanceSheet | null>(null);
  /** Status chosen on screen for each player (not saved yet). */
  protected readonly marks = signal<Record<number, AttendanceStatus>>({});
  protected readonly saving = signal(false);
  protected readonly options = ATTENDANCE_OPTIONS;
  protected readonly time = formatTime;
  protected readonly label = label;

  protected readonly pending = computed(() => {
    const sheet = this.sheet();
    if (!sheet) return 0;
    const marks = this.marks();
    return sheet.rows.filter((row) => !marks[row.player_id]).length;
  });

  ngOnInit(): void {
    this.loadSessions();
  }

  changeDay(value: string): void {
    if (!value) return;
    this.day.set(value > this.today ? this.today : value);
    this.loadSessions();
  }

  shiftDay(days: number): void {
    const date = new Date(`${this.day()}T12:00:00`);
    date.setDate(date.getDate() + days);
    this.changeDay(isoDate(date));
  }

  loadSessions(): void {
    this.sessions.set(null);
    this.selected.set(null);
    this.sheet.set(null);
    this.api.sessions(this.day()).subscribe({
      next: (list) => {
        this.sessions.set(list);
        if (list.length === 1) this.open(list[0]);
      },
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  open(session: ScheduleItem): void {
    this.selected.set(session);
    this.sheet.set(null);
    this.api.sheet(session.session_id, this.day()).subscribe({
      next: (sheet) => this.setSheet(sheet),
      error: (err) => this.notify.error(apiErrorMessage(err)),
    });
  }

  mark(playerId: number, status: AttendanceStatus): void {
    this.marks.update((marks) => ({ ...marks, [playerId]: status }));
  }

  markAll(status: AttendanceStatus): void {
    const sheet = this.sheet();
    if (!sheet) return;
    this.marks.set(Object.fromEntries(sheet.rows.map((row) => [row.player_id, status])));
  }

  save(): void {
    const session = this.selected();
    const marks = this.marks();
    const records = Object.entries(marks).map(([playerId, status]) => ({ player_id: Number(playerId), status }));
    if (!session || records.length === 0) {
      this.notify.info('Marca al menos un deportista.');
      return;
    }
    this.saving.set(true);
    this.api.saveSheet(session.session_id, this.day(), records).subscribe({
      next: (sheet) => {
        this.saving.set(false);
        this.setSheet(sheet);
        this.notify.success('Asistencia guardada.');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(apiErrorMessage(err));
      },
    });
  }

  private setSheet(sheet: AttendanceSheet): void {
    this.sheet.set(sheet);
    this.marks.set(
      Object.fromEntries(sheet.rows.filter((row) => row.status).map((row) => [row.player_id, row.status as AttendanceStatus])),
    );
  }
}
