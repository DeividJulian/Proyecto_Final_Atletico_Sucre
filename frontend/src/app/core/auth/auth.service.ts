import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_URL } from '../config/api-url';
import { Message, PanelRole, SessionUser, TokenResponse } from '../models/auth';
import { RegisterInput } from '../models/family';

const TOKEN_KEY = 'atletico.token';
const USER_KEY = 'atletico.user';

/** Panel of each role. */
export const HOME_BY_ROLE: Record<PanelRole, string> = {
  parent: '/padre',
  coach: '/profesor',
  admin: '/admin',
};

export function panelRole(user: SessionUser): PanelRole {
  if (user.role === 'parent') return 'parent';
  return user.is_admin ? 'admin' : 'coach';
}

/**
 * Session state (JWT + user) in signals, kept in localStorage so a reload keeps the session.
 * The token expires on the server (TOKEN_HORAS); a 401 logs out through the interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenState = signal<string | null>(read(TOKEN_KEY));
  private readonly userState = signal<SessionUser | null>(readJson<SessionUser>(USER_KEY));

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => this.tokenState() !== null && this.userState() !== null);
  readonly role = computed<PanelRole | null>(() => (this.userState() ? panelRole(this.userState()!) : null));
  readonly homeUrl = computed(() => (this.role() ? HOME_BY_ROLE[this.role()!] : '/ingresar'));
  readonly mustChangePassword = computed(() => this.userState()?.must_change_password === true);

  login(email: string, password: string): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${API_URL}/auth/login`, { email: email.trim().toLowerCase(), password })
      .pipe(tap((answer) => this.startSession(answer)));
  }

  register(data: RegisterInput): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${API_URL}/auth/register`, data).pipe(tap((answer) => this.startSession(answer)));
  }

  forgotPassword(email: string): Observable<Message> {
    return this.http.post<Message>(`${API_URL}/auth/password/forgot`, { email: email.trim().toLowerCase() });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<Message> {
    return this.http.post<Message>(`${API_URL}/auth/password/reset`, {
      email: email.trim().toLowerCase(),
      code,
      new_password: newPassword,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<Message> {
    return this.http
      .post<Message>(`${API_URL}/auth/password/change`, { current_password: currentPassword, new_password: newPassword })
      .pipe(
        tap(() => {
          const user = this.userState();
          if (user) this.saveUser({ ...user, must_change_password: false });
        }),
      );
  }

  /** Refreshes the user from the server (e.g. after a reload). */
  refreshUser(): Observable<SessionUser> {
    return this.http.get<SessionUser>(`${API_URL}/auth/me`).pipe(tap((user) => this.saveUser(user)));
  }

  logout(redirect = true): void {
    this.tokenState.set(null);
    this.userState.set(null);
    remove(TOKEN_KEY);
    remove(USER_KEY);
    if (redirect) void this.router.navigateByUrl('/ingresar');
  }

  private startSession(answer: TokenResponse): void {
    this.tokenState.set(answer.access_token);
    write(TOKEN_KEY, answer.access_token);
    this.saveUser(answer.user);
  }

  private saveUser(user: SessionUser): void {
    this.userState.set(user);
    write(USER_KEY, JSON.stringify(user));
  }
}

// localStorage can be unavailable (private mode, blocked storage): never let that break the app
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* session lasts until the tab closes */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to clean */
  }
}
