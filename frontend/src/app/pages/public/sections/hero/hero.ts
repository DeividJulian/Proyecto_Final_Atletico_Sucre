import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEFAULT_WHATSAPP } from '../../../../core/config/api-url';
import { CLUB } from '../../../../core/content/club-content';
import { PublicContentStore } from '../../../../core/state/public-content.store';
import { whatsappLink } from '../../../../core/utils/format';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  private readonly store = inject(PublicContentStore);
  protected readonly club = CLUB;
  protected readonly whatsappUrl = computed(() => whatsappLink(this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP));
  /** Users who prefer less motion get the video paused (they can still press play). */
  protected readonly autoplay =
    typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
