import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { GuardianInput, PlayerInput } from '../../core/models/family';
import {
  colombianPhone,
  documentNumber,
  normalizeDocument,
  normalizePhone,
  personName,
  playerBirthDate,
} from './validators';

/** Form factories shared by the sign-up wizard, "inscribir otro hijo" and the edit screens. */

const text = (initial: string | null | undefined = '', ...validators: ValidatorFn[]) =>
  new FormControl<string>(initial ?? '', { nonNullable: true, validators });

export function guardianForm(initial?: Partial<GuardianInput>) {
  return new FormGroup({
    first_names: text(initial?.first_names, Validators.required, Validators.minLength(2), Validators.maxLength(80), personName),
    last_names: text(initial?.last_names, Validators.required, Validators.minLength(2), Validators.maxLength(80), personName),
    document_type: text(initial?.document_type ?? 'CC', Validators.required),
    document_number: text(initial?.document_number, Validators.required, documentNumber),
    phone: text(initial?.phone, Validators.required, colombianPhone),
    alt_phone: text(initial?.alt_phone ?? '', colombianPhone),
    address: text(initial?.address, Validators.required, Validators.minLength(2), Validators.maxLength(160)),
    neighborhood: text(initial?.neighborhood ?? '', Validators.maxLength(80)),
    city: text(initial?.city ?? 'Ipiales', Validators.required, Validators.maxLength(80)),
    relationship_to_player: text(initial?.relationship_to_player ?? '', Validators.required),
  });
}

export type GuardianForm = ReturnType<typeof guardianForm>;

export function playerForm(initial?: Partial<PlayerInput>) {
  return new FormGroup({
    first_names: text(initial?.first_names, Validators.required, Validators.minLength(2), Validators.maxLength(80), personName),
    last_names: text(initial?.last_names, Validators.required, Validators.minLength(2), Validators.maxLength(80), personName),
    document_type: text(initial?.document_type ?? 'TI', Validators.required),
    document_number: text(initial?.document_number, Validators.required, documentNumber),
    birth_date: text(initial?.birth_date, Validators.required, playerBirthDate),
    sex: text(initial?.sex ?? '', Validators.required),
    school_name: text(initial?.school_name, Validators.required, Validators.minLength(2), Validators.maxLength(120)),
    school_shift: text(initial?.school_shift ?? '', Validators.required),
    eps: text(initial?.eps, Validators.required, Validators.minLength(2), Validators.maxLength(80)),
    blood_type: text(initial?.blood_type ?? ''),
    allergies: text(initial?.allergies ?? '', Validators.maxLength(1000)),
    medical_notes: text(initial?.medical_notes ?? '', Validators.maxLength(1000)),
    emergency_contact_name: text(initial?.emergency_contact_name, Validators.required, Validators.minLength(3), Validators.maxLength(120), personName),
    emergency_contact_phone: text(initial?.emergency_contact_phone, Validators.required, colombianPhone),
  });
}

export type PlayerForm = ReturnType<typeof playerForm>;

const orNull = (value: string): string | null => (value.trim() ? value.trim() : null);

export function guardianPayload(form: GuardianForm): GuardianInput {
  const v = form.getRawValue();
  return {
    first_names: v.first_names.trim(),
    last_names: v.last_names.trim(),
    document_type: v.document_type as GuardianInput['document_type'],
    document_number: normalizeDocument(v.document_number),
    phone: normalizePhone(v.phone),
    alt_phone: v.alt_phone.trim() ? normalizePhone(v.alt_phone) : null,
    address: v.address.trim(),
    neighborhood: orNull(v.neighborhood),
    city: v.city.trim(),
    relationship_to_player: v.relationship_to_player as GuardianInput['relationship_to_player'],
  };
}

export function playerPayload(form: PlayerForm): PlayerInput {
  const v = form.getRawValue();
  return {
    first_names: v.first_names.trim(),
    last_names: v.last_names.trim(),
    document_type: v.document_type as PlayerInput['document_type'],
    document_number: normalizeDocument(v.document_number),
    birth_date: v.birth_date,
    sex: v.sex as PlayerInput['sex'],
    school_name: v.school_name.trim(),
    school_shift: v.school_shift as PlayerInput['school_shift'],
    eps: v.eps.trim(),
    blood_type: orNull(v.blood_type),
    allergies: orNull(v.allergies),
    medical_notes: orNull(v.medical_notes),
    emergency_contact_name: v.emergency_contact_name.trim(),
    emergency_contact_phone: normalizePhone(v.emergency_contact_phone),
  };
}

/** Marks every control as touched so the errors show (used when pressing "Continuar"). */
export function revealErrors(group: FormGroup): void {
  group.markAllAsTouched();
}
