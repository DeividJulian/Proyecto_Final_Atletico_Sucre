import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section class="panel">
      <div class="container">
        <p class="eyebrow">Panel de administración</p>
        <h1 class="panel-title">Hola, {{ name() }}</h1>
        <p class="panel-sub">Gestiona inscripciones, pagos, profesores y la información del club.</p>
        <nav class="tabs" aria-label="Secciones de administración">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Resumen</a>
          <a routerLink="/admin/inscripciones" routerLinkActive="active">Inscripciones</a>
          <a routerLink="/admin/deportistas" routerLinkActive="active">Deportistas</a>
          <a routerLink="/admin/pagos" routerLinkActive="active">Pagos</a>
          <a routerLink="/admin/riesgo" routerLinkActive="active">Riesgo de deserción</a>
          <a routerLink="/admin/profesores" routerLinkActive="active">Profesores</a>
          <a routerLink="/admin/catalogo" routerLinkActive="active">Categorías y horarios</a>
          <a routerLink="/admin/contenido" routerLinkActive="active">Noticias y galería</a>
          <a routerLink="/admin/avisos" routerLinkActive="active">Avisos</a>
          <a routerLink="/admin/ajustes" routerLinkActive="active">Ajustes y app</a>
          <a routerLink="/profesor">Asistencia →</a>
        </nav>
        <router-outlet />
      </div>
    </section>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  protected readonly name = () => (this.auth.user()?.display_name ?? '').split(' ')[0];
}
