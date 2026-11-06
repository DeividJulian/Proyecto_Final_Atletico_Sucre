import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url';
import { SessionUser } from '../models/auth';
import { authGuard, guestGuard, roleGuard } from './auth.guards';
import { authInterceptor } from './auth.interceptor';
import { AuthService, panelRole } from './auth.service';

const PARENT: SessionUser = {
  id: 1, email: 'padre@test.com', role: 'parent', is_admin: false, is_active: true,
  must_change_password: false, display_name: 'Laura Gómez',
};
const COACH: SessionUser = { ...PARENT, id: 2, role: 'coach', email: 'coach@test.com' };
const ADMIN: SessionUser = { ...COACH, id: 3, is_admin: true, must_change_password: true };

describe('auth', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  function signIn(user: SessionUser): void {
    auth.login(user.email, 'Clave1234').subscribe();
    http.expectOne(`${API_URL}/auth/login`).flush({ access_token: `token-${user.id}`, token_type: 'bearer', user });
  }

  const run = (guard: ReturnType<typeof roleGuard>, url = '/padre') =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

  it('maps each account to its panel', () => {
    expect(panelRole(PARENT)).toBe('parent');
    expect(panelRole(COACH)).toBe('coach');
    expect(panelRole(ADMIN)).toBe('admin');
  });

  it('stores the session and keeps it after a reload', () => {
    signIn(PARENT);
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.homeUrl()).toBe('/padre');
    expect(localStorage.getItem('atletico.token')).toBe('token-1');
    auth.logout(false);
    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('atletico.token')).toBeNull();
  });

  it('sends the token only to our API', () => {
    signIn(PARENT);
    const client = TestBed.inject(HttpClient);
    client.get(`${API_URL}/me/players`).subscribe();
    client.get('https://example.supabase.co/storage/file.png').subscribe();
    expect(http.expectOne(`${API_URL}/me/players`).request.headers.get('Authorization')).toBe('Bearer token-1');
    expect(http.expectOne('https://example.supabase.co/storage/file.png').request.headers.has('Authorization')).toBe(false);
  });

  it('signs out when the session expired (401)', () => {
    signIn(PARENT);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    TestBed.inject(HttpClient).get(`${API_URL}/me/players`).subscribe({ error: () => undefined });
    http.expectOne(`${API_URL}/me/players`).flush({ detail: 'Tu sesión expiró' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/ingresar');
  });

  it('role guard: each role only enters its own panel', () => {
    expect(run(roleGuard('parent'))).toBeInstanceOf(UrlTree); // no session → login
    signIn(PARENT);
    expect(run(roleGuard('parent'))).toBe(true);
    const redirect = run(roleGuard('admin'), '/admin') as UrlTree;
    expect(router.serializeUrl(redirect)).toBe('/padre');
  });

  it('role guard: an admin also enters the coach panel, a coach never enters the admin panel', () => {
    signIn({ ...ADMIN, must_change_password: false });
    expect(run(roleGuard('coach', 'admin'), '/profesor')).toBe(true);
    auth.logout(false);
    signIn(COACH);
    expect(run(roleGuard('coach', 'admin'), '/profesor')).toBe(true);
    expect(router.serializeUrl(run(roleGuard('admin'), '/admin') as UrlTree)).toBe('/profesor');
  });

  it('role guard: an admin with the initial password must change it first (checked with the server)', () => {
    signIn(ADMIN);
    let result: unknown;
    (run(roleGuard('admin'), '/admin') as Observable<unknown>).subscribe((value) => (result = value));
    http.expectOne(`${API_URL}/auth/me`).flush(ADMIN);
    expect(router.serializeUrl(result as UrlTree)).toBe('/cambiar-clave');
  });

  it('role guard: a stale "must change" flag is refreshed (password changed on another device)', () => {
    signIn(ADMIN);
    let result: unknown;
    (run(roleGuard('admin'), '/admin') as Observable<unknown>).subscribe((value) => (result = value));
    http.expectOne(`${API_URL}/auth/me`).flush({ ...ADMIN, must_change_password: false });
    expect(result).toBe(true);
    expect(auth.mustChangePassword()).toBe(false);
  });

  it('auth and guest guards', () => {
    const login = run(authGuard, '/padre/avisos') as UrlTree;
    expect(router.serializeUrl(login)).toBe('/ingresar?volver=%2Fpadre%2Favisos');
    expect(run(guestGuard, '/ingresar')).toBe(true);
    signIn(COACH);
    expect(router.serializeUrl(run(guestGuard, '/ingresar') as UrlTree)).toBe('/profesor');
  });
});
