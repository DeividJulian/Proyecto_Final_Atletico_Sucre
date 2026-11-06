import { FormControl, FormGroup } from '@angular/forms';

import { guardianForm, guardianPayload, playerForm, playerPayload } from './family-forms';
import {
  colombianPhone,
  documentNumber,
  errorText,
  matchFields,
  normalizePhone,
  personName,
  playerBirthDate,
  strongPassword,
} from './validators';

const check = (validator: (c: FormControl) => unknown, value: string) => validator(new FormControl(value));

describe('form validators (same rules as the API)', () => {
  it('validates Colombian mobile numbers and normalizes them', () => {
    expect(check(colombianPhone, '321 854 3957')).toBeNull();
    expect(check(colombianPhone, '+57 321-854-3957')).toBeNull();
    expect(check(colombianPhone, '6017771234')).toEqual({ phone: true });
    expect(normalizePhone('+57 321 854 3957')).toBe('3218543957');
  });

  it('validates documents, names and passwords', () => {
    expect(check(documentNumber, '1.085.333.444')).toBeNull();
    expect(check(documentNumber, '12')).toEqual({ document: true });
    expect(check(personName, 'María José Ñañez')).toBeNull();
    expect(check(personName, 'Juan123')).toEqual({ personName: true });
    expect(check(strongPassword, 'corta1')).toEqual({ passwordLength: true });
    expect(check(strongPassword, 'solamenteletras')).toEqual({ passwordMix: true });
    expect(check(strongPassword, 'Clave2026')).toBeNull();
  });

  it('validates the birth date of a player', () => {
    const year = new Date().getFullYear();
    expect(check(playerBirthDate, `${year - 10}-05-10`)).toBeNull();
    expect(check(playerBirthDate, `${year + 1}-01-01`)).toEqual({ futureDate: true });
    expect(check(playerBirthDate, `${year - 1}-01-01`)).toEqual({ tooYoung: true });
  });

  it('checks that both passwords match', () => {
    const group = new FormGroup({ a: new FormControl('Clave2026'), b: new FormControl('Otra2026') });
    expect(matchFields('a', 'b')(group)).toEqual({ mismatch: true });
  });

  it('gives Spanish messages', () => {
    expect(errorText({ required: true })).toBe('Este campo es obligatorio.');
    expect(errorText({ phone: true })).toContain('Celular colombiano');
  });
});

describe('family forms', () => {
  it('builds the API payload with normalized values and nulls for empty optional fields', () => {
    const guardian = guardianForm({
      first_names: 'Laura', last_names: 'Gómez', document_number: '1.085.111.222',
      phone: '+57 321 854 3957', address: 'Calle 15 # 7-30', relationship_to_player: 'mother',
    });
    expect(guardian.valid).toBe(true);
    const payload = guardianPayload(guardian);
    expect(payload.document_number).toBe('1085111222');
    expect(payload.phone).toBe('3218543957');
    expect(payload.alt_phone).toBeNull();

    const player = playerForm();
    expect(player.valid).toBe(false);
    player.patchValue({
      first_names: 'Juan', last_names: 'Gómez', document_number: '1085333444', birth_date: '2015-05-10', sex: 'M',
      school_name: 'Champagnat', school_shift: 'morning', eps: 'Nueva EPS',
      emergency_contact_name: 'Pedro Gómez', emergency_contact_phone: '3001112233',
    });
    expect(player.valid).toBe(true);
    expect(playerPayload(player).allergies).toBeNull();
  });
});
