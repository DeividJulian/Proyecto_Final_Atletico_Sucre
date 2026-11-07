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

  // ---------- coach panel (admins too: an admin is a coach with extra permissions)
  {
    path: 'profesor',
    canActivate: [roleGuard('coach', 'admin')],
    loadComponent: () => import('./pages/profesor/coach-layout').then((m) => m.CoachLayout),
    children: [
      {
        path: '',
        title: `Asistencia · ${TITLE}`,
        loadComponent: () => import('./pages/profesor/attendance/attendance').then((m) => m.CoachAttendance),
      },
      {
        path: 'categorias',
        title: `Mis categorías · ${TITLE}`,
        loadComponent: () => import('./pages/profesor/categories/coach-categories').then((m) => m.CoachCategories),
      },
      {
        path: 'deportistas/:id',
        title: `Deportista · ${TITLE}`,
        loadComponent: () => import('./pages/profesor/player/coach-player').then((m) => m.CoachPlayer),
      },
      {
        path: 'avisos',
        title: `Avisos · ${TITLE}`,
        loadComponent: () => import('./shared/announcements-manager/announcements-manager').then((m) => m.AnnouncementsManager),
      },
    ],
  },

  // ---------- admin panel
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: `Administración · ${TITLE}`,
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'inscripciones',
        title: `Inscripciones · ${TITLE}`,
        loadComponent: () => import('./pages/admin/enrollments/enrollments').then((m) => m.AdminEnrollments),
      },
      {
        path: 'deportistas',
        title: `Deportistas · ${TITLE}`,
        loadComponent: () => import('./pages/admin/players/admin-players').then((m) => m.AdminPlayers),
      },
      {
        path: 'pagos',
        title: `Pagos · ${TITLE}`,
        loadComponent: () => import('./pages/admin/payments/admin-payments').then((m) => m.AdminPayments),
      },
      {
        path: 'profesores',
        title: `Profesores · ${TITLE}`,
        loadComponent: () => import('./pages/admin/coaches/admin-coaches').then((m) => m.AdminCoaches),
      },
      {
        path: 'catalogo',
        title: `Categorías y horarios · ${TITLE}`,
        loadComponent: () => import('./pages/admin/catalog/admin-catalog').then((m) => m.AdminCatalog),
      },
      {
        path: 'contenido',
        title: `Noticias y galería · ${TITLE}`,
        loadComponent: () => import('./pages/admin/content/admin-content').then((m) => m.AdminContent),
      },
      {
        path: 'avisos',
        title: `Avisos · ${TITLE}`,
        loadComponent: () => import('./shared/announcements-manager/announcements-manager').then((m) => m.AnnouncementsManager),
      },
      {
        path: 'riesgo',
        title: `Riesgo de deserción · ${TITLE}`,
        loadComponent: () => import('./pages/admin/risk/admin-risk').then((m) => m.AdminRisk),
      },
      {
        path: 'ajustes',
        title: `Ajustes y app · ${TITLE}`,
        loadComponent: () => import('./pages/admin/settings/admin-settings').then((m) => m.AdminSettings),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
