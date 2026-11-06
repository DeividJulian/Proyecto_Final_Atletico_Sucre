import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player, AgeCategory } from '../types';
import { CATEGORIES } from '../utils/categories';
import {
  MONTH_NAMES,
  formatCurrency,
  getCurrentDateInfo,
  getPlayerOverdueDetails,
  generateOverdueReminderMessage,
  generateWeeklyReminderMessage,
  generateGroupBroadcastMessage,
  generatePersonalNoticeMessage,
  GroupBroadcastType,
  GroupBroadcastOptions,
} from '../utils/dateAndPayment';
import {
  X,
  MessageCircle,
  AlertTriangle,
  Users,
  User,
  Calendar,
  Send,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Trophy,
  Activity,
  Megaphone,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface WhatsAppBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'morosos' | 'grupos' | 'personal' | 'semanal';
}

export const WhatsAppBatchModal: React.FC<WhatsAppBatchModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'morosos',
}) => {
  const { players, payments, selectedYear, settings } = useAcademy();
  const { month: currentMonth, weekOfMonth } = getCurrentDateInfo();

  const [activeTab, setActiveTab] = useState<'morosos' | 'grupos' | 'personal' | 'semanal'>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group broadcast state
  const [broadcastType, setBroadcastType] = useState<GroupBroadcastType>('partido');
  const [broadcastCategory, setBroadcastCategory] = useState<string>('Todas');
  const [broadcastDate, setBroadcastDate] = useState<string>('Este fin de semana');
  const [broadcastTime, setBroadcastTime] = useState<string>('08:00 AM (Presentarse 30 min antes)');
  const [broadcastVenue, setBroadcastVenue] = useState<string>('Cancha Sintética Municipal');
  const [broadcastRival, setBroadcastRival] = useState<string>('Por confirmar');
  const [broadcastUniform, setBroadcastUniform] = useState<string>('Uniforme oficial azul, espinilleras y termo de agua');
  const [broadcastNotes, setBroadcastNotes] = useState<string>('Por favor confirmar asistencia con anticipación.');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('INFORMACIÓN IMPORTANTE PARA PADRES Y DEPORTISTAS');
  const [broadcastCustomBody, setBroadcastCustomBody] = useState<string>(
    'Les informamos las próximas actividades programadas de la escuela de fútbol.'
  );
  const [customBroadcastText, setCustomBroadcastText] = useState<string>('');
  const [hasManuallyEdited, setHasManuallyEdited] = useState<boolean>(false);

  // Personal message state
  const [selectedPersonalPlayerId, setSelectedPersonalPlayerId] = useState<string>(players[0]?.id || '');
  const [personalSubject, setPersonalSubject] = useState<string>('Seguimiento Deportivo');
  const [personalMessage, setPersonalMessage] = useState<string>(
    'Le escribimos desde la dirección de Atlético Sucre para felicitar el gran desempeño y disciplina de su deportista en los últimos entrenamientos.'
  );

  if (!isOpen) return null;

  // 1. Calculate overdue athletes (Morosos)
  const overdueList = players
    .map((player) => {
      const overdueDetails = getPlayerOverdueDetails(player, selectedYear, payments);
      return {
        player,
        overdueDetails,
        reminder: overdueDetails.isOverdue
          ? generateOverdueReminderMessage(player, settings, overdueDetails, selectedYear)
          : null,
      };
    })
    .filter((item) => {
      if (!item.overdueDetails.isOverdue) return false;
      if (categoryFilter !== 'ALL' && item.player.category !== categoryFilter) return false;
      return true;
    });

  const totalOverdueSum = overdueList.reduce(
    (sum, item) => sum + item.overdueDetails.totalOverdueAmount,
    0
  );

  // 2. Prepare Group Broadcast Message
  const groupBroadcastOptions: GroupBroadcastOptions = {
    type: broadcastType,
    category: broadcastCategory,
    title: broadcastTitle,
    details: {
      date: broadcastDate,
      time: broadcastTime,
      venue: broadcastVenue,
      rival: broadcastRival,
      uniform: broadcastUniform,
      notes: broadcastNotes,
      customBody: broadcastCustomBody,
    },
  };
  const groupBroadcastResult = generateGroupBroadcastMessage(settings, groupBroadcastOptions);
  const finalBroadcastText = hasManuallyEdited ? customBroadcastText : groupBroadcastResult.text;
  const finalWhatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalBroadcastText)}`;

  // 3. Prepare Personal Message
  const selectedPersonalPlayer = players.find((p) => p.id === selectedPersonalPlayerId) || players[0];
  const personalResult = selectedPersonalPlayer
    ? generatePersonalNoticeMessage(
        selectedPersonalPlayer,
        settings,
        personalMessage,
        personalSubject
      )
    : null;

  // 4. Regular weekly reminder list
  const weeklyReminderList = players
    .map((player) => {
      const overdueDetails = getPlayerOverdueDetails(player, selectedYear, payments);
      const timeline = payments.filter((p) => p.playerId === player.id && p.year === selectedYear);
      const isOctPaid = timeline.some((p) => p.month === 10 && p.isVerified);
      const isNovPaid = timeline.some((p) => p.month === 11 && p.isVerified);
      const isDicPaid = timeline.some((p) => p.month === 12 && p.isVerified);
      const allSeasonPaid = isOctPaid && isNovPaid && isDicPaid;

      return {
        player,
        allSeasonPaid,
        reminder: generateWeeklyReminderMessage(
          player,
          settings,
          {
            month: 10,
            monthName: 'Octubre',
            status: isOctPaid ? 'pagado' : 'pendiente',
            isCurrentMonth: true,
            isPastMonth: false,
            isFutureMonth: false,
          },
          weekOfMonth
        ),
      };
    })
    .filter((item) => {
      if (categoryFilter !== 'ALL' && item.player.category !== categoryFilter) return false;
      return !item.allSeasonPaid;
    });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
              <MessageCircle className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ciclo: Octubre - Diciembre {selectedYear}
                </span>
                {overdueList.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    {overdueList.length} en mora
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Centro de Comunicados y Cobranza WhatsApp
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('morosos')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'morosos'
                ? 'border-rose-600 text-rose-700 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Cobro a Morosos</span>
            {overdueList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                {overdueList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grupos')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'grupos'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Grupos de WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-blue-600 text-blue-800 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>Mensaje Personal 1 a 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('semanal')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'semanal'
                ? 'border-teal-600 text-teal-800 bg-white shadow-xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Recordatorio Semanal</span>
          </button>
        </div>

        {/* Content based on Active Tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ========================================================= */}
          {/* TAB 1: COBRO A MOROSOS (AVISO DE MORA PERSONALIZADO)     */}
          {/* ========================================================= */}
          {activeTab === 'morosos' && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="bg-gradient-to-br from-rose-50 via-rose-100/60 to-amber-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-rose-950 text-base">
                      Control de Cuotas en Mora ({selectedYear})
                    </h4>
                    <p className="text-xs text-rose-800 mt-0.5">
                      Envía a cada número de WhatsApp el aviso formal con el detalle de los meses vencidos (Octubre - Diciembre), el saldo total y el enlace para subir el comprobante.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-white/80 px-4 py-2 rounded-xl border border-rose-200 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Deuda Total en Mora
                  </span>
                  <span className="text-lg font-black text-rose-700">
                    {formatCurrency(totalOverdueSum, settings.currencyCode, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-600 mr-1">Filtrar:</span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    categoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todas ({overdueList.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = overdueList.filter((item) => item.player.category === cat.category).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setCategoryFilter(cat.category)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        categoryFilter === cat.category
                          ? 'bg-rose-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.category} ({count})
                    </button>
                  );
                })}
              </div>

              {/* List of Overdue Players */}
              {overdueList.length > 0 ? (
                <div className="space-y-3">
                  {overdueList.map(({ player, overdueDetails, reminder }) => {
                    const monthsDebted = overdueDetails.overdueMonths.map((m) => m.monthName).join(', ');
                    return (
                      <div
                        key={player.id}
                        className="bg-white rounded-2xl border-2 border-rose-100 hover:border-rose-300 p-4 shadow-xs transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={player.photoUrl}
                              alt={player.fullName}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900">{player.fullName}</h4>
                                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                                  {player.category} • #{player.jerseyNumber}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Acudiente: <strong className="text-slate-800">{player.parentName}</strong> •{' '}
                                <span className="font-mono text-emerald-800 font-semibold">{player.parentPhone}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                            <span className="text-xs font-bold text-rose-800 block">
                              Debe: {formatCurrency(overdueDetails.totalOverdueAmount, settings.currencyCode, settings.currencySymbol)}
                            </span>
                            <span className="text-[11px] text-rose-600 font-medium">
                              Mes(es): {monthsDebted}
                            </span>
                          </div>
                        </div>

                        {/* Preview of the specific Overdue Notice */}
                        {reminder && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto">
                            {reminder.text}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {reminder && (
                            <button
                              type="button"
                              onClick={() => handleCopy(player.id, reminder.text)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              {copiedId === player.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copiar Aviso</span>
                                </>
                              )}
                            </button>
                          )}

                          {reminder && (
                            <a
                              href={reminder.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>Enviar Cobro a {player.parentPhone}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                    🏆
                  </div>
                  <h4 className="text-base font-bold text-emerald-950">
                    {players.length === 0
                      ? 'No hay deportistas registrados en el sistema'
                      : `¡Excelente! No hay deportistas en mora para el ciclo Octubre - Diciembre ${selectedYear}`}
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    {players.length === 0
                      ? 'Una vez registres deportistas, aquí verás las cuotas pendientes para enviar el recordatorio con 1 solo clic.'
                      : 'Todos los pagos correspondientes al período se encuentran registrados y al día.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: COMUNICADOS A GRUPOS DE WHATSAPP                   */}
          {/* ========================================================= */}
          {activeTab === 'grupos' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Difusión en Grupos de WhatsApp de Atlético Sucre
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Selecciona una plantilla oficial, edita los datos y compártela directamente en el grupo de WhatsApp de la categoría o en el grupo general del club.
                  </p>
                </div>
              </div>

              {/* Template Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastType('partido')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    broadcastType === 'partido'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ⚽ Citación a Partido
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('entrenamiento')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    broadcastType === 'entrenamiento'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🏃 Horarios Entrenamiento
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('mensualidad_general')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    broadcastType === 'mensualidad_general'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  💰 Recordatorio Grupo
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('inscripciones')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    broadcastType === 'inscripciones'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  🌟 Inscripciones Abiertas
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastType('comunicado')}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center border transition ${
                    broadcastType === 'comunicado'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  📢 Comunicado Libre
                </button>
              </div>

              {/* Form Options for the Selected Template */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Grupo / Categoría Destino
                    </label>
                    <select
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Todas">Todo el Club (Todas las Categorías)</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.category} value={c.category}>
                          Grupo {c.category} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {broadcastType === 'partido' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Rival
                      </label>
                      <input
                        type="text"
                        value={broadcastRival}
                        onChange={(e) => setBroadcastRival(e.target.value)}
                        placeholder="Ej: Academia Real Nariño"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  )}

                  {broadcastType === 'comunicado' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Título del Comunicado
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Additional details for Match or Training */}
                {(broadcastType === 'partido' || broadcastType === 'entrenamiento') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Fecha / Días
                      </label>
                      <input
                        type="text"
                        value={broadcastDate}
                        onChange={(e) => setBroadcastDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Hora de Citación
                      </label>
                      <input
                        type="text"
                        value={broadcastTime}
                        onChange={(e) => setBroadcastTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Cancha / Sede
                      </label>
                      <input
                        type="text"
                        value={broadcastVenue}
                        onChange={(e) => setBroadcastVenue(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}

                {broadcastType === 'partido' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Uniforme Requerido
                    </label>
                    <input
                      type="text"
                      value={broadcastUniform}
                      onChange={(e) => setBroadcastUniform(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                )}

                {broadcastType === 'comunicado' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Cuerpo del Mensaje
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastCustomBody}
                      onChange={(e) => setBroadcastCustomBody(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Notas o Recomendaciones Adicionales
                  </label>
                  <input
                    type="text"
                    value={broadcastNotes}
                    onChange={(e) => setBroadcastNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Editable Message Box for WhatsApp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>✏️ Mensaje para WhatsApp (Puedes editar o añadir cualquier detalle):</span>
                    </span>
                    {hasManuallyEdited && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Editado a mano
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setHasManuallyEdited(false);
                          setCustomBroadcastText(groupBroadcastResult.text);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
                      >
                        🔄 Restablecer plantilla
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy('group-broadcast', finalBroadcastText)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                    >
                      {copiedId === 'group-broadcast' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ¡Texto Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensaje
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={finalBroadcastText}
                  onChange={(e) => {
                    setCustomBroadcastText(e.target.value);
                    setHasManuallyEdited(true);
                  }}
                  placeholder="Redacta o edita la citación al partido, horarios de entrenamiento o información..."
                  className="w-full p-4 bg-emerald-950 text-emerald-100 rounded-2xl text-xs whitespace-pre-wrap font-mono leading-relaxed border border-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
                />
                <p className="text-[11px] text-slate-500 italic">
                  💡 Los cambios que escribas arriba se enviarán directamente a WhatsApp al pulsar el botón verde.
                </p>
              </div>

              {/* Share Button to WhatsApp */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy('group-broadcast', finalBroadcastText)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar para Pegar en el Grupo</span>
                </button>

                <a
                  href={finalWhatsAppShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Abrir WhatsApp y Seleccionar Grupo</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MENSAJE PERSONAL 1 A 1                             */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">
                    Enviar Información Personalizada a un Acudiente
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Selecciona al deportista y redacta un comunicado directo a su acudiente (felicitaciones, citación especial o seguimiento técnico).
                  </p>
                </div>
              </div>

              {/* Player Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Seleccionar Deportista y Acudiente
                  </label>
                  <select
                    value={selectedPersonalPlayerId}
                    onChange={(e) => setSelectedPersonalPlayerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.category}) — Papá: {p.parentName} ({p.parentPhone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Asunto o Motivo
                  </label>
                  <input
                    type="text"
                    value={personalSubject}
                    onChange={(e) => setPersonalSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mensaje Personalizado
                </label>
                <textarea
                  rows={4}
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-sans"
                  placeholder="Escribe el mensaje..."
                />
              </div>

              {/* Preview */}
              {personalResult && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Vista previa del mensaje:</span>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                    {personalResult.text}
                  </div>
                </div>
              )}

              {/* Send Button */}
              {personalResult && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopy('personal-msg', personalResult.text)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Mensaje</span>
                  </button>

                  <a
                    href={personalResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Enviar a {selectedPersonalPlayer?.parentPhone}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: RECORDATORIO SEMANAL PREVENTIVO                   */}
          {/* ========================================================= */}
          {activeTab === 'semanal' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Recordatorio Preventivo Semanal (Semana {weekOfMonth})
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Recordatorio amable y cordial para enviar a las familias en el transcurso del mes antes del vencimiento.
                  </p>
                </div>
              </div>

              {weeklyReminderList.length > 0 ? (
                <div className="space-y-3">
                  {weeklyReminderList.map(({ player, reminder }) => (
                    <div
                      key={player.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 transition space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.photoUrl}
                            alt={player.fullName}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{player.fullName}</h4>
                            <p className="text-[11px] text-slate-500">
                              {player.category} • Acudiente: {player.parentName} ({player.parentPhone})
                            </p>
                          </div>
                        </div>

                        <a
                          href={reminder.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>Enviar WhatsApp</span>
                        </a>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {reminder.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-semibold text-slate-600">
                    No hay recordatorios pendientes por enviar para este ciclo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Escuela de Fútbol Atlético Sucre • «{settings.slogan}»
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
