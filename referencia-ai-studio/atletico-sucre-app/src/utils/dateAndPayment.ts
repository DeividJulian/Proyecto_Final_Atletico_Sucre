import { Player, PaymentRecord, MonthlyStatusInfo, PaymentStatusType, AcademySettings } from '../types';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MONTH_SHORT_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export function formatCurrency(amount: number, currencyCode: string = 'COP', currencySymbol: string = '$'): string {
  if (currencyCode === 'COP') {
    return `${currencySymbol} ${new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }
  return `${currencySymbol} ${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function getCurrentDateInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Determine current week of the month (1, 2, 3, 4, 5)
  let weekOfMonth = 1;
  if (day <= 7) weekOfMonth = 1;
  else if (day <= 14) weekOfMonth = 2;
  else if (day <= 21) weekOfMonth = 3;
  else if (day <= 28) weekOfMonth = 4;
  else weekOfMonth = 5;

  return { year, month, day, weekOfMonth, now };
}

export function getPlayerMonthlyStatus(
  player: Player,
  month: number, // 1-12
  year: number,
  payments: PaymentRecord[]
): MonthlyStatusInfo {
  const { year: currentYear, month: currentMonth, day: currentDay } = getCurrentDateInfo();

  // Find payment for this player, year, and month
  const payment = payments.find(
    (p) => p.playerId === player.id && p.year === year && p.month === month
  );

  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);
  const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);

  let status: PaymentStatusType = 'pendiente';

  if (payment) {
    if (payment.isVerified) {
      status = 'pagado';
    } else {
      status = 'pendiente_verificacion';
    }
  } else {
    if (isFutureMonth) {
      status = 'adelantado';
    } else if (isCurrentMonth) {
      if (currentDay > player.dueDay) {
        status = 'vencido';
      } else {
        status = 'pendiente';
      }
    } else if (isPastMonth) {
      status = 'vencido';
    }
  }

  return {
    month,
    monthName: MONTH_NAMES[month - 1],
    status,
    payment,
    isCurrentMonth,
    isPastMonth,
    isFutureMonth,
  };
}

export function getPlayerYearTimeline(
  player: Player,
  year: number,
  payments: PaymentRecord[]
): MonthlyStatusInfo[] {
  return Array.from({ length: 12 }, (_, i) => {
    return getPlayerMonthlyStatus(player, i + 1, year, payments);
  });
}

export function getPlayerOverallStatus(
  player: Player,
  year: number,
  payments: PaymentRecord[]
): {
  isUpToDate: boolean;
  monthsPaidCount: number;
  monthsOverdueCount: number;
  pendingVerificationCount: number;
  currentMonthStatus: MonthlyStatusInfo;
} {
  const timeline = getPlayerYearTimeline(player, year, payments);
  const { month: currentMonth } = getCurrentDateInfo();

  let monthsPaidCount = 0;
  let monthsOverdueCount = 0;
  let pendingVerificationCount = 0;

  for (const item of timeline) {
    if (item.status === 'pagado') {
      monthsPaidCount++;
    } else if (item.status === 'vencido') {
      monthsOverdueCount++;
    } else if (item.status === 'pendiente_verificacion') {
      pendingVerificationCount++;
    }
  }

  const currentMonthStatus = timeline[currentMonth - 1];
  const isUpToDate =
    monthsOverdueCount === 0 &&
    (currentMonthStatus.status === 'pagado' ||
      currentMonthStatus.status === 'pendiente_verificacion' ||
      currentMonthStatus.status === 'pendiente');

  return {
    isUpToDate,
    monthsPaidCount,
    monthsOverdueCount,
    pendingVerificationCount,
    currentMonthStatus,
  };
}

