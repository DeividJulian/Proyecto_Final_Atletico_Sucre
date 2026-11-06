import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../config/api-url';
import { ConnectionService, SLOW_AFTER_MS } from './connection.service';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ConnectionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('goes online without a banner when /health answers quickly', async () => {
    const ready = service.whenOnline();
    http.expectOne(`${API_URL}/health`).flush({ status: 'ok' });
    await ready;
    expect(service.status()).toBe('online');
    expect(service.showBanner()).toBe(false);
  });

  it('shows "Conectando con el servidor…" while Render wakes up, then hides it', async () => {
    const ready = service.whenOnline();
    const first = http.expectOne(`${API_URL}/health`);

    await vi.advanceTimersByTimeAsync(SLOW_AFTER_MS + 10);
    expect(service.status()).toBe('waking');
    expect(service.showBanner()).toBe(true);

    first.flush({ status: 'ok' });
    await ready;
    expect(service.status()).toBe('online');
    expect(service.showBanner()).toBe(false);
  });

  it('retries after an error (cold start) and pings once for several callers', async () => {
    const a = service.whenOnline();
    const b = service.whenOnline();
    http.expectOne(`${API_URL}/health`).flush('', { status: 502, statusText: 'Bad Gateway' });
    await vi.advanceTimersByTimeAsync(0); // let the failed request settle
    expect(service.status()).toBe('waking');

    await vi.advanceTimersByTimeAsync(3100);
    http.expectOne(`${API_URL}/health`).flush({ status: 'ok' });
    await Promise.all([a, b]);
    expect(service.status()).toBe('online');
  });
});
