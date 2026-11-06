import { Component, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { API_URL } from '../../core/config/api-url';
import { ConnectionService } from '../../core/services/connection.service';
import { PublicContentStore } from '../../core/state/public-content.store';

/** Banner shown while Render's free plan wakes the backend up (or when it could not be reached). */
@Component({
  selector: 'app-connection-status',
  template: `
    @if (connection.showBanner()) {
      <div class="status" [class.status--offline]="connection.status() === 'offline'" role="status" aria-live="polite">
        @if (connection.status() === 'waking') {
          <span class="status__spinner" aria-hidden="true"></span>
          <span><strong>Conectando con el servidor…</strong> La primera visita puede tardar hasta un minuto.</span>
        } @else {
          @if (isDevelopment) {
            <span>
              No hay respuesta del backend local (<code>{{ apiUrl }}</code>). ¿Está corriendo
              <code>uvicorn main:app --reload --port 8000</code>?
            </span>
          } @else {
            <span>No pudimos conectar con el servidor. Revisa tu internet.</span>
          }
          <button type="button" class="status__retry" (click)="retry()">Reintentar</button>
        }
      </div>
    }
  `,
  styles: `
    .status {
      position: fixed;
      left: 50%;
      top: calc(var(--nav-height) + 10px);
      transform: translateX(-50%);
      z-index: 60;
      width: min(560px, calc(100% - 32px));
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: var(--color-black);
      color: var(--color-white);
      border: 1px solid var(--color-gold);
      box-shadow: var(--shadow-md);
      font-size: 0.92rem;
    }
    .status--offline { border-color: var(--color-red); }
    .status code { color: var(--color-gold-light); font-size: 0.85em; }
    .status__spinner {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border-radius: 50%;
      border: 3px solid rgb(255 255 255 / 0.25);
      border-top-color: var(--color-gold);
      animation: spin 0.9s linear infinite;
    }
    .status__retry {
      margin-left: auto;
      min-height: 40px;
      padding: 6px 14px;
      border-radius: 999px;
      border: 0;
      background: var(--color-red);
      color: var(--color-white);
      font-weight: 700;
      cursor: pointer;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class ConnectionStatus {
  protected readonly connection = inject(ConnectionService);
  private readonly store = inject(PublicContentStore);
  /** In development the API is the local uvicorn: say so instead of blaming the internet. */
  protected readonly isDevelopment = !environment.production;
  protected readonly apiUrl = API_URL;

  retry(): void {
    void this.connection.retry().then(() => this.store.retry());
  }
}
