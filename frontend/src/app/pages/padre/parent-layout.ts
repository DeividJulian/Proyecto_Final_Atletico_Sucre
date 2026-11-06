import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/** Frame of the parent panel: greeting + tabs. */
@Component({
  selector: 'app-parent-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="panel">
      <div class="container">
        <p class="eyebrow">Panel del padre de familia</p>
        <h1 class="panel-title">Hola, {{ firstName() }}</h1>
        <p class="panel-sub">Aquí ves la inscripción, el horario, la asistencia y los pagos de tus hijos.</p>
        <nav class="tabs" aria-label="Secciones del panel">
          <a routerLink="/padre" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Mis hijos</a>
          <a routerLink="/padre/avisos" routerLinkActive="active">Avisos</a>
          <a routerLink="/padre/mis-datos" routerLinkActive="active">Mis datos</a>
          <a routerLink="/padre/inscribir" routerLinkActive="active">Inscribir otro hijo</a>
        </nav>
        <router-outlet />
      </div>
    </section>
  `,
})
export class ParentLayout {
  private readonly auth = inject(AuthService);
  protected readonly firstName = () => (this.auth.user()?.display_name ?? '').split(' ')[0];
}
