import { Category } from '../models/public';

/**
 * Preview of the category the backend will assign (same rule as BirthYearRangeStrategy): the birth year falls
 * in the range; girls go to the female category if one covers their year; the narrowest range wins.
 * Only a hint for the form: the server decides.
 */
export function estimateCategory(birthDate: string, sex: string, categories: Category[]): string | null {
  const year = Number(birthDate.slice(0, 4));
  if (!year) return null;
  const fitting = categories.filter((c) => c.is_active && c.birth_year_from <= year && year <= c.birth_year_to);
  const narrowest = (list: Category[]) =>
    [...list].sort(
      (a, b) => a.birth_year_to - a.birth_year_from - (b.birth_year_to - b.birth_year_from) || a.display_order - b.display_order,
    )[0];
  if (sex === 'F') {
    const female = fitting.filter((c) => c.gender === 'female');
    if (female.length) return narrowest(female).name;
  }
  const mixed = fitting.filter((c) => c.gender === 'mixed');
  if (mixed.length) return narrowest(mixed).name;
  return categories.length ? 'Sin categoría para ese año (escríbenos por WhatsApp)' : null;
}
