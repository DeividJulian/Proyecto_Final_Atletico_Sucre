import { AgeCategory } from '../types';

export interface CategoryMeta {
  category: AgeCategory;
  name: string;
  minAge: number;
  maxAge: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    category: 'Sub-6',
    name: 'Sub-6 (Semillitas / Iniciación)',
    minAge: 4,
    maxAge: 6,
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentColor: '#10b981',
    description: 'Iniciación motriz y juegos pre-deportivos (4 a 6 años)',
  },
  {
    category: 'Sub-7',
    name: 'Sub-7 (Pre-Benjamín)',
    minAge: 7,
    maxAge: 7,
    badgeBg: 'bg-teal-50 text-teal-700',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    accentColor: '#14b8a6',
    description: 'Coordinación psicomotriz y primer contacto con el balón (7 años)',
  },
  {
    category: 'Sub-8',
    name: 'Sub-8 (Benjamín)',
    minAge: 8,
    maxAge: 8,
    badgeBg: 'bg-cyan-50 text-cyan-700',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    accentColor: '#06b6d4',
    description: 'Fundamentos técnicos individuales y juego colectivo (8 años)',
  },
  {
    category: 'Sub-9',
    name: 'Sub-9 (Pre-Alevín)',
    minAge: 9,
    maxAge: 9,
    badgeBg: 'bg-sky-50 text-sky-700',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    accentColor: '#0284c7',
    description: 'Conducción orientada, pase corto y recepción activa (9 años)',
  },
  {
    category: 'Sub-10',
    name: 'Sub-10 (Alevín)',
    minAge: 10,
    maxAge: 10,
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentColor: '#2563eb',
    description: 'Dominio de balón, pase preciso y posicionamiento táctico (10 años)',
  },
  {
    category: 'Sub-11',
    name: 'Sub-11 (Pre-Infantil)',
    minAge: 11,
    maxAge: 11,
    badgeBg: 'bg-indigo-50 text-indigo-700',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    accentColor: '#4f46e5',
    description: 'Transición ofensiva-defensiva y visión periférica (11 años)',
  },
  {
    category: 'Sub-12',
    name: 'Sub-12 (Infantil)',
    minAge: 12,
    maxAge: 12,
    badgeBg: 'bg-violet-50 text-violet-700',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200',
    accentColor: '#7c3aed',
    description: 'Táctica de equipo, balón parado y ritmo competitivo (12 años)',
  },
  {
    category: 'Sub-13',
    name: 'Sub-13 (Infantil Mayor)',
    minAge: 13,
    maxAge: 13,
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentColor: '#9333ea',
    description: 'Desarrollo físico, presión tras pérdida y juego aéreo (13 años)',
  },
  {
    category: 'Sub-14',
    name: 'Sub-14 (Pre-Juvenil)',
    minAge: 14,
    maxAge: 14,
    badgeBg: 'bg-fuchsia-50 text-fuchsia-700',
    badgeText: 'text-fuchsia-700',
    badgeBorder: 'border-fuchsia-200',
    accentColor: '#c026d3',
    description: 'Preparación física intensiva y torneos departamentales (14 años)',
  },
  {
    category: 'Sub-15',
    name: 'Sub-15 (Cadete / Promesas)',
    minAge: 15,
    maxAge: 15,
    badgeBg: 'bg-pink-50 text-pink-700',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    accentColor: '#db2777',
    description: 'Velocidad, potencia y toma de decisiones bajo presión (15 años)',
  },
  {
    category: 'Sub-16',
    name: 'Sub-16 (Juvenil Menor)',
    minAge: 16,
    maxAge: 16,
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accentColor: '#e11d48',
    description: 'Alto rendimiento, maduración física y esquemas tácticos (16 años)',
  },
  {
    category: 'Sub-17',
    name: 'Sub-17 (Juvenil Intermedio)',
    minAge: 17,
    maxAge: 17,
    badgeBg: 'bg-amber-50 text-amber-800',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentColor: '#d97706',
    description: 'Competencia de alto nivel y proyección semiprofesional (17 años)',
  },
  {
    category: 'Sub-18',
    name: 'Sub-18 (Juvenil Mayor)',
    minAge: 18,
    maxAge: 18,
    badgeBg: 'bg-orange-50 text-orange-800',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    accentColor: '#ea580c',
    description: 'Proyección profesional, torneos nacionales y categoría élite (18 años)',
  },
];

export function calculateAge(birthDateString: string, referenceDate: Date = new Date()): number {
  if (!birthDateString) return 0;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return 0;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function detectCategoryFromBirthDate(birthDateString: string): AgeCategory {
  const age = calculateAge(birthDateString);
  if (age <= 6) return 'Sub-6';
  if (age === 7) return 'Sub-7';
  if (age === 8) return 'Sub-8';
  if (age === 9) return 'Sub-9';
  if (age === 10) return 'Sub-10';
  if (age === 11) return 'Sub-11';
  if (age === 12) return 'Sub-12';
  if (age === 13) return 'Sub-13';
  if (age === 14) return 'Sub-14';
  if (age === 15) return 'Sub-15';
  if (age === 16) return 'Sub-16';
  if (age === 17) return 'Sub-17';
  return 'Sub-18';
}

export function getCategoryMeta(cat: AgeCategory): CategoryMeta {
  const found = CATEGORIES.find((c) => c.category === cat);
  return (
    found || {
      category: cat,
      name: cat,
      minAge: 0,
      maxAge: 18,
      badgeBg: 'bg-gray-100 text-gray-800',
      badgeText: 'text-gray-800',
      badgeBorder: 'border-gray-200',
      accentColor: '#6b7280',
      description: '',
    }
  );
}
