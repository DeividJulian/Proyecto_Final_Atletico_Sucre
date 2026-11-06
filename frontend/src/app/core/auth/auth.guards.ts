import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';

import { PanelRole } from '../models/auth';
import { NotificationService } from '../services/notification.service';
import { AuthService } from './auth.service';

/** Pages that need a session. Without one → login, and back here afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  return inject(Router).createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
};

/**
 * A panel only for some roles (an admin is also a coach); anyone else goes to their own panel.
 * If the saved user still says "must change password", the server is asked first: the password may have
 * been changed on another device, and the saved copy would keep sending the user to /cambiar-clave.
 */
export function roleGuard(...roles: PanelRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notify = inject(NotificationService);
    const login = router.createUrlTree(['/ingresar'], { queryParams: { volver: state.url } });
    if (!auth.isLoggedIn()) return login;

    const decide = (): boolean | UrlTree => {
      if (auth.mustChangePassword()) return router.createUrlTree(['/cambiar-clave']);
      if (roles.includes(auth.role()!)) return true;
      notify.info('Esa sección no corresponde a tu cuenta.');
      return router.createUrlTree([auth.homeUrl()]);
    };

    if (!auth.mustChangePassword()) return decide();
    const checked: Observable<boolean | UrlTree> = auth.refreshUser().pipe(
      map(() => decide()),
      catchError(() => of(auth.isLoggedIn() ? decide() : login)),
    );
    return checked;
  };
}

/** Login and sign-up are not shown to someone already signed in. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([auth.homeUrl()]) : true;
};
