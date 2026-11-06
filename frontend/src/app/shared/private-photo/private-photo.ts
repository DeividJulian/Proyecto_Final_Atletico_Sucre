import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Image that needs the session token (player photos, payment receipts): it is downloaded as a blob through
 * HttpClient (the interceptor adds the token) and shown with an object URL, released when no longer used.
 */
@Component({
  selector: 'app-private-photo',
  template: `
    @if (url(); as src) {
      <img [src]="src" [alt]="alt()" [class]="imgClass()" />
    } @else {
      <span [class]="imgClass() + ' private-photo__placeholder'" aria-hidden="true">{{ initials() }}</span>
    }
  `,
  styles: `
    :host { display: contents; }
    .private-photo__placeholder {
      display: grid; place-items: center;
      background: var(--color-black); color: var(--color-gold-light);
      font-family: var(--font-display); font-size: 1.6rem;
    }
  `,
})
export class PrivatePhoto {
  readonly source = input<(() => Observable<Blob>) | null>(null);
  readonly alt = input('');
  readonly initials = input('');
  readonly imgClass = input('');
  /** Change it to reload the image (e.g. after uploading a new photo). */
  readonly version = input(0);

  protected readonly url = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      this.version();
      const load = this.source();
      if (!load) {
        this.url.set(null);
        return;
      }
      let objectUrl: string | null = null;
      const subscription = load().subscribe({
        next: (blob) => {
          objectUrl = URL.createObjectURL(blob);
          this.url.set(objectUrl);
        },
        error: () => this.url.set(null),
      });
      onCleanup(() => {
        subscription.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });
    inject(DestroyRef).onDestroy(() => this.url.set(null));
  }
}
