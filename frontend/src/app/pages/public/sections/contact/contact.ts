import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEFAULT_WHATSAPP } from '../../../../core/config/api-url';
import { Venue } from '../../../../core/models/public';
import { PublicContentStore } from '../../../../core/state/public-content.store';
import { formatPhone, mapsLink, whatsappLink } from '../../../../core/utils/format';

@Component({
  selector: 'app-contact',
  imports: [RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  protected readonly store = inject(PublicContentStore);
  private readonly number = computed(() => this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP);
  protected readonly phone = computed(() => formatPhone(this.number()));
  protected readonly whatsappUrl = computed(() => whatsappLink(this.number()));
  protected readonly enrollUrl = computed(() =>
    whatsappLink(this.number(), 'Hola, quiero inscribir a mi hijo(a) en el Club Atlético Sucre.'),
  );

  maps(venue: Venue): string {
    return mapsLink(venue.name, venue.maps_url, venue.address);
  }
}
