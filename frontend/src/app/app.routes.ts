import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Club Atlético Sucre · Escuela de fútbol en Ipiales',
    loadComponent: () => import('./pages/public/home/home').then((m) => m.Home),
  },
  {
    path: 'registro',
    title: 'Inscribe a tu hijo · Club Atlético Sucre',
    data: { title: 'Inscribe a tu hijo' },
    loadComponent: () => import('./pages/public/coming-soon/coming-soon').then((m) => m.ComingSoon),
  },
  {
    path: 'ingresar',
    title: 'Ingresar · Club Atlético Sucre',
    data: { title: 'Ingresar' },
    loadComponent: () => import('./pages/public/coming-soon/coming-soon').then((m) => m.ComingSoon),
  },
  { path: '**', redirectTo: '' },
];
