import { Component, computed, inject } from '@angular/core';

import { DEFAULT_WHATSAPP } from '../../../../core/config/api-url';
import { UNIFORMS } from '../../../../core/content/club-content';
import { PublicContentStore } from '../../../../core/state/public-content.store';
import { formatCop, formatPhone, whatsappLink } from '../../../../core/utils/format';

@Component({
  selector: 'app-costs',
  templateUrl: './costs.html',
  styleUrl: './costs.css',
})
export class Costs {
  protected readonly store = inject(PublicContentStore);
  protected readonly uniforms = UNIFORMS;
  protected readonly cop = formatCop;
  protected readonly phone = formatPhone;
  protected readonly paymentQuestion = computed(() =>
    whatsappLink(
      this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP,
      'Hola, quiero conocer los datos de pago de la inscripción y la mensualidad.',
    ),
  );
}
