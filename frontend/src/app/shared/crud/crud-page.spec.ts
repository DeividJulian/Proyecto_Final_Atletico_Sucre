import { TestBed } from '@angular/core/testing';

import { ConfirmService } from '../confirm/confirm.service';
import { CrudField, buildForm, toPayload } from './crud-page';

const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nombre', type: 'text', required: true },
  { key: 'birth_year_from', label: 'Desde', type: 'number', required: true, min: 1990 },
  { key: 'coach_id', label: 'Profesor', type: 'select' },
  { key: 'start_time', label: 'Inicio', type: 'time' },
  { key: 'credentials', label: 'Logros', type: 'lines' },
  { key: 'is_active', label: 'Activa', type: 'checkbox', default: true },
  { key: 'description', label: 'Descripción', type: 'textarea' },
];

describe('generic CRUD helpers', () => {
  it('builds the form from an item and validates required/min', () => {
    const form = buildForm(FIELDS, {
      name: 'Categoría 2014-2015', birth_year_from: 2014, coach_id: 3, start_time: '14:30:00',
      credentials: ['Licencia C', 'COCED'], is_active: false, description: null,
    });
    expect(form.get('start_time')!.value).toBe('14:30');
    expect(form.get('credentials')!.value).toBe('Licencia C\nCOCED');
    expect(form.valid).toBe(true);

    const empty = buildForm(FIELDS, null);
    expect(empty.get('is_active')!.value).toBe(true);
    expect(empty.valid).toBe(false);
    empty.patchValue({ name: 'X', birth_year_from: 1980 });
    expect(empty.get('birth_year_from')!.hasError('min')).toBe(true);
  });

  it('converts the form values to the API payload', () => {
    const payload = toPayload(FIELDS, {
      name: '  Femenino ', birth_year_from: '2009', coach_id: null, start_time: '08:00',
      credentials: 'Licencia C\n\n  COCED  ', is_active: '', description: '   ',
    });
    expect(payload).toEqual({
      name: 'Femenino', birth_year_from: 2009, coach_id: null, start_time: '08:00',
      credentials: ['Licencia C', 'COCED'], is_active: false, description: null,
    });
  });
});

describe('ConfirmService', () => {
  it('resolves with the reason, empty string on plain confirm, and null on cancel', async () => {
    const confirm = TestBed.inject(ConfirmService);
    const withReason = confirm.ask({ title: 'Rechazar', message: '?', askReason: { label: 'Motivo', minLength: 5 } });
    confirm.answer('Faltan documentos');
    expect(await withReason).toBe('Faltan documentos');

    const plain = confirm.ask({ title: 'Eliminar', message: '?' });
    confirm.answer('');
    expect(await plain).toBe('');

    const cancelled = confirm.ask({ title: 'Eliminar', message: '?' });
    confirm.answer(null);
    expect(await cancelled).toBeNull();
    expect(confirm.current()).toBeNull();
  });
});
