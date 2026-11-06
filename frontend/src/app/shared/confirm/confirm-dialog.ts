import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';

import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog #dialog class="confirm" (cancel)="cancel($event)" aria-labelledby="confirm-title">
      @if (confirm.current(); as request) {
        <h2 id="confirm-title">{{ request.title }}</h2>
        <p>{{ request.message }}</p>
        @if (request.askReason; as ask) {
          <div class="field">
            <label for="confirm-reason">{{ ask.label }}</label>
            <textarea id="confirm-reason" rows="3" [value]="reason()" (input)="reason.set($any($event.target).value)"></textarea>
            @if (tooShort()) {
              <p class="field-hint">Escribe al menos {{ ask.minLength }} caracteres.</p>
            }
          </div>
        }
        <div class="form-actions">
          <button type="button" class="btn btn--outline" (click)="confirm.answer(null)">Cancelar</button>
          <button type="button" class="btn" [class.btn--primary]="request.danger" [class.btn--gold]="!request.danger"
                  [disabled]="tooShort()" (click)="accept()">
            {{ request.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      }
    </dialog>
  `,
  styles: `
    .confirm { width: min(480px, calc(100% - 32px)); border: 0; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-md); }
    .confirm::backdrop { background: rgb(0 0 0 / 0.55); }
    .confirm h2 { font-size: 1.3rem; text-transform: uppercase; }
    .confirm .form-actions { justify-content: flex-end; }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  protected readonly reason = signal('');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly tooShort = computed(() => {
    const ask = this.confirm.current()?.askReason;
    return !!ask && this.reason().trim().length < ask.minLength;
  });

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.confirm.current()) {
        this.reason.set('');
        if (!element.open) element.showModal?.();
      } else if (element.open) {
        element.close();
      }
    });
  }

  accept(): void {
    if (this.tooShort()) return;
    this.confirm.answer(this.confirm.current()?.askReason ? this.reason().trim() : '');
  }

  cancel(event: Event): void {
    event.preventDefault();
    this.confirm.answer(null);
  }
}
