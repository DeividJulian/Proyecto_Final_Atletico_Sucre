import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-coach-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="panel">
      <div class="container">
        <p class="eyebrow">Panel del profesor</p>
        <h1 class="panel-title">Hola, {{ name() }}</h1>
        <p class="panel-sub">Toma asistencia, revisa a tus deportistas y publica avisos para tus categorías.</p>
        <nav class="tabs" aria-label="Secciones del panel">
          <a routerLink="/profesor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Asistencia</a>
          <a routerLink="/profesor/categorias" routerLinkActive="active">Mis categorías</a>
          <a routerLink="/profesor/avisos" routerLinkActive="active">Avisos</a>
          @if (auth.role() === 'admin') {
            <a routerLink="/admin">← Administración</a>
          }
        </nav>
        <router-outlet />
      </div>
    </section>
  `,
})
export class CoachLayout {
  protected readonly auth = inject(AuthService);
  protected readonly name = () => (this.auth.user()?.display_name ?? '').split(' ')[0];
}
