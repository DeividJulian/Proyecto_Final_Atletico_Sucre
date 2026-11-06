import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_URL } from '../core/config/api-url';
import { ConfirmService } from '../shared/confirm/confirm.service';
import { AdminEnrollments } from './admin/enrollments/enrollments';
import { CoachAttendance } from './profesor/attendance/attendance';

const SESSION = {
  session_id: 7, category_id: 1, category_name: 'Categoría 2014-2015', venue_id: 1, venue_name: 'Cancha Grupo Cabal',
  weekday: 2, weekday_name: 'Martes', start_time: '14:30:00', end_time: '17:30:00', shift: 'afternoon',
};

const PLAYER = {
  id: 5, first_names: 'Juan', last_names: 'Gómez', full_name: 'Juan Gómez', document_type: 'TI', document_number: '1085333444',
  birth_date: '2015-05-10', age: 11, sex: 'M', category: { id: 1, name: 'Categoría 2014-2015', birth_year_from: 2014, birth_year_to: 2015, gender: 'mixed' },
  has_photo: false, jersey_number: null, position: null, school_name: 'Champagnat', school_shift: 'morning', training_shift: 'afternoon',
  enrollment_status: 'pending', rejection_reason: null, monthly_fee: 65000, enrolled_at: '2026-11-06',
};

describe('staff panels', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('coach attendance: marks everybody present and saves one request', () => {
    const fixture = TestBed.createComponent(CoachAttendance);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = fixture.componentInstance as any;
    fixture.detectChanges();

    http.expectOne((r) => r.url === `${API_URL}/coach/sessions`).flush([SESSION]);
    http.expectOne((r) => r.url === `${API_URL}/coach/sessions/7/attendance`).flush({
      session_id: 7, session_date: '2026-11-03', category_name: 'Categoría 2014-2015',
      rows: [
        { player_id: 1, player_name: 'Juan', jersey_number: 10, status: null },
        { player_id: 2, player_name: 'Ana', jersey_number: null, status: 'absent' },
      ],
    });
    expect(page.pending()).toBe(1); // Ana already had a status

    page.markAll('present');
    page.mark(2, 'late');
    page.save();
    const request = http.expectOne((r) => r.method === 'PUT' && r.url === `${API_URL}/coach/sessions/7/attendance`);
    expect(request.request.body.records).toEqual([
      { player_id: 1, status: 'present' },
      { player_id: 2, status: 'late' },
    ]);
    request.flush({ session_id: 7, session_date: '2026-11-03', category_name: 'X', rows: [] });
  });

  it('admin enrollments: approves with the chosen category and fee, rejects with a reason', async () => {
    const fixture = TestBed.createComponent(AdminEnrollments);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = fixture.componentInstance as any;
    fixture.detectChanges();
    http.expectOne(`${API_URL}/admin/categories`).flush([{ id: 1, name: 'Categoría 2014-2015' }, { id: 2, name: 'Femenino' }]);
    http.expectOne((r) => r.url === `${API_URL}/admin/enrollments`).flush([PLAYER]);

    page.choice[5].category_id = 2;
    page.choice[5].monthly_fee = 50000;
    page.approve(PLAYER);
    const approve = http.expectOne(`${API_URL}/admin/enrollments/5/approve`);
    expect(approve.request.body).toEqual({ category_id: 2, monthly_fee: 50000 });
    approve.flush({ ...PLAYER, enrollment_status: 'approved' });
    http.expectOne((r) => r.url === `${API_URL}/admin/enrollments`).flush([PLAYER]);

    const confirm = TestBed.inject(ConfirmService);
    const pending = page.reject(PLAYER);
    expect(confirm.current()?.askReason?.minLength).toBe(5);
    confirm.answer('Faltan documentos del deportista');
    await pending;
    const reject = http.expectOne(`${API_URL}/admin/enrollments/5/reject`);
    expect(reject.request.body).toEqual({ reason: 'Faltan documentos del deportista' });
    reject.flush({ ...PLAYER, enrollment_status: 'rejected' });
    http.expectOne((r) => r.url === `${API_URL}/admin/enrollments`).flush([]);
  });
});
