import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';

import { ANDROID_STEPS } from '../../../../core/content/club-content';
import { PublicContentStore } from '../../../../core/state/public-content.store';

@Component({
  selector: 'app-app-download',
  imports: [DatePipe],
  templateUrl: './app-download.html',
  styleUrl: './app-download.css',
})
export class AppDownload {
  protected readonly store = inject(PublicContentStore);
  protected readonly steps = ANDROID_STEPS;
  /** QR (data URL) that points to the APK of the current release. */
  protected readonly qr = signal<string | null>(null);

  constructor() {
    effect(() => {
      const release = this.store.appRelease();
      if (!release) {
        this.qr.set(null);
        return;
      }
      // Loaded only when there is a release, so the library is not in the first download of the page
      import('qrcode')
        .then(({ default: QRCode }) =>
          QRCode.toDataURL(release.apk_url, { width: 220, margin: 1, color: { dark: '#111111', light: '#ffffff' } }),
        )
        .then((url) => this.qr.set(url))
        .catch(() => this.qr.set(null));
    });
  }
}
