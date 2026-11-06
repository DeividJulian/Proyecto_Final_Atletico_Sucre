import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_URL } from '../../../core/config/api-url';
import { ConnectionService } from '../../../core/services/connection.service';
import { Register } from './register';

describe('Register wizard', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    // The server is "awake": no /health ping in these tests
    vi.spyOn(TestBed.inject(ConnectionService), 'whenOnline').mockResolvedValue();
  });

  function create() {
    const fixture = TestBed.createComponent(Register);
    // Protected members are reached through an index signature in the test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(() => true); // ignore the public store calls
    return { fixture, component };
  }

  it('does not move on while the guardian step has errors', () => {
    const { fixture, component } = create();
    component.next();
    fixture.detectChanges();
    expect(component.step()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('.alert')?.textContent).toContain('Revisa los campos');
  });

  it('walks through the 4 steps and sends one request with 2 children', async () => {
    const { component } = create();
    component['guardian'].patchValue({
      first_names: 'Laura', last_names: 'Gómez', document_number: '1085111222', phone: '3218543957',
      address: 'Calle 15 # 7-30', relationship_to_player: 'mother',
    });
    component['account'].patchValue({ email: 'laura@test.com', password: 'MiClave2026', confirm: 'MiClave2026' });
    component.next();
    expect(component.step()).toBe(1);

    const child = {
      first_names: 'Juan', last_names: 'Gómez', document_number: '1085333444', birth_date: '2015-05-10', sex: 'M',
      school_name: 'Champagnat', school_shift: 'morning', eps: 'Nueva EPS',
      emergency_contact_name: 'Pedro Gómez', emergency_contact_phone: '3001112233',
    };
    component['players'].at(0).patchValue(child);
    component.addPlayer();
    component['players'].at(1).patchValue({ ...child, first_names: 'Ana', document_number: '1085333444', sex: 'F' });
    component.next();
    expect(component.step()).toBe(1); // same document twice
    component['players'].at(1).patchValue({ document_number: '1085555666' });
    component.next();
    expect(component.step()).toBe(2);

    component.next();
    expect(component.step()).toBe(2); // data policy not accepted
    component['consents'].patchValue({ data: true });
    component.next();
    expect(component.step()).toBe(3);

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await component.submit();
    const request = TestBed.inject(HttpTestingController).expectOne(`${API_URL}/auth/register`);
    expect(request.request.body.players.length).toBe(2);
    expect(request.request.body.accept_data_policy).toBe(true);
    expect(request.request.body.guardian.phone).toBe('3218543957');
    request.flush({ access_token: 't', token_type: 'bearer', user: { id: 1, email: 'laura@test.com', role: 'parent',
      is_admin: false, is_active: true, must_change_password: false, display_name: 'Laura Gómez' } });
    expect(navigate).toHaveBeenCalledWith('/padre');
  });
});
