import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { getCurrentDateInfo, MONTH_NAMES, getPlayerOverallStatus } from '../utils/dateAndPayment';

interface WeeklyReminderBannerProps {
  onOpenBatchWhatsApp?: () => void;
  onOpenPaymentModalForCurrent?: () => void;
}

export const WeeklyReminderBanner: React.FC<WeeklyReminderBannerProps> = ({
  onOpenBatchWhatsApp,
  onOpenPaymentModalForCurrent,
}) => {
  const { role, players, payments, selectedYear, selectedPlayerId, settings } = useAcademy();
  const { month, day, weekOfMonth } = getCurrentDateInfo();

  const currentMonthName = MONTH_NAMES[month - 1];

  // Director calculations
  let playersUpToDate = 0;
  let playersOverdue = 0;
  let playersPendingReceipt = 0;

  players.forEach((p) => {
    const status = getPlayerOverallStatus(p, selectedYear, payments);
    if (status.currentMonthStatus.status === 'pagado') {
      playersUpToDate++;
    } else if (status.currentMonthStatus.status === 'vencido') {
      playersOverdue++;
    } else if (status.currentMonthStatus.status === 'pendiente_verificacion') {
      playersPendingReceipt++;
    } else {
      // Due soon
      playersOverdue++;
    }
  });

  // Selected player for Parent view
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];
  const parentPlayerStatus = selectedPlayer
    ? getPlayerOverallStatus(selectedPlayer, selectedYear, payments)
    : null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-800/40 text-white py-3 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative soccer ball faint background */}
      <div className="absolute right-3 -bottom-6 text-7xl opacity-5 select-none pointer-events-none">
        ⚽
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Weekly cycle information */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 tracking-wide uppercase">
                Semana {weekOfMonth} • {currentMonthName}
              </span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Día {day} de {currentMonthName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
              {role === 'director' ? (
                <>
                  <span className="text-white font-semibold">Recordatorio Semanal Activo:</span>{' '}
                  Monitoreo de cuotas al día.
                  <span className="text-emerald-300 font-semibold italic hidden lg:inline">
                    ❤️ «{settings.slogan}»
                  </span>
                </>
              ) : (
                <>
                  <span className="text-white font-semibold">Recordatorio Semanal:</span>{' '}
                  Recuerda estar al día con la mensualidad de la escuela.
                  <span className="text-emerald-300 font-semibold italic hidden lg:inline">
                    ❤️ «{settings.slogan}»
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Role-specific contextual action & indicators */}
        {role === 'director' ? (
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{playersUpToDate}</strong> al día
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>{playersOverdue}</strong> pendientes
                </span>
              </div>
              {playersPendingReceipt > 0 && (
                <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    <strong>{playersPendingReceipt}</strong> por revisar
                  </span>
                </div>
              )}
            </div>

            {onOpenBatchWhatsApp && (
              <button
                type="button"
                onClick={onOpenBatchWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp Semanal</span>
              </button>
            )}
          </div>
        ) : (
          /* Parent view */
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {parentPlayerStatus && (
              <div className="flex items-center gap-2">
                {parentPlayerStatus.currentMonthStatus.status === 'pagado' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ¡{currentMonthName} Pagado y Al Día!
                  </span>
                ) : parentPlayerStatus.currentMonthStatus.status === 'pendiente_verificacion' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Comprobante de {currentMonthName} en revisión
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Cuota de {currentMonthName} por pagar
                  </span>
                )}
              </div>
            )}

            {onOpenPaymentModalForCurrent && parentPlayerStatus?.currentMonthStatus.status !== 'pagado' && (
              <button
                type="button"
                onClick={onOpenPaymentModalForCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Registrar Pago de {currentMonthName}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
