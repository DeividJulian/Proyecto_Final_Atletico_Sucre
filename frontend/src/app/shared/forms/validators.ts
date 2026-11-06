import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Same rules as the backend (schemas.py), so the user sees the problem before sending. */

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;

function value(control: AbstractControl): string {
  return typeof control.value === 'string' ? control.value.trim() : '';
}

export function personName(control: AbstractControl): ValidationErrors | null {
  const text = value(control);
  if (!text) return null;
  return NAME_RE.test(text) ? null : { personName: true };
}

/** "321 854 3957", "+57 3218543957" → 10 digits starting with 3. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+57')) digits = digits.slice(3);
  else if (digits.startsWith('57') && digits.length === 12) digits = digits.slice(2);
  return digits;
}

export function colombianPhone(control: AbstractControl): ValidationErrors | null {
  const text = value(control);
  if (!text) return null;
  return /^3\d{9}$/.test(normalizePhone(text)) ? null : { phone: true };
}

export function normalizeDocument(raw: string): string {
  return raw.replace(/[\s.-]/g, '').toUpperCase();
}

export function documentNumber(control: AbstractControl): ValidationErrors | null {
  const text = value(control);
  if (!text) return null;
  return /^[A-Z0-9]{5,15}$/.test(normalizeDocument(text)) ? null : { document: true };
}

export function strongPassword(control: AbstractControl): ValidationErrors | null {
  const text = typeof control.value === 'string' ? control.value : '';
  if (!text) return null;
  if (text.length < 8) return { passwordLength: true };
  return /[A-Za-z]/.test(text) && /\d/.test(text) ? null : { passwordMix: true };
}

/** Group validator: confirm field equals the password field. */
export function matchFields(field: string, confirm: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirm)?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  };
}

/** Birth date of a player: in the past, between 3 and 20 years ago. */
export function playerBirthDate(control: AbstractControl): ValidationErrors | null {
  const text = value(control);
  if (!text) return null;
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { date: true };
  const today = new Date();
  if (date >= today) return { futureDate: true };
  const years = today.getFullYear() - date.getFullYear();
  if (years < 3) return { tooYoung: true };
  if (years > 20) return { tooOld: true };
  return null;
}

/** Spanish text for the first error of a control. */
export function errorText(errors: ValidationErrors | null | undefined): string | null {
  if (!errors) return null;
  if (errors['required']) return 'Este campo es obligatorio.';
  if (errors['requiredTrue']) return 'Debes aceptar para continuar.';
  if (errors['email']) return 'Escribe un correo válido.';
  if (errors['minlength']) return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
  if (errors['maxlength']) return `Debe tener máximo ${errors['maxlength'].requiredLength} caracteres.`;
  if (errors['min']) return `El valor mínimo es ${errors['min'].min}.`;
  if (errors['max']) return `El valor máximo es ${errors['max'].max}.`;
  if (errors['personName']) return 'Solo letras, espacios, apóstrofo y guion.';
  if (errors['phone']) return 'Celular colombiano de 10 dígitos que empiece por 3 (ej. 3218543957).';
  if (errors['document']) return 'Entre 5 y 15 letras o números, sin puntos ni espacios.';
  if (errors['passwordLength']) return 'La contraseña debe tener al menos 8 caracteres.';
  if (errors['passwordMix']) return 'La contraseña debe tener letras y números.';
  if (errors['date']) return 'Fecha inválida.';
  if (errors['futureDate']) return 'La fecha debe ser anterior a hoy.';
  if (errors['tooYoung']) return 'El deportista debe tener al menos 3 años.';
  if (errors['tooOld']) return 'Revisa la fecha: el club forma deportistas de 4 a 16 años.';
  if (errors['fileRequired']) return 'Adjunta la foto o captura del comprobante.';
  return 'Revisa este campo.';
}
