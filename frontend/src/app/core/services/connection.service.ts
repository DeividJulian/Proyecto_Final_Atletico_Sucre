import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { API_URL } from '../config/api-url';

/**
 * - checking: first ping to /health in progress (no banner yet, it is usually fast)
 * - waking:   the server is taking long → Render's free plan is starting it ("Conectando con el servidor…")
 * - online:   /health answered
 * - offline:  gave up after MAX_WAIT_MS, or the device has no internet
 */
export type ConnectionStatus = 'checking' | 'waking' | 'online' | 'offline';

/** Show the banner only if the first answer takes longer than this. */
export const SLOW_AFTER_MS = 2000;
/** Render's cold start usually takes ~50 s; give it room before giving up. */
export const MAX_WAIT_MS = 120_000;
const RETRY_EVERY_MS = 3000;
const REQUEST_TIMEOUT_MS = 20_000;

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private readonly http = inject(HttpClient);
  private pending: Promise<void> | null = null;

  readonly status = signal<ConnectionStatus>('checking');
  readonly showBanner = computed(() => this.status() === 'waking' || this.status() === 'offline');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', () => this.status.set('offline'));
      window.addEventListener('online', () => {
        if (this.status() === 'offline') void this.retry();
      });
    }
  }

  /** Resolves when the backend answers /health. Shared by every caller, so the server is pinged once. */
  whenOnline(): Promise<void> {
    if (this.status() === 'online') return Promise.resolve();
    this.pending ??= this.waitForServer().finally(() => (this.pending = null));
    return this.pending;
  }

  retry(): Promise<void> {
    this.status.set('checking');
    return this.whenOnline();
  }

  private async waitForServer(): Promise<void> {
    const started = Date.now();
    const slowTimer = setTimeout(() => {
      if (this.status() === 'checking') this.status.set('waking');
    }, SLOW_AFTER_MS);

    try {
      while (Date.now() - started < MAX_WAIT_MS) {
        try {
          await firstValueFrom(this.http.get(`${API_URL}/health`).pipe(timeout(REQUEST_TIMEOUT_MS)));
          this.status.set('online');
          return;
        } catch {
          if (this.status() === 'checking') this.status.set('waking');
          await delay(RETRY_EVERY_MS);
        }
      }
      this.status.set('offline');
      throw new Error('El servidor no respondió.');
    } finally {
      clearTimeout(slowTimer);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
