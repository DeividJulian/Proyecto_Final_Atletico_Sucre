import { ScheduleItem, TrainingShift } from '../models/public';

/** One row of the schedule card: a weekday and a time range, with the venues and categories that use it. */
export interface ScheduleSlot {
  weekday: number;
  weekdayName: string;
  start: string;
  end: string;
  shift: TrainingShift;
  venues: string[];
  categories: string[];
}

export interface ShiftBlock {
  shift: 'morning' | 'afternoon';
  title: string;
  hint: string;
  slots: ScheduleSlot[];
}

export const SHIFT_TEXT: Record<'morning' | 'afternoon', { title: string; hint: string }> = {
  morning: { title: 'Jornada mañana', hint: 'Ideal para quienes estudian en la tarde' },
  afternoon: { title: 'Jornada tarde', hint: 'Perfecta para quienes estudian en la mañana' },
};

/**
 * Groups the weekly sessions into the two training shifts. Sessions open to everybody ("all", e.g. Saturday)
 * appear in both. Identical slots of different categories are merged into one row.
 */
export function groupByShift(items: ScheduleItem[], categoryId: number | null = null): ShiftBlock[] {
  const selected = categoryId === null ? items : items.filter((item) => item.category_id === categoryId);

  return (['morning', 'afternoon'] as const).map((shift) => {
    const slots = new Map<string, ScheduleSlot>();
    for (const item of selected) {
      if (item.shift !== shift && item.shift !== 'all') continue;
      const key = `${item.weekday}|${item.start_time}|${item.end_time}`;
      const slot = slots.get(key) ?? {
        weekday: item.weekday,
        weekdayName: item.weekday_name,
        start: item.start_time,
        end: item.end_time,
        shift: item.shift,
        venues: [],
        categories: [],
      };
      if (!slot.venues.includes(item.venue_name)) slot.venues.push(item.venue_name);
      if (!slot.categories.includes(item.category_name)) slot.categories.push(item.category_name);
      slots.set(key, slot);
    }
    const ordered = [...slots.values()].sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
    return { shift, ...SHIFT_TEXT[shift], slots: ordered };
  });
}