export function generateWeeklyReminderMessage(
  player: Player,
  settings: AcademySettings,
  statusInfo: MonthlyStatusInfo,
  weekOfMonth: number
): { subject: string; text: string; whatsappUrl: string } {
  const monthName = MONTH_NAMES[statusInfo.month - 1];
  const cleanPhone = player.parentPhone.replace(/[^0-9]/g, '');

  let statusText = 'Pendiente de pago';
  let emojiHeader = '⚽';
  let advice = '';

  if (statusInfo.status === 'pagado') {
    statusText = '¡AL DÍA! (Pagado y Verificado)';
    emojiHeader = '🏆';
    advice = '¡Muchas gracias por su compromiso con la formación deportiva de su campeón! Todo está en orden.';
  } else if (statusInfo.status === 'pendiente_verificacion') {
    statusText = 'En revisión (Comprobante enviado)';
    emojiHeader = '⏳';
    advice = 'Hemos recibido su comprobante y la dirección lo está validando.';
  } else if (statusInfo.status === 'vencido') {
    statusText = 'VENCIDO / PAGO PENDIENTE';
    emojiHeader = '⚠️';
    advice = `Por favor realice el pago lo antes posible para garantizar la asistencia ininterrumpida a entrenamientos y torneos oficiales.`;
  } else {
    // Pendiente
    statusText = `Por pagar (Vence el día ${player.dueDay} de ${monthName})`;
    emojiHeader = '📋';
    advice = `Le recordamos amablemente programar el pago dentro de la fecha límite establecida (día ${player.dueDay}).`;
  }

  const accountsInfo = settings.bankAccounts
    .map((acc) => `• ${acc.bankName} (${acc.accountType}): ${acc.accountNumber} - ${acc.accountHolder}`)
    .join('\n');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const privatePlayerUrl = `${origin}${pathname}?role=padre&player=${player.id}`;

  const text = `${emojiHeader} *${settings.name.toUpperCase()}* ${emojiHeader}
_${settings.slogan}_
*RECORDATORIO SEMANAL DE MENSUALIDAD (Semana ${weekOfMonth})*

Estimado/a *${player.parentName}*,
Le enviamos el estado de cuenta semanal de su deportista:

🏃‍♂️ *Deportista:* ${player.fullName}
🏅 *Categoría:* ${player.category} | Camiseta #${player.jerseyNumber}
🗓 *Mes:* ${monthName}
💵 *Valor mensualidad:* ${formatCurrency(player.monthlyFee, settings.currencyCode, settings.currencySymbol)}
📌 *Estado:* ${statusText}

${advice}

💳 *Cuentas autorizadas para el pago:*
${accountsInfo}

📲 *Acceso privado para ver pagos y subir comprobante:*
👉 ${privatePlayerUrl}

❤️ *${settings.slogan}*
¡Gracias por apoyar el sueño de su deportista! ⚽🔥`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  return {
    subject: `Recordatorio Semanal de Mensualidad - ${player.fullName} (${settings.name})`,
    text,
    whatsappUrl,
  };
}

export interface OverdueDetails {
  isOverdue: boolean;
  overdueMonths: { month: number; monthName: string; amount: number }[];
  totalOverdueAmount: number;
  overdueMonthsCount: number;
  oldestOverdueMonth: string;
  hasCurrentMonthOverdue: boolean;
  hasPastMonthsOverdue: boolean;
}

export function getPlayerOverdueDetails(
  player: Player,
  year: number,
  payments: PaymentRecord[]
): OverdueDetails {
  const timeline = getPlayerYearTimeline(player, year, payments);
  const overdueMonths: { month: number; monthName: string; amount: number }[] = [];

  let hasCurrentMonthOverdue = false;
  let hasPastMonthsOverdue = false;

  for (const item of timeline) {
    if (item.status === 'vencido') {
      overdueMonths.push({
        month: item.month,
        monthName: item.monthName,
        amount: player.monthlyFee,
      });
      if (item.isCurrentMonth) hasCurrentMonthOverdue = true;
      if (item.isPastMonth) hasPastMonthsOverdue = true;
    }
  }

  const totalOverdueAmount = overdueMonths.reduce((sum, item) => sum + item.amount, 0);

  return {
    isOverdue: overdueMonths.length > 0,
    overdueMonths,
    totalOverdueAmount,
    overdueMonthsCount: overdueMonths.length,
    oldestOverdueMonth: overdueMonths.length > 0 ? overdueMonths[0].monthName : '',
    hasCurrentMonthOverdue,
    hasPastMonthsOverdue,
  };
}

