import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_URL } from '../config/api-url';
import { NotificationService } from '../services/notification.service';
import { AuthService } from './auth.service';

/**
 * - Sends the session token only to our API (never to other sites, e.g. Supabase signed URLs).
 * - A 401 on a protected call means the session expired: sign out and go to the login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const notify = inject(NotificationService);

  const isApi = request.url.startsWith(API_URL);
  const token = auth.token();
  // Login/register/reset answer 401/4xx for wrong data: that is not an expired session
  const isAuthForm = request.url.startsWith(`${API_URL}/auth/`) && !request.url.startsWith(`${API_URL}/auth/me`)
    && !request.url.startsWith(`${API_URL}/auth/password/change`);

  const authorized = isApi && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApi && !isAuthForm && auth.isLoggedIn()) {
        notify.info('Tu sesión expiró. Inicia sesión de nuevo.');
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
