import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEFAULT_WHATSAPP } from '../../core/config/api-url';
import { CLUB, NAV_LINKS } from '../../core/content/club-content';
import { PublicContentStore } from '../../core/state/public-content.store';
import { formatPhone, whatsappLink } from '../../core/utils/format';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  protected readonly store = inject(PublicContentStore);
  protected readonly club = CLUB;
  protected readonly links = NAV_LINKS;
  protected readonly year = new Date().getFullYear();
  protected readonly whatsapp = computed(() => this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP);
  protected readonly whatsappUrl = computed(() => whatsappLink(this.whatsapp()));
  protected readonly phone = computed(() => formatPhone(this.whatsapp()));

  private readonly policy = viewChild.required<ElementRef<HTMLDialogElement>>('policy');

  openPolicy(): void {
    this.policy().nativeElement.showModal();
  }

  closePolicy(): void {
    this.policy().nativeElement.close();
  }
}
