import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player, PaymentRecord } from '../types';
import { getCategoryMeta, calculateAge } from '../utils/categories';
import {
  getPlayerOverallStatus,
  getPlayerYearTimeline,
  MONTH_NAMES,
  MONTH_SHORT_NAMES,
  formatCurrency,
  getCurrentDateInfo,
} from '../utils/dateAndPayment';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  Award,
  CreditCard,
  Copy,
  Check,
  Calendar,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  Share2,
  Search,
  Lock,
  LogOut,
  ArrowRight,
  User,
  Sparkles,
  BookOpen,
  Edit,
} from 'lucide-react';
import { ParentTutorialModal } from './ParentTutorialModal';

interface ParentViewProps {
  onOpenPaymentModal: (player: Player, month?: number) => void;
  onViewReceipt: (payment: PaymentRecord, player: Player) => void;
  onOpenCarnet: (player: Player) => void;
  onOpenRegisterPlayer: () => void;
  onOpenEditPlayer: (player: Player) => void;
  onOpenShareModal: () => void;
}

export const ParentView: React.FC<ParentViewProps> = ({
  onOpenPaymentModal,
  onViewReceipt,
  onOpenCarnet,
  onOpenRegisterPlayer,
  onOpenEditPlayer,
  onOpenShareModal,
}) => {
  const {
    players,
    payments,
    selectedYear,
    settings,
    activeParentPlayer,
    parentChildren,
    loginParentByQuery,
    selectParentPlayer,
    logoutParent,
  } = useAcademy();

  const { month: currentMonth, weekOfMonth } = getCurrentDateInfo();
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  const [searchDoc, setSearchDoc] = useState('');
  const [searchError, setSearchError] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchDoc.trim()) return;

    const found = loginParentByQuery(searchDoc);
    if (!found) {
      setSearchError(
        'No se encontró ningún deportista con este documento o teléfono. Verifica los números o inscríbelo como nuevo alumno.'
      );
    }
  };

  const handleCopyAccount = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedAccount(accNumber);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // If the parent has NOT authenticated or selected their child yet:
  if (!activeParentPlayer) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Welcome Card with Club Shield */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 text-center space-y-5">
          {/* Logo Frame */}
          <div className="relative inline-block">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-slate-900 p-2 shadow-xl ring-4 ring-emerald-500/20 overflow-hidden flex items-center justify-center">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-5xl">⚽</span>
              )}
            </div>
            <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
              Portal de Padres
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {settings.name}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 italic">
              «{settings.slogan}»
            </p>
            <p className="text-xs text-slate-500 pt-2 max-w-sm mx-auto">
              Para proteger la privacidad de cada deportista, ingresa el documento de tu hijo/a o tu
              teléfono registrado para acceder a su ficha individual.
            </p>
          </div>

          {/* Identification Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Documento del Niño/a (TI / RC) o Celular del Acudiente
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDoc}
                  onChange={(e) => {
                    setSearchDoc(e.target.value);
                    setSearchError('');
                  }}
                  placeholder="Ej: 1098344201 o 3104501234"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-slate-50/50"
                  required
                />
              </div>
              {searchError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-start gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-700/25 transition flex items-center justify-center gap-2 transform active:scale-98"
            >
              <span>Acceder a la Ficha de mi Deportista</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Actions: Register and Tutorial */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs bg-slate-50/70 p-3 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-200"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>📖 Tutorial para Padres</span>
            </button>

            <button
              type="button"
              onClick={onOpenRegisterPlayer}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Inscribir Nuevo Deportista</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <p>
            <strong>Privacidad de Menores:</strong> Los padres de familia solo pueden ver la
            información, mensualidades y fotos de sus propios hijos inscritos.
          </p>
        </div>

        <ParentTutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />
      </div>
    );
  }

  // Active Parent Player Found -> Show ONLY their child's profile and form!
  const categoryMeta = getCategoryMeta(activeParentPlayer.category);
  const age = calculateAge(activeParentPlayer.birthDate);
  const overall = getPlayerOverallStatus(activeParentPlayer, selectedYear, payments);
  const timeline = getPlayerYearTimeline(activeParentPlayer, selectedYear, payments);
  const currentMonthStatus = overall.currentMonthStatus;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Session Security Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sesión de Acudiente:</span>
              <strong className="text-xs text-white truncate">{activeParentPlayer.parentName}</strong>
            </div>
            <p className="text-[11px] text-emerald-300 truncate">
              Viendo únicamente a: <strong>{activeParentPlayer.fullName}</strong> ({activeParentPlayer.category})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* If the same parent has more than 1 child registered */}
          {parentChildren.length > 1 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-400 hidden md:inline">Mis hijos:</span>
              {parentChildren.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => selectParentPlayer(child.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    child.id === activeParentPlayer.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {child.fullName.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenRegisterPlayer}
            className="px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            title="Inscribir a otro hijo"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Inscribir Hijo</span>
          </button>

          <button
            type="button"
            onClick={logoutParent}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-700"
            title="Cerrar la sesión de mi deportista"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Hero Player Profile & Monthly Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Header with Sports styling */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Player Photo with Frame */}
            <div className="relative shrink-0">
              <img
                src={activeParentPlayer.photoUrl}
                alt={activeParentPlayer.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-sm px-2.5 py-0.5 rounded-full border-2 border-white shadow">
                #{activeParentPlayer.jerseyNumber}
              </span>
            </div>

            {/* Player Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} border`}
                >
                  {categoryMeta.name}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {age} años • Posición: {activeParentPlayer.position}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {activeParentPlayer.fullName}
              </h2>

              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Doc: {activeParentPlayer.documentId} • Acudiente: {activeParentPlayer.parentName}
              </p>

              {/* Status Banner */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {currentMonthStatus.status === 'pagado' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>¡Felicitaciones! Mensualidad de {currentMonthName} al día</span>
                  </div>
                ) : currentMonthStatus.status === 'pendiente_verificacion' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-sm">
                    <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span>Comprobante de {currentMonthName} en revisión por el director</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-sm animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>Mensualidad de {currentMonthName} pendiente de pago</span>
                  </div>
                )}

                <div className="text-xs text-slate-300 bg-white/10 px-3 py-2 rounded-xl">
                  Valor cuota:{' '}
                  <strong className="text-white text-sm">
                    {formatCurrency(
                      activeParentPlayer.monthlyFee,
                      settings.currencyCode,
                      settings.currencySymbol
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onOpenPaymentModal(activeParentPlayer, currentMonth)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenCarnet(activeParentPlayer)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                title="Descargar e imprimir carnet oficial deportivo"
              >
                <span>🪪 Carnet Oficial Deportivo</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEditPlayer(activeParentPlayer)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm active:scale-95"
                title="Corregir o editar datos del formulario de inscripción"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-400" />
                <span>✏️ Corregir / Editar Formulario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Reminder Box ("Recordatorio Semanal Permanente") */}
        <div className="p-4 sm:p-6 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <span>Recordatorio Semanal (Semana {weekOfMonth} de {currentMonthName})</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  Día de corte: {activeParentPlayer.dueDay} de cada mes
                </span>
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Para que {activeParentPlayer.fullName.split(' ')[0]} continúe entrenando y participe en
                los partidos oficiales del fin de semana, por favor asegúrate de registrar y cargar el
                comprobante a tiempo.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
            <a
              href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}?text=Hola%20Profesor%20Carlos,%20le%20escribe%20el%20acudiente%20de%20${encodeURIComponent(
                activeParentPlayer.fullName
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hablar con la Escuela</span>
            </a>
          </div>
        </div>

        {/* Official Season Payment Matrix: Octubre - Diciembre 2027 */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  {showAllMonths
                    ? `Estado de Mensualidades ${selectedYear} (12 Meses)`
                    : `Ciclo Oficial: Octubre - Diciembre ${selectedYear}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {showAllMonths ? 'Todo el año' : 'Ciclo Oficial'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona cualquier mes para ver los detalles del pago o subir tu comprobante de transferencia.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-blue-200"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>¿Cómo usar la App?</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAllMonths(!showAllMonths)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                {showAllMonths ? 'Ver solo Oct - Dic' : 'Ver 12 Meses'}
              </button>
            </div>
          </div>

          {/* Cards for each month */}
          <div className={`grid gap-3 sm:gap-4 ${showAllMonths ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {(showAllMonths ? timeline : timeline.filter((m) => m.month >= 10 && m.month <= 12)).map((info) => {
              const isCurrent = info.isCurrentMonth;
              const hasReceipt = Boolean(info.payment?.receiptUrl);

              let cardBg = 'bg-white border-slate-200';
              let statusLabel = 'Pendiente';
              let statusColor = 'text-slate-500 bg-slate-100';
              let icon = null;

              if (info.status === 'pagado') {
                cardBg = 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300';
                statusLabel = 'Pagado';
                statusColor = 'text-emerald-700 bg-emerald-100';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
              } else if (info.status === 'pendiente_verificacion') {
                cardBg = 'bg-cyan-50/50 border-cyan-200 hover:border-cyan-300';
                statusLabel = 'En Revisión';
                statusColor = 'text-cyan-700 bg-cyan-100';
                icon = <Clock className="w-4 h-4 text-cyan-600" />;
              } else if (info.status === 'vencido') {
                cardBg = 'bg-rose-50/50 border-rose-200 hover:border-rose-300';
                statusLabel = 'Vencido';
                statusColor = 'text-rose-700 bg-rose-100';
                icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
              } else if (info.status === 'pendiente') {
                cardBg = 'bg-amber-50/50 border-amber-200 hover:border-amber-300';
                statusLabel = 'Por Pagar';
                statusColor = 'text-amber-700 bg-amber-100';
              } else {
                statusLabel = 'Futuro';
              }

              return (
                <div
                  key={info.month}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${cardBg} ${
                    isCurrent ? 'ring-2 ring-emerald-500 shadow-md' : 'shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-black uppercase text-slate-800">
                        {info.monthName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusColor}`}
                      >
                        {icon}
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {info.payment ? (
                        <>
                          <strong className="text-slate-800">
                            {formatCurrency(
                              info.payment.amount,
                              settings.currencyCode,
                              settings.currencySymbol
                            )}
                          </strong>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {info.payment.paymentMethod}
                          </span>
                        </>
                      ) : (
                        <span>
                          Cuota:{' '}
                          {formatCurrency(
                            activeParentPlayer.monthlyFee,
                            settings.currencyCode,
                            settings.currencySymbol
                          )}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Actions per month */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center gap-1.5">
                    {hasReceipt ? (
                      <button
                        type="button"
                        onClick={() => onViewReceipt(info.payment!, activeParentPlayer)}
                        className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Comprobante</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal(activeParentPlayer, info.month)}
                        className={`w-full py-1.5 px-2 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 ${
                          info.status === 'vencido' || isCurrent
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Soporte</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Registered Athlete Profile Data Summary & Edit Option */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
              📋
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ficha de Inscripción de {activeParentPlayer.fullName}
              </h3>
              <p className="text-xs text-slate-500">
                Información registrada en la base de datos oficial del Club Atlético Sucre.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenEditPlayer(activeParentPlayer)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm self-stretch sm:self-auto justify-center"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>✏️ Corregir / Modificar Datos</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre Completo</span>
            <span className="font-bold text-slate-800 text-sm">{activeParentPlayer.fullName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Documento de Identidad</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{activeParentPlayer.documentId}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Nacimiento / Edad</span>
            <span className="font-bold text-slate-800 text-sm">{activeParentPlayer.birthDate} ({age} años)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Categoría Asignada</span>
            <span className="font-bold text-emerald-700 text-sm">{categoryMeta.name}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Dorsal y Posición</span>
            <span className="font-bold text-slate-800 text-sm">Camiseta #{activeParentPlayer.jerseyNumber} • {activeParentPlayer.position}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Acudiente y Teléfono</span>
            <span className="font-bold text-slate-800 text-sm">{activeParentPlayer.parentName} ({activeParentPlayer.parentPhone})</span>
          </div>
        </div>

        {activeParentPlayer.notes && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Observaciones médicas / notas:</strong> {activeParentPlayer.notes}
          </div>
        )}
      </div>

      {/* Authorized Bank Accounts Box for easy payment */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cuentas Autorizadas para Pago de Mensualidad
            </h3>
            <p className="text-xs text-slate-500">
              Realiza la transferencia y luego sube la captura de pantalla o foto del comprobante.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {settings.bankAccounts.map((account, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  {account.bankName} • {account.accountType}
                </span>
                <p className="text-base font-mono font-black text-slate-900 mt-0.5">
                  {account.accountNumber}
                </p>
                <p className="text-xs text-slate-500">{account.accountHolder}</p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyAccount(account.accountNumber)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition"
              >
                {copiedAccount === account.accountNumber ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <ParentTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};
