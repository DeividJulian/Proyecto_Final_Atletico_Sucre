import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player, PaymentRecord, AgeCategory } from '../types';
import { PlayerCard } from './PlayerCard';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import {
  formatCurrency,
  getCurrentDateInfo,
  MONTH_NAMES,
  getPlayerOverallStatus,
} from '../utils/dateAndPayment';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  UserPlus,
  Search,
  Filter,
  Download,
  Send,
  Sparkles,
  Share2,
} from 'lucide-react';

interface DirectorDashboardProps {
  onOpenPlayerModal: (player?: Player) => void;
  onOpenPaymentModal: (player: Player, month?: number) => void;
  onViewReceipt: (payment: PaymentRecord, player: Player) => void;
  onOpenCarnet: (player: Player) => void;
  onOpenBatchWhatsApp: () => void;
  onOpenShareModal: () => void;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  onOpenPlayerModal,
  onOpenPaymentModal,
  onViewReceipt,
  onOpenCarnet,
  onOpenBatchWhatsApp,
  onOpenShareModal,
}) => {
  const {
    players,
    payments,
    selectedYear,
    settings,
    activeCategoryFilter,
    setActiveCategoryFilter,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useAcademy();

  const { month: currentMonth } = getCurrentDateInfo();
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

  // Global KPIs calculation
  let totalProjectedRevenue = 0;
  let totalCollectedRevenue = 0;
  let playersUpToDate = 0;
  let playersOverdue = 0;
  let pendingReceipts = 0;

  players.forEach((p) => {
    totalProjectedRevenue += p.monthlyFee;
    const overall = getPlayerOverallStatus(p, selectedYear, payments);
    if (overall.currentMonthStatus.status === 'pagado') {
      playersUpToDate++;
      totalCollectedRevenue += overall.currentMonthStatus.payment?.amount || p.monthlyFee;
    } else if (overall.currentMonthStatus.status === 'pendiente_verificacion') {
      pendingReceipts++;
    } else if (overall.currentMonthStatus.status === 'vencido') {
      playersOverdue++;
    } else {
      playersOverdue++;
    }
  });

  const collectionPercent =
    players.length > 0 ? Math.round((playersUpToDate / players.length) * 100) : 0;

  // Filtered Players
  const filteredPlayers = players.filter((player) => {
    // 1. Category Filter
    if (activeCategoryFilter !== 'ALL' && player.category !== activeCategoryFilter) {
      return false;
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = player.fullName.toLowerCase().includes(q);
      const matchDoc = player.documentId.toLowerCase().includes(q);
      const matchParent = player.parentName.toLowerCase().includes(q);
      const matchPhone = player.parentPhone.includes(q);
      if (!matchName && !matchDoc && !matchParent && !matchPhone) return false;
    }

    // 3. Status Filter
    if (statusFilter !== 'ALL') {
      const overall = getPlayerOverallStatus(player, selectedYear, payments);
      if (statusFilter === 'AL_DIA' && overall.currentMonthStatus.status !== 'pagado') {
        return false;
      }
      if (
        statusFilter === 'EN_MORA' &&
        overall.currentMonthStatus.status !== 'vencido' &&
        overall.currentMonthStatus.status !== 'pendiente'
      ) {
        return false;
      }
      if (
        statusFilter === 'POR_VERIFICAR' &&
        overall.currentMonthStatus.status !== 'pendiente_verificacion'
      ) {
        return false;
      }
    }

    return true;
  });

  // Export CSV Report of Collection
  const handleExportCSV = () => {
    const headers = [
      'Deportista',
      'Documento',
      'Categoria',
      'Numero Camiseta',
      'Acudiente',
      'Telefono',
      'Estado Mes Actual',
      'Valor Mensualidad',
      'Meses Pagados (Anual)',
      'Meses en Mora',
    ];

    const rows = players.map((p) => {
      const overall = getPlayerOverallStatus(p, selectedYear, payments);
      return [
        `"${p.fullName}"`,
        `"${p.documentId}"`,
        `"${p.category}"`,
        p.jerseyNumber,
        `"${p.parentName}"`,
        `"${p.parentPhone}"`,
        `"${overall.currentMonthStatus.status}"`,
        p.monthlyFee,
        overall.monthsPaidCount,
        overall.monthsOverdueCount,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `reporte_pagos_${settings.name.replace(/\s+/g, '_')}_${currentMonthName}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Active Players */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Deportistas
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {players.length}
            </h4>
            <span className="text-[11px] text-blue-600 font-medium">En {CATEGORIES.length} categorías</span>
          </div>
        </div>

        {/* % Up to Date */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Al Día ({currentMonthName})
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
              {collectionPercent}%
            </h4>
            <span className="text-[11px] text-slate-500">
              {playersUpToDate} de {players.length} deportistas
            </span>
          </div>
        </div>

        {/* Current Month Collected vs Target */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
              Recaudo {currentMonthName}
            </p>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
              {formatCurrency(totalCollectedRevenue, settings.currencyCode, settings.currencySymbol)}
            </h4>
            <span className="text-[11px] text-slate-400 truncate block">
              Meta: {formatCurrency(totalProjectedRevenue, settings.currencyCode, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Pending Verification / Overdue */}
        <div
          onClick={() => setStatusFilter(pendingReceipts > 0 ? 'POR_VERIFICAR' : 'EN_MORA')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-amber-400 transition"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              pendingReceipts > 0
                ? 'bg-cyan-50 text-cyan-600 animate-pulse'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {pendingReceipts > 0 ? <Clock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {pendingReceipts > 0 ? 'Comprobantes' : 'En Mora'}
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {pendingReceipts > 0 ? pendingReceipts : playersOverdue}
            </h4>
            <span className="text-[11px] text-amber-600 font-semibold underline">
              {pendingReceipts > 0 ? 'Por validar' : 'Necesitan recordatorio'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: Categories Filter, Search & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Category Pills (Filter by Age) - KEY REQUIREMENT */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Filtrar por Categoría de Edad:
            </span>
            <span className="text-xs text-slate-500">
              {activeCategoryFilter === 'ALL'
                ? `Mostrando todas (${players.length})`
                : `Categoría ${activeCategoryFilter}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {/* All button */}
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚽ Todas ({players.length})
            </button>

            {/* Individual categories */}
            {CATEGORIES.map((meta) => {
              const count = players.filter((p) => p.category === meta.category).length;
              const isSelected = activeCategoryFilter === meta.category;
              return (
                <button
                  key={meta.category}
                  type="button"
                  onClick={() => setActiveCategoryFilter(meta.category)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeBorder} ring-2 ring-emerald-500 ring-offset-1 font-black shadow-sm`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={`${meta.name} (${meta.minAge}-${meta.maxAge} años)`}
                >
                  <span>{meta.category}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Status Tabs and Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por deportista, documento o acudiente..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Quick Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Todos ({players.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('AL_DIA')}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'AL_DIA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Al Día ({playersUpToDate})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('EN_MORA')}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === 'EN_MORA' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              En Mora ({playersOverdue})
            </button>
            {pendingReceipts > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('POR_VERIFICAR')}
                className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  statusFilter === 'POR_VERIFICAR'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-cyan-700 font-bold'
                }`}
              >
                <Clock className="w-3 h-3 text-cyan-600" />
                <span>Por validar ({pendingReceipts})</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Descargar reporte completo en formato CSV / Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Reporte</span>
            </button>

            <button
              type="button"
              onClick={onOpenShareModal}
              className="p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Compartir enlace de inscripción a los padres de familia"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir a Padres</span>
            </button>

            <button
              type="button"
              onClick={onOpenBatchWhatsApp}
              className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Enviar recordatorios semanales por WhatsApp a los acudientes"
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Masivo</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPlayerModal()}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Alumno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      {players.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-emerald-200 p-8 sm:p-14 text-center shadow-sm space-y-6">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-600/25">
              ⚽
            </div>
            <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-slate-900 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">
              Base en Blanco
            </span>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900">
              ¡Lista de Deportistas en Blanco!
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Se han retirado los nombres de ejemplo. El sistema está 100% listo para registrar a los deportistas oficiales de <strong>{settings.name}</strong>.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onOpenPlayerModal()}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-700/25 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>+ Inscribir Primer Deportista</span>
            </button>
            <button
              type="button"
              onClick={onOpenShareModal}
              className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Compartir Enlace a Padres</span>
            </button>
          </div>

          {/* Quick Guidance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-6 max-w-3xl mx-auto border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-emerald-700 block mb-1">1. Inscripción Fácil</span>
              <p className="text-[11px] text-slate-500">
                Registra tú mismo al alumno o comparte el enlace para que el padre de familia lo haga desde su celular.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-emerald-700 block mb-1">2. Categoría Automática</span>
              <p className="text-[11px] text-slate-500">
                El sistema detecta automáticamente la categoría (Sub-6 a Sub-18) según la fecha de nacimiento.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-emerald-700 block mb-1">3. Control de Pagos</span>
              <p className="text-[11px] text-slate-500">
                Lleva la matriz de 12 meses, valida los comprobantes subidos y emite certificados de Paz y Salvo.
              </p>
            </div>
          </div>
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onOpenPaymentModal={onOpenPaymentModal}
              onViewReceipt={onViewReceipt}
              onOpenPlayerModal={onOpenPlayerModal}
              onOpenCarnet={onOpenCarnet}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-3xl">
            🔍
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">
              No se encontraron deportistas con los filtros seleccionados
            </h4>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Intenta cambiar la categoría, el texto de búsqueda o restablecer los filtros para ver todos los alumnos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setActiveCategoryFilter('ALL');
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Restablecer Filtros
            </button>
            <button
              type="button"
              onClick={() => onOpenPlayerModal()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              + Inscribir Deportista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
