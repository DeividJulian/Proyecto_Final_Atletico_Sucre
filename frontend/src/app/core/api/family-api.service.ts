import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url';
import {
  AccountStatus,
  Announcement,
  AttendanceSummary,
  Guardian,
  GuardianInput,
  Note,
  Payment,
  Player,
  PlayerDetail,
  PlayerInput,
} from '../models/family';

/** Parent panel calls (/me/*). The backend checks on every call that the child belongs to this parent. */
@Injectable({ providedIn: 'root' })
export class FamilyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/me`;

  guardian(): Observable<Guardian> {
    return this.http.get<Guardian>(`${this.base}/guardian`);
  }

  updateGuardian(data: Partial<GuardianInput>): Observable<Guardian> {
    return this.http.put<Guardian>(`${this.base}/guardian`, data);
  }

  players(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.base}/players`);
  }

  addPlayer(data: PlayerInput): Observable<Player> {
    return this.http.post<Player>(`${this.base}/players`, data);
  }

  player(id: number): Observable<PlayerDetail> {
    return this.http.get<PlayerDetail>(`${this.base}/players/${id}`);
  }

  updatePlayer(id: number, data: Partial<PlayerInput>): Observable<PlayerDetail> {
    return this.http.put<PlayerDetail>(`${this.base}/players/${id}`, data);
  }

  uploadPhoto(id: number, file: File): Observable<Player> {
    const body = new FormData();
    body.append('photo', file);
    return this.http.post<Player>(`${this.base}/players/${id}/photo`, body);
  }

  /** The photo needs the session token, so it is downloaded as a blob instead of an <img src>. */
  photo(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/players/${id}/photo`, { responseType: 'blob' });
  }

  attendance(id: number): Observable<AttendanceSummary> {
    return this.http.get<AttendanceSummary>(`${this.base}/players/${id}/attendance`);
  }

  account(id: number, year?: number): Observable<AccountStatus> {
    const query = year ? `?year=${year}` : '';
    return this.http.get<AccountStatus>(`${this.base}/players/${id}/payments${query}`);
  }

  reportPayment(id: number, body: FormData): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/players/${id}/payments`, body);
  }

  receipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.base}/payments/${paymentId}/receipt`, { responseType: 'blob' });
  }

  notes(id: number): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.base}/players/${id}/notes`);
  }

  announcements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${this.base}/announcements`);
  }
}
