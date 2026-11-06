import { ScheduleItem } from '../models/public';
import { groupByShift } from './schedule';

function item(categoryId: number, weekday: number, start: string, end: string, shift: ScheduleItem['shift']): ScheduleItem {
  return {
    session_id: Math.random(),
    category_id: categoryId,
    category_name: `Categoría ${categoryId}`,
    venue_id: 1,
    venue_name: 'Cancha Grupo Cabal',
    weekday,
    weekday_name: ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][weekday],
    start_time: start,
    end_time: end,
    shift,
  };
}

const ITEMS: ScheduleItem[] = [
  item(1, 4, '08:00:00', '10:00:00', 'morning'),
  item(1, 2, '08:00:00', '10:00:00', 'morning'),
  item(1, 2, '14:30:00', '17:30:00', 'afternoon'),
  item(1, 6, '08:30:00', '12:30:00', 'all'),
  item(2, 2, '08:00:00', '10:00:00', 'morning'),
];

describe('groupByShift', () => {
  it('splits sessions into morning and afternoon, with shared sessions in both', () => {
    const [morning, afternoon] = groupByShift(ITEMS);
    expect(morning.shift).toBe('morning');
    expect(morning.slots.map((s) => s.weekdayName)).toEqual(['Martes', 'Jueves', 'Sábado']);
    expect(afternoon.slots.map((s) => s.weekdayName)).toEqual(['Martes', 'Sábado']);
  });

  it('merges identical slots of different categories', () => {
    const [morning] = groupByShift(ITEMS);
    expect(morning.slots[0].categories).toEqual(['Categoría 1', 'Categoría 2']);
  });

  it('filters by category', () => {
    const [morning, afternoon] = groupByShift(ITEMS, 2);
    expect(morning.slots.length).toBe(1);
    expect(afternoon.slots.length).toBe(0);
  });
});
