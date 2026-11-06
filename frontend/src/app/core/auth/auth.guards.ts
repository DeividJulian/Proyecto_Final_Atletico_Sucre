import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PanelRole } from '../models/auth';
import { NotificationService } from '../services/notification.service';
import { AuthService } from './auth.service';

/** Pages that need a session. Without one → login, and back here afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  return inject(Router).createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
};

/** A panel only for one role; anyone else goes to their own panel. */
export function roleGuard(role: PanelRole): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
    if (auth.mustChangePassword()) return router.createUrlTree(['/cambiar-clave']);
    if (auth.role() === role) return true;
    inject(NotificationService).info('Esa sección no corresponde a tu cuenta.');
    return router.createUrlTree([auth.homeUrl()]);
  };
}

/** Login and sign-up are not shown to someone already signed in. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([auth.homeUrl()]) : true;
};
