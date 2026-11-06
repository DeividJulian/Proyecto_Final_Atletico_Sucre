/** Small formatting helpers shared by the public sections (Colombian conventions). */

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** 65000 → "$ 65.000" */
export function formatCop(value: number): string {
  return COP.format(value).replace(/ /g, ' ');
}

/** "14:30:00" → "2:30 p. m." */
export function formatTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** wa.me link to the club; the number comes from the API ("57" + 10 digits). */
export function whatsappLink(number: string, text = 'Hola, quiero información sobre el Club Atlético Sucre.'): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** The venue's own Maps link, or a search for its name in Ipiales. */
export function mapsLink(name: string, mapsUrl: string | null, address: string | null): string {
  if (mapsUrl) return mapsUrl;
  const query = `${address ?? name}, Ipiales, Nariño, Colombia`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** "3218543957" → "321 854 3957" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '');
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : phone;
}