export function generateOverdueReminderMessage(
  player: Player,
  settings: AcademySettings,
  overdueDetails: OverdueDetails,
  year: number
): { subject: string; text: string; whatsappUrl: string } {
  const cleanPhone = player.parentPhone.replace(/[^0-9]/g, '');
  const monthsList = overdueDetails.overdueMonths.map((m) => m.monthName).join(', ');
  const formattedDebt = formatCurrency(
    overdueDetails.totalOverdueAmount,
    settings.currencyCode,
    settings.currencySymbol
  );

  const accountsInfo = settings.bankAccounts
    .map((acc) => `• *${acc.bankName}* (${acc.accountType}): \`${acc.accountNumber}\` - ${acc.accountHolder}`)
    .join('\n');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const privatePlayerUrl = `${origin}${pathname}?role=padre&player=${player.id}`;

  const text = `⚠️ *${settings.name.toUpperCase()}* ⚠️
_${settings.slogan}_
*AVISO DE CUOTA EN MORA Y ESTADO DE CUENTA*

Estimado/a *${player.parentName}*,
Le saludamos cordialmente de parte de la dirección deportiva. Nos comunicamos para informarle que su deportista presenta saldo pendiente en su mensualidad:

🏃‍♂️ *Deportista:* ${player.fullName}
🏅 *Categoría:* ${player.category} | Camiseta #${player.jerseyNumber}
🗓 *Mes(es) en mora:* ${monthsList} (${year})
⏳ *Cuotas vencidas:* ${overdueDetails.overdueMonthsCount} cuota(s)
💰 *TOTAL PENDIENTE POR PAGAR:* *${formattedDebt}*

⚠️ *IMPORTANTE:*
Le solicitamos amablemente realizar el pago a la brevedad para garantizar la continuidad del deportista en los entrenamientos, partidos y la cobertura deportiva del club.

💳 *Cuentas autorizadas para realizar el pago:*
${accountsInfo}

📲 *Subir comprobante de pago inmediatamente:*
👉 ${privatePlayerUrl}
_(Al ingresar desde el enlace puede adjuntar la foto o captura del pago y quedará registrado automáticamente)_

Si ya realizó la transferencia el día de hoy, por favor envíenos el comprobante por este medio o cárguelo en el enlace.

❤️ *En Atlético Sucre enseñamos de corazón a corazón.*
¡Agradecemos su valioso apoyo y compromiso! ⚽🏆`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  return {
    subject: `Aviso de Mora - ${player.fullName} (${settings.name})`,
    text,
    whatsappUrl,
  };
}

export type GroupBroadcastType = 'partido' | 'entrenamiento' | 'comunicado' | 'mensualidad_general' | 'inscripciones';

export interface GroupBroadcastOptions {
  type: GroupBroadcastType;
  category: string; // 'Todas' or specific category
  title?: string;
  details?: {
    rival?: string;
    venue?: string;
    date?: string;
    time?: string;
    uniform?: string;
    notes?: string;
    customBody?: string;
  };
}

