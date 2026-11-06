import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  /** When set, the dialog asks for a text (e.g. the reason to reject) of at least this many characters. */
  askReason?: { label: string; minLength: number };
}

interface Pending extends ConfirmRequest {
  resolve: (answer: string | null) => void;
}

/**
 * Accessible replacement for window.confirm/prompt. `ask` resolves with:
 * - '' when confirmed without reason, or the typed reason;
 * - null when cancelled.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<Pending | null>(null);

  ask(request: ConfirmRequest): Promise<string | null> {
    this.current()?.resolve(null);
    return new Promise((resolve) => this.current.set({ ...request, resolve }));
  }

  answer(value: string | null): void {
    const pending = this.current();
    this.current.set(null);
    pending?.resolve(value);
  }
}
