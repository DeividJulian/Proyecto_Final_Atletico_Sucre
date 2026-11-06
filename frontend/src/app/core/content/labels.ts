/** Spanish labels for the values the API stores in English. */

export const GUARDIAN_DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
  { value: 'PA', label: 'Pasaporte' },
] as const;

export const PLAYER_DOCUMENT_TYPES = [
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'RC', label: 'Registro civil' },
  { value: 'NUIP', label: 'NUIP' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
  { value: 'PA', label: 'Pasaporte' },
] as const;

export const RELATIONSHIPS = [
  { value: 'mother', label: 'Madre' },
  { value: 'father', label: 'Padre' },
  { value: 'grandparent', label: 'Abuelo(a)' },
  { value: 'uncle_aunt', label: 'Tío(a)' },
  { value: 'sibling', label: 'Hermano(a)' },
  { value: 'legal_guardian', label: 'Tutor legal' },
  { value: 'other', label: 'Otro' },
] as const;

export const SEXES = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
] as const;

export const SCHOOL_SHIFTS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'full_day', label: 'Jornada única' },
] as const;

export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const LABELS: Record<string, Record<string, string>> = {
  enrollment: { pending: 'Pendiente de aprobación', approved: 'Aprobada', rejected: 'No aprobada', inactive: 'Inactiva' },
  trainingShift: { morning: 'Jornada mañana', afternoon: 'Jornada tarde', all: 'Ambas jornadas' },
  schoolShift: { morning: 'Mañana', afternoon: 'Tarde', full_day: 'Jornada única' },
  month: {
    paid: 'Pagado', in_review: 'En revisión', due: 'Por pagar', overdue: 'Vencido',
    not_enrolled: '—', grace: 'Mes de ingreso', upcoming: 'Próximo',
  },
  payment: { pending_verification: 'En revisión', verified: 'Verificado', rejected: 'Rechazado' },
  concept: { enrollment: 'Inscripción', monthly: 'Mensualidad' },
  method: { cash: 'Efectivo', nequi: 'Nequi' },
  attendance: { present: 'Asistió', absent: 'Faltó', excused: 'Excusa', late: 'Llegó tarde' },
  position: { goalkeeper: 'Portero', defender: 'Defensa', midfielder: 'Mediocampista', forward: 'Delantero' },
  relationship: Object.fromEntries(RELATIONSHIPS.map((r) => [r.value, r.label])),
  sex: { F: 'Femenino', M: 'Masculino' },
};

export type LabelGroup = keyof typeof LABELS;

export function label(group: LabelGroup, value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return LABELS[group]?.[value] ?? value;
}
