import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DEFAULT_WHATSAPP } from '../../../core/config/api-url';
import { PublicContentStore } from '../../../core/state/public-content.store';
import { whatsappLink } from '../../../core/utils/format';

/** Temporary page for /ingresar and /registro until the forms arrive (Fase 5). */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink],
  template: `
    <section class="section soon">
      <div class="container soon__box">
        <img src="/img/escudo-256.png" alt="" width="120" height="120" />
        <h1 class="section-title">{{ title }}</h1>
        <p class="lead">Estamos terminando esta sección. Mientras tanto, escríbenos por WhatsApp y te ayudamos.</p>
        <div class="soon__actions">
          <a class="btn btn--whatsapp" [href]="whatsappUrl()" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
          <a class="btn btn--outline" routerLink="/" fragment="inicio">Volver al inicio</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .soon { min-height: 70vh; display: grid; align-items: center; }
    .soon__box { display: grid; justify-items: center; text-align: center; gap: 8px; max-width: 560px; }
    .soon__box img { border-radius: 50%; }
    .soon__actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  `,
})
export class ComingSoon {
  private readonly store = inject(PublicContentStore);
  protected readonly title: string = inject(ActivatedRoute).snapshot.data['title'] ?? 'Muy pronto';
  protected readonly whatsappUrl = computed(() =>
    whatsappLink(this.store.club()?.whatsapp ?? DEFAULT_WHATSAPP, 'Hola, quiero inscribir a mi hijo(a).'),
  );
}
