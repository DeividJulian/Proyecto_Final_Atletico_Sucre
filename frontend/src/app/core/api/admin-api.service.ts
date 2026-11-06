import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url';
import { Player, PlayerDetail } from '../models/family';
import {
  AppReleaseFull,
  ClubSettings,
  CoachProfile,
  Overdue,
  PaymentAdmin,
  PaymentAdminInput,
  PlayerAdminUpdate,
  Stats,
} from '../models/staff';

function params(values: Record<string, string | number | null | undefined>): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') result = result.set(key, String(value));
  }
  return result;
}

/** Admin panel calls (/admin/*). Simple catalogs (venues, categories, sessions, gallery, news) use CrudApi. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/admin`;

  stats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/stats`);
  }

  // ---------- enrollments and players

  enrollments(status = 'pending'): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.base}/enrollments`, { params: { status } });
  }

  approve(playerId: number, data: { category_id?: number | null; monthly_fee?: number | null }): Observable<Player> {
    return this.http.post<Player>(`${this.base}/enrollments/${playerId}/approve`, data);
  }

  reject(playerId: number, reason: string): Observable<Player> {
    return this.http.post<Player>(`${this.base}/enrollments/${playerId}/reject`, { reason });
  }

  players(filters: { q?: string; category_id?: number | null; status?: string | null }): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.base}/players`, { params: params(filters) });
  }

  player(id: number): Observable<PlayerDetail> {
    return this.http.get<PlayerDetail>(`${this.base}/players/${id}`);
  }

  updatePlayer(id: number, data: PlayerAdminUpdate): Observable<PlayerDetail> {
    return this.http.put<PlayerDetail>(`${this.base}/players/${id}`, data);
  }

  // ---------- payments

  payments(filters: { status?: string | null; player_id?: number | null; year?: number | null; month?: number | null }): Observable<PaymentAdmin[]> {
    return this.http.get<PaymentAdmin[]>(`${this.base}/payments`, { params: params(filters) });
  }

  registerPayment(data: PaymentAdminInput): Observable<PaymentAdmin> {
    return this.http.post<PaymentAdmin>(`${this.base}/payments`, data);
  }

  verifyPayment(id: number): Observable<PaymentAdmin> {
    return this.http.post<PaymentAdmin>(`${this.base}/payments/${id}/verify`, {});
  }

  rejectPayment(id: number, reason: string): Observable<PaymentAdmin> {
    return this.http.post<PaymentAdmin>(`${this.base}/payments/${id}/reject`, { reason });
  }

  receipt(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/payments/${id}/receipt`, { responseType: 'blob' });
  }

  overdue(): Observable<Overdue[]> {
    return this.http.get<Overdue[]>(`${this.base}/payments/overdue`);
  }

  exportPayments(): Observable<Blob> {
    return this.http.get(`${this.base}/payments/export.csv`, { responseType: 'blob' });
  }

  // ---------- coaches

  coaches(): Observable<CoachProfile[]> {
    return this.http.get<CoachProfile[]>(`${this.base}/coaches`);
  }

  saveCoach(id: number | null, data: Omit<CoachProfile, 'id' | 'has_account' | 'email' | 'account_active'>): Observable<CoachProfile> {
    return id === null
      ? this.http.post<CoachProfile>(`${this.base}/coaches`, data)
      : this.http.put<CoachProfile>(`${this.base}/coaches/${id}`, data);
  }

  createCoachAccount(id: number, email: string, password: string): Observable<CoachProfile> {
    return this.http.post<CoachProfile>(`${this.base}/coaches/${id}/account`, { email, password });
  }

  setCoachActive(id: number, active: boolean): Observable<CoachProfile> {
    return this.http.post<CoachProfile>(`${this.base}/coaches/${id}/account/active`, {}, { params: { active } });
  }

  // ---------- settings and app releases

  settings(): Observable<ClubSettings> {
    return this.http.get<ClubSettings>(`${this.base}/settings`);
  }

  saveSettings(data: ClubSettings): Observable<ClubSettings> {
    return this.http.put<ClubSettings>(`${this.base}/settings`, data);
  }

  releases(): Observable<AppReleaseFull[]> {
    return this.http.get<AppReleaseFull[]>(`${this.base}/app-releases`);
  }

  publishRelease(data: Omit<AppReleaseFull, 'id' | 'released_at'>): Observable<AppReleaseFull> {
    return this.http.post<AppReleaseFull>(`${this.base}/app-releases`, data);
  }

  makeCurrent(id: number): Observable<AppReleaseFull> {
    return this.http.post<AppReleaseFull>(`${this.base}/app-releases/${id}/current`, {});
  }
}

/** Generic list/create/update/delete for the admin catalogs that share the same REST shape. */
@Injectable({ providedIn: 'root' })
export class CrudApi {
  private readonly http = inject(HttpClient);

  list<T>(path: string): Observable<T[]> {
    return this.http.get<T[]>(`${API_URL}${path}`);
  }

  save<T>(path: string, id: number | null, data: unknown): Observable<T> {
    return id === null ? this.http.post<T>(`${API_URL}${path}`, data) : this.http.put<T>(`${API_URL}${path}/${id}`, data);
  }

  remove(path: string, id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}${path}/${id}`);
  }
}
