import { Component, computed, inject } from '@angular/core';

import { DEFAULT_WHATSAPP } from '../../core/config/api-url';
import { PublicContentStore } from '../../core/state/public-content.store';
import { whatsappLink } from '../../core/utils/format';

/** Floating WhatsApp button, always visible. */
@Component({
  selector: 'app-whatsapp-fab',
  template: `
    <a class="fab" [href]="link()" target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3Zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.6-5.7C5.2 10 10 5.3 16 5.3S26.8 10 26.8 15.8 22 26.4 16 26.4Zm5.9-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.2 1.4 3.4 2.4 3.6 5.8 5c2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5s.3-1.3.2-1.5-.3-.2-.6-.4Z"
        />
      </svg>
    </a>
  `,
  styles: `
    .fab {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 55;
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--color-whatsapp);
      color: var(--color-white);
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
      transition: transform 0.15s ease;
    }
    .fab:hover { transform: scale(1.06); }
  `,
})
export class WhatsappFab {
  private readonly store = inject(PublicContentStore);
  protected readonly link = computed(() => whatsappLink(this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP));
}
