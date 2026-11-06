import React from 'react';
import { Player, PaymentRecord } from '../types';
import { useAcademy } from '../context/AcademyContext';
import { getCategoryMeta, calculateAge } from '../utils/categories';
import {
  getPlayerOverallStatus,
  getPlayerYearTimeline,
  getPlayerOverdueDetails,
  generateOverdueReminderMessage,
  MONTH_SHORT_NAMES,
  MONTH_NAMES,
  formatCurrency,
  generateWeeklyReminderMessage,
  getCurrentDateInfo,
} from '../utils/dateAndPayment';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  FileText,
  CreditCard,
  Edit,
  Eye,
  Award,
  Phone,
  Link as LinkIcon,
  Check,
  Trash2,
} from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onOpenPaymentModal: (player: Player, month?: number) => void;
  onViewReceipt: (payment: PaymentRecord, player: Player) => void;
  onOpenPlayerModal: (player: Player) => void;
  onOpenCarnet: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onOpenPaymentModal,
  onViewReceipt,
  onOpenPlayerModal,
  onOpenCarnet,
}) => {
  const { payments, selectedYear, settings, deletePlayer } = useAcademy();
  const { month: currentMonth, weekOfMonth } = getCurrentDateInfo();
  const [copiedPrivateLink, setCopiedPrivateLink] = React.useState(false);
  const [showAllMonths, setShowAllMonths] = React.useState(false);

  const handleDeletePlayer = () => {
    if (
      confirm(
        `¿Deseas eliminar definitivamente a ${player.fullName} del club?\n\nEsta acción borrará su ficha deportiva, cuotas y comprobantes.`
      )
    ) {
      deletePlayer(player.id);
    }
  };

  const handleCopyPrivateLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const url = `${origin}${pathname}?role=padre&player=${player.id}`;
    navigator.clipboard.writeText(url);
    setCopiedPrivateLink(true);
    setTimeout(() => setCopiedPrivateLink(false), 2000);
  };

  const categoryMeta = getCategoryMeta(player.category);
  const age = calculateAge(player.birthDate);
  const overall = getPlayerOverallStatus(player, selectedYear, payments);
  const timeline = getPlayerYearTimeline(player, selectedYear, payments);

  // Overdue status & dedicated message
  const overdueDetails = getPlayerOverdueDetails(player, selectedYear, payments);
  const overdueReminder = overdueDetails.isOverdue
    ? generateOverdueReminderMessage(player, settings, overdueDetails, selectedYear)
    : null;

  // Latest payment with a receipt if any
  const paymentWithReceipt = payments
    .filter((p) => p.playerId === player.id && p.receiptUrl && p.year === selectedYear)
    .sort((a, b) => b.month - a.month)[0];

  // WhatsApp regular reminder URL for this player
  const reminderInfo = generateWeeklyReminderMessage(
    player,
    settings,
    overall.currentMonthStatus,
    weekOfMonth
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Banner / Header */}
      <div>
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            {/* Player Photo with Jersey Number Badge */}
            <div className="relative shrink-0">
              <img
                src={player.photoUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150'}
                alt={player.fullName}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-200 shadow-sm"
                onError={(e) => {
                  // Fallback avatar
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150';
                }}
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-slate-900 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                #{player.jerseyNumber}
              </span>
            </div>

            {/* Name, Category, Position */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder}`}
                >
                  {categoryMeta.category}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {age} años • {player.position}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 truncate mt-0.5 hover:text-emerald-700">
                {player.fullName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{player.documentId}</p>
            </div>
          </div>

          {/* Up to date Status Badge */}
          <div className="shrink-0 flex flex-col items-end">
            {overall.currentMonthStatus.status === 'pagado' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Al Día
              </span>
            ) : overall.currentMonthStatus.status === 'pendiente_verificacion' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                En Revisión
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                {overall.monthsOverdueCount > 0
                  ? `${overall.monthsOverdueCount} Mora`
                  : 'Pendiente'}
              </span>
            )}
            <span className="text-[11px] text-slate-500 mt-1 font-semibold">
              {formatCurrency(player.monthlyFee, settings.currencyCode, settings.currencySymbol)}/mes
            </span>
          </div>
        </div>

        {/* Parent & Contact Details */}
        <div className="px-4 sm:px-5 py-2.5 bg-white flex items-center justify-between text-xs border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 truncate">
            <span className="font-semibold text-slate-700 truncate">
              Acudiente: {player.parentName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${player.parentPhone}`}
              className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
              title={`Llamar a ${player.parentPhone}`}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>

            {/* If player has active overdue debt, show dedicated Cobrar Mora WhatsApp button */}
            {overdueDetails.isOverdue ? (
              <a
                href={overdueReminder?.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-sm transition animate-pulse"
                title={`Enviar cobro de mora por WhatsApp a ${player.parentPhone}: debe ${formatCurrency(overdueDetails.totalOverdueAmount, settings.currencyCode, settings.currencySymbol)}`}
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white text-transparent" />
                <span>Cobrar Mora ({formatCurrency(overdueDetails.totalOverdueAmount, settings.currencyCode, settings.currencySymbol)})</span>
              </a>
            ) : (
              <a
                href={reminderInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition"
                title="Enviar recordatorio semanal por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-transparent" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Payment Matrix: Configured for Octubre - Diciembre 2027 */}
        <div className="p-4 sm:p-5 pt-3">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <span>Ciclo: Octubre - Diciembre {selectedYear}</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Oficial
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline"
            >
              {showAllMonths ? 'Ver solo Oct - Dic' : 'Ver 12 meses'}
            </button>
          </div>

          {!showAllMonths ? (
            /* Active Season Focus: Octubre, Noviembre, Diciembre */
            <div className="grid grid-cols-3 gap-2">
              {[10, 11, 12].map((monthNum) => {
                const info = timeline[monthNum - 1];
                let cardStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300';
                let badgeStyle = 'bg-slate-200 text-slate-700';
                let statusLabel = 'Por pagar';

                if (info.status === 'pagado') {
                  cardStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100/70';
                  badgeStyle = 'bg-emerald-600 text-white';
                  statusLabel = 'Al Día';
                } else if (info.status === 'pendiente_verificacion') {
                  cardStyle = 'bg-cyan-50/80 border-cyan-300 text-cyan-900 hover:bg-cyan-100/70';
                  badgeStyle = 'bg-cyan-600 text-white';
                  statusLabel = 'En Revisión';
                } else if (info.status === 'vencido') {
                  cardStyle = 'bg-rose-50/80 border-rose-300 text-rose-950 hover:bg-rose-100/70';
                  badgeStyle = 'bg-rose-600 text-white';
                  statusLabel = 'En Mora';
                }

                return (
                  <button
                    key={monthNum}
                    type="button"
                    onClick={() => {
                      if (info.payment && info.payment.receiptUrl) {
                        onViewReceipt(info.payment, player);
                      } else {
                        onOpenPaymentModal(player, monthNum);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1 shadow-xs ${cardStyle}`}
                    title={`Mes de ${info.monthName} ${selectedYear}: ${statusLabel}. Clic para ver comprobante o registrar pago`}
                  >
                    <span className="text-[11px] font-black uppercase text-slate-800">
                      {info.monthName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {info.payment ? 'Verificado' : `Día ${player.dueDay}`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Full Year 12-Month Matrix */
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {timeline.map((info) => {
                const isCurrent = info.isCurrentMonth;
                let chipStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                let icon = null;

                if (info.status === 'pagado') {
                  chipStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold hover:bg-emerald-100';
                  icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
                } else if (info.status === 'pendiente_verificacion') {
                  chipStyle = 'bg-cyan-50 text-cyan-700 border-cyan-300 font-bold hover:bg-cyan-100';
                  icon = <Clock className="w-3 h-3 text-cyan-600 animate-pulse" />;
                } else if (info.status === 'vencido') {
                  chipStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-bold hover:bg-rose-100';
                  icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
                } else if (info.status === 'pendiente') {
                  chipStyle = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold hover:bg-amber-100';
                }

                return (
                  <button
                    key={info.month}
                    type="button"
                    onClick={() => {
                      if (info.payment && info.payment.receiptUrl) {
                        onViewReceipt(info.payment, player);
                      } else {
                        onOpenPaymentModal(player, info.month);
                      }
                    }}
                    className={`relative p-1.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-0.5 ${chipStyle} ${
                      isCurrent ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                    }`}
                    title={`Mes de ${info.monthName}: ${info.status}`}
                  >
                    <span className="text-[10px] uppercase font-bold leading-none">
                      {MONTH_SHORT_NAMES[info.month - 1]}
                    </span>
                    <div className="h-3 flex items-center justify-center">
                      {icon || (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {info.isFutureMonth ? '—' : 'Pend'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenPaymentModal(player, currentMonth)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Registrar Pago</span>
          </button>

          {paymentWithReceipt && (
            <button
              type="button"
              onClick={() => onViewReceipt(paymentWithReceipt, player)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium transition"
              title="Ver último comprobante cargado"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comprobante</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyPrivateLink}
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition"
            title="Copiar enlace privado para que el acudiente acceda solo a este deportista"
          >
            {copiedPrivateLink ? (
              <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenCarnet(player)}
            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition font-bold"
            title="Ver e Imprimir Carnet Oficial Deportivo"
          >
            <span className="text-sm">🪪</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPlayerModal(player)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition"
            title="Editar Ficha del Deportista"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDeletePlayer}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-200 transition"
            title="Eliminar Deportista del Club"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
