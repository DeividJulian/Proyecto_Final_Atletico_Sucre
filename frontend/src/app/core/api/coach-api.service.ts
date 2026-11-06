import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url';
import { AccountStatus, Announcement, AttendanceStatus, Note, Player, PlayerDetail } from '../models/family';
import { Category, ScheduleItem } from '../models/public';
import { AnnouncementInput, AttendanceSheet, NoteInput } from '../models/staff';

/** Coach panel calls (/coach/*). The API limits a coach to their categories; an admin sees all. */
@Injectable({ providedIn: 'root' })
export class CoachApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/coach`;

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  players(categoryId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.base}/categories/${categoryId}/players`);
  }

  player(id: number): Observable<PlayerDetail> {
    return this.http.get<PlayerDetail>(`${this.base}/players/${id}`);
  }

  photo(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/players/${id}/photo`, { responseType: 'blob' });
  }

  account(id: number): Observable<AccountStatus> {
    return this.http.get<AccountStatus>(`${this.base}/players/${id}/payments`);
  }

  updateSports(id: number, data: { jersey_number: number | null; position: string | null }): Observable<Player> {
    return this.http.put<Player>(`${this.base}/players/${id}/sports`, data);
  }

  sessions(day: string): Observable<ScheduleItem[]> {
    return this.http.get<ScheduleItem[]>(`${this.base}/sessions`, { params: { day } });
  }

  sheet(sessionId: number, day: string): Observable<AttendanceSheet> {
    return this.http.get<AttendanceSheet>(`${this.base}/sessions/${sessionId}/attendance`, { params: { day } });
  }

  saveSheet(sessionId: number, day: string, records: { player_id: number; status: AttendanceStatus }[]): Observable<AttendanceSheet> {
    return this.http.put<AttendanceSheet>(`${this.base}/sessions/${sessionId}/attendance`, { session_date: day, records });
  }

  notes(playerId: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/players/${playerId}/notes`);
  }

  addNote(playerId: number, data: NoteInput): Observable<Note> {
    return this.http.post<Note>(`${this.base}/players/${playerId}/notes`, data);
  }

  announcements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.base}/announcements`);
  }

  createAnnouncement(data: AnnouncementInput): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.base}/announcements`, data);
  }

  updateAnnouncement(id: number, data: AnnouncementInput): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.base}/announcements/${id}`, data);
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/announcements/${id}`);
  }
}
