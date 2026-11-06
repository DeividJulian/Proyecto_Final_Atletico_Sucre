import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Temporary page for the coach and admin panels (Fase 5, parte B). Lets us test login and role guards now. */
@Component({
  selector: 'app-panel-placeholder',
  template: `
    <section class="panel">
      <div class="container">
        <p class="eyebrow">{{ title }}</p>
        <h1 class="panel-title">Hola, {{ auth.user()?.display_name }}</h1>
        <div class="card">
          <p>Este panel se construye en la siguiente parte. Tu sesión y tu rol ya funcionan.</p>
          <p class="field-hint">Cuenta: {{ auth.user()?.email }} · rol: {{ auth.role() === 'admin' ? 'administrador' : 'profesor' }}</p>
        </div>
      </div>
    </section>
  `,
})
export class PanelPlaceholder {
  protected readonly auth = inject(AuthService);
  protected readonly title: string = inject(ActivatedRoute).snapshot.data['title'] ?? 'Panel';
}
