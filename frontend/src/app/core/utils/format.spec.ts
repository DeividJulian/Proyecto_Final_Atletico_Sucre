import { formatCop, formatPhone, formatTime, mapsLink, whatsappLink } from './format';

describe('format helpers', () => {
  it('formats Colombian pesos without decimals', () => {
    expect(formatCop(65000)).toMatch(/^\$\s?65\.000$/);
    expect(formatCop(20000)).toMatch(/^\$\s?20\.000$/);
  });

  it('formats API times as 12-hour clock in Spanish', () => {
    expect(formatTime('08:00:00')).toBe('8:00 a. m.');
    expect(formatTime('14:30:00')).toBe('2:30 p. m.');
    expect(formatTime('12:30:00')).toBe('12:30 p. m.');
    expect(formatTime('00:15:00')).toBe('12:15 a. m.');
  });

  it('builds WhatsApp links with an encoded message', () => {
    expect(whatsappLink('573218543957', 'Hola club')).toBe('https://wa.me/573218543957?text=Hola%20club');
  });

  it('uses the venue map link or searches the venue in Ipiales', () => {
    expect(mapsLink('Cancha', 'https://maps.app/x', null)).toBe('https://maps.app/x');
    expect(mapsLink('Colegio Seminario', null, null)).toContain(encodeURIComponent('Colegio Seminario, Ipiales'));
  });

  it('formats Colombian mobile numbers', () => {
    expect(formatPhone('573218543957')).toBe('321 854 3957');
    expect(formatPhone('3001234567')).toBe('300 123 4567');
  });
});