export function generateGroupBroadcastMessage(
  settings: AcademySettings,
  options: GroupBroadcastOptions
): { text: string; whatsappShareUrl: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const registrationUrl = `${origin}${pathname}?action=registro`;
  const parentPortalUrl = `${origin}${pathname}?role=padre`;

  let body = '';
  const categoryHeader = options.category === 'Todas' ? 'TODAS LAS CATEGORÍAS' : `CATEGORÍA ${options.category.toUpperCase()}`;

  if (options.type === 'partido') {
    body = `⚽ *CONVOCATORIA Y CITACIÓN A PARTIDO* ⚽
🏆 *${categoryHeader}*

Estimada familia de *${settings.name}*, se informa la programación del próximo encuentro oficial:

📅 *Fecha:* ${options.details?.date || 'Este fin de semana'}
⏰ *Hora de citación:* ${options.details?.time || 'Por confirmar'}
🏟 *Lugar / Cancha:* ${options.details?.venue || 'Sede oficial'}
⚔️ *Rival:* ${options.details?.rival || 'Por definir'}
🎽 *Uniforme:* ${options.details?.uniform || 'Uniforme oficial completo, canilleras y termo de hidratación'}

${options.details?.notes ? `📌 *Observaciones:* ${options.details.notes}\n` : ''}
⚠️ *Recordatorio:* Puntualidad estricta y asistencia con la mejor actitud para representar a nuestra escuela.`;
  } else if (options.type === 'entrenamiento') {
    body = `🏃‍♂️ *HORARIOS Y CONVOCATORIA DE ENTRENAMIENTO* 🏃‍♂️
⚡ *${categoryHeader}*

Queridos padres de familia y deportistas, compartimos la programación de entrenamientos:

📅 *Días y Horarios:* ${options.details?.time || 'Martes y Jueves 4:00 PM - 6:00 PM'}
🏟 *Lugar:* ${options.details?.venue || settings.address || 'Cancha principal'}
🎒 *Requisitos:* Hidratación personal, uniforme de entrenamiento y espinilleras.

${options.details?.notes ? `📌 *Nota:* ${options.details.notes}\n` : ''}
¡La disciplina y la constancia hacen a los campeones! 💪⚽`;
  } else if (options.type === 'mensualidad_general') {
    const accountsInfo = settings.bankAccounts
      .map((acc) => `• ${acc.bankName} (${acc.accountType}): *${acc.accountNumber}* - ${acc.accountHolder}`)
      .join('\n');

    body = `📢 *RECORDATORIO GENERAL DE PAGO DE MENSUALIDADES* 📢
⚽ *${settings.name.toUpperCase()}*

Apreciada comunidad y padres de familia de la *${categoryHeader}*:

Le recordamos amablemente a las familias que la fecha límite para el pago de la mensualidad está vigente. Mantenerse al día nos permite asegurar canchas, material deportivo y participación en torneos.

💳 *Cuentas habilitadas:*
${accountsInfo}

📲 *Carga de comprobantes y consulta de estado:*
👉 ${parentPortalUrl}

Agradecemos inmensamente su puntualidad y constante apoyo al proceso deportivo de sus hijos. ❤️`;
  } else if (options.type === 'inscripciones') {
    body = `🌟 *INSCRIPCIONES ABIERTAS - ESCUELA DE FÚTBOL* 🌟
⚽ *${settings.name.toUpperCase()}*
_${settings.slogan}_

¡Invitamos a niños, niñas y jóvenes a formar parte de nuestra gran familia deportiva!

🏆 *Formación integral, valores y competencia oficial.*
👶 *Categorías:* Desde Sub-6 hasta Sub-18.
📍 *Sede:* ${settings.address || 'Ipiales - Nariño'}
📞 *Contacto / Informes:* ${settings.phone}

📝 *Inscripción directa en línea:*
👉 ${registrationUrl}

¡Ven y vive la pasión del fútbol con nosotros! ⚽🔥`;
  } else {
    // Comunicado general
    body = `📢 *COMUNICADO OFICIAL* 📢
⚽ *${settings.name.toUpperCase()}*
_${settings.slogan}_

*${options.title || 'INFORMACIÓN IMPORTANTE PARA PADRES Y DEPORTISTAS'}*
📌 *${categoryHeader}*

${options.details?.customBody || 'Queremos compartirles información importante referente a nuestras actividades deportivas.'}

${options.details?.notes ? `\n📌 *Detalles adicionales:* ${options.details.notes}` : ''}

Para cualquier inquietud comunicarse con la dirección deportiva:
📞 ${settings.phone} | ${settings.directorName}

❤️ *En Atlético Sucre enseñamos de corazón a corazón.*`;
  }

  const text = `${body}\n\n❤️ *${settings.slogan}*`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  return { text, whatsappShareUrl };
}

export function generatePersonalNoticeMessage(
  player: Player,
  settings: AcademySettings,
  message: string,
  subject: string = 'Información del Club'
): { text: string; whatsappUrl: string } {
  const cleanPhone = player.parentPhone.replace(/[^0-9]/g, '');

  const text = `⚽ *${settings.name.toUpperCase()}* ⚽
_${settings.slogan}_
*${subject.toUpperCase()}*

Estimado/a *${player.parentName}*,
Acudiente del deportista *${player.fullName}* (${player.category}):

${message}

Cualquier duda con gusto le atenderemos.
📞 ${settings.phone} - ${settings.directorName}
❤️ *${settings.slogan}*`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  return { text, whatsappUrl };
}

