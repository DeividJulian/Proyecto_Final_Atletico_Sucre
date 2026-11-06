import { Component, inject } from '@angular/core';

import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toasts" aria-live="polite" role="status">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.kind">
          <span>{{ toast.text }}</span>
          <button type="button" (click)="notifications.dismiss(toast.id)" aria-label="Cerrar mensaje">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      left: 16px;
      right: 88px;
      bottom: 16px;
      z-index: 70;
      display: grid;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 460px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background: var(--color-black);
      color: var(--color-white);
      box-shadow: var(--shadow-md);
      border-left: 5px solid var(--color-gold);
      font-size: 0.92rem;
    }
    .toast--success { border-left-color: var(--color-whatsapp); }
    .toast--error { border-left-color: var(--color-red); }
    .toast span { flex: 1; }
    .toast button { border: 0; background: none; color: inherit; cursor: pointer; font-size: 1rem; padding: 0 2px; }
  `,
})
export class ToastContainer {
  protected readonly notifications = inject(NotificationService);
}
