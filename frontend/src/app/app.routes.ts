import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';

const TITLE = 'Club Atlético Sucre';

export const routes: Routes = [
  {
    path: '',
    title: `${TITLE} · Escuela de fútbol en Ipiales`,
    loadComponent: () => import('./pages/public/home/home').then((m) => m.Home),
  },

  // ---------- auth
  {
    path: 'ingresar',
    title: `Ingresar · ${TITLE}`,
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: `Inscribe a tu hijo · ${TITLE}`,
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'recuperar-clave',
    title: `Recuperar contraseña · ${TITLE}`,
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'cambiar-clave',
    title: `Cambiar contraseña · ${TITLE}`,
    canActivate: [authGuard],
    loadComponent: () => import('./pages/auth/change-password/change-password').then((m) => m.ChangePassword),
  },

  // ---------- parent panel
  {
    path: 'padre',
    canActivate: [roleGuard('parent')],
    loadComponent: () => import('./pages/padre/parent-layout').then((m) => m.ParentLayout),
    children: [
      {
        path: '',
        title: `Mis hijos · ${TITLE}`,
        loadComponent: () => import('./pages/padre/children/children').then((m) => m.Children),
      },
      {
        path: 'hijos/:id',
        title: `Deportista · ${TITLE}`,
        loadComponent: () => import('./pages/padre/child-detail/child-detail').then((m) => m.ChildDetail),
      },
      {
        path: 'avisos',
        title: `Avisos · ${TITLE}`,
        loadComponent: () => import('./pages/padre/announcements/announcements').then((m) => m.ParentAnnouncements),
      },
      {
        path: 'mis-datos',
        title: `Mis datos · ${TITLE}`,
        loadComponent: () => import('./pages/padre/my-data/my-data').then((m) => m.MyData),
      },
      {
        path: 'inscribir',
        title: `Inscribir otro hijo · ${TITLE}`,
        loadComponent: () => import('./pages/padre/add-child/add-child').then((m) => m.AddChild),
      },
    ],
  },

  // ---------- coach and admin panels (Fase 5, parte B)
  {
    path: 'profesor',
    title: `Panel del profesor · ${TITLE}`,
    canActivate: [roleGuard('coach')],
    data: { title: 'Panel del profesor' },
    loadComponent: () => import('./pages/panel-placeholder/panel-placeholder').then((m) => m.PanelPlaceholder),
  },
  {
    path: 'admin',
    title: `Administración · ${TITLE}`,
    canActivate: [roleGuard('admin')],
    data: { title: 'Panel de administración' },
    loadComponent: () => import('./pages/panel-placeholder/panel-placeholder').then((m) => m.PanelPlaceholder),
  },

  { path: '**', redirectTo: '' },
];
