import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  Shield,
  UserCheck,
  User,
  Settings as SettingsIcon,
  Bell,
  Calendar,
  CheckCircle2,
  FileCheck,
  Share2,
  Lock,
  Download,
} from 'lucide-react';
import { getCurrentDateInfo } from '../utils/dateAndPayment';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenBatchWhatsApp: () => void;
  onOpenShareModal: () => void;
  onOpenDirectorPinModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenBatchWhatsApp,
  onOpenShareModal,
  onOpenDirectorPinModal,
}) => {
  const {
    role,
    setRole,
    settings,
    selectedYear,
    setSelectedYear,
    payments,
    players,
    isDirectorUnlocked,
    lockDirector,
  } = useAcademy();

  const { year: currentYear } = getCurrentDateInfo();

  // Pending receipts count
  const pendingReceiptsCount = payments.filter((p) => !p.isVerified).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenSettings}
              className="relative group shrink-0 focus:outline-none"
              title="Clic para cambiar el logo o ajustes del club"
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-11 h-12 sm:w-13 sm:h-14 object-contain drop-shadow-md rounded-lg group-hover:scale-105 transition duration-200"
                />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 shrink-0 ring-2 ring-emerald-400/30">
                  <span className="text-2xl sm:text-3xl leading-none">⚽</span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[9px] font-black px-1 rounded text-white opacity-0 group-hover:opacity-100 transition shadow">
                LOGO
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white truncate">
                  {settings.name}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Club Oficial
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 font-medium hidden sm:flex items-center gap-1.5 truncate">
                <span className="text-rose-400">❤️</span>
                <span className="italic tracking-wide">«{settings.slogan}»</span>
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Year & Season Selector */}
            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 ml-1.5 hidden sm:block" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-bold text-emerald-300 px-2 py-1 outline-none cursor-pointer"
              >
                <option value={2027} className="bg-slate-900 text-emerald-400 font-bold">
                  2027 (Octubre - Diciembre)
                </option>
                <option value={2026} className="bg-slate-900 text-white">
                  2026
                </option>
                <option value={2028} className="bg-slate-900 text-white">
                  2028
                </option>
              </select>
            </div>

            {/* Role Switcher (Director vs Padre de Familia) */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700/80 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => {
                  if (isDirectorUnlocked) {
                    setRole('director');
                  } else {
                    onOpenDirectorPinModal();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  role === 'director'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Director (Protegido por PIN): Gestionar deportistas, verificar pagos y ver estadísticas"
              >
                {isDirectorUnlocked ? (
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                ) : (
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                )}
                <span className="hidden xs:inline">Director</span>
                <span className="xs:hidden">Dir</span>
                {pendingReceiptsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-900">
                    {pendingReceiptsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('padre');
                  lockDirector();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  role === 'padre'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Padre de Familia: Ver únicamente la ficha de mi hijo, subir comprobante y recordatorios"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200" />
                <span className="hidden xs:inline">Padre de Familia</span>
                <span className="xs:hidden">Padre</span>
              </button>
            </div>

            {/* Quick reminder center button (Director) */}
            {role === 'director' && (
              <button
                type="button"
                onClick={onOpenBatchWhatsApp}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                title="Recordatorios Semanales por WhatsApp"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Recordatorio Semanal</span>
              </button>
            )}

            {/* Share Registration Link to Parents */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md transition transform active:scale-95"
              title="Compartir link de auto-inscripción a los padres de familia"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir a Padres</span>
              <span className="sm:hidden">Compartir</span>
            </button>

            {/* Install App Button */}
            <PWAInstallButton variant="navbar" />

            {/* Download Source Code ZIP */}
            <a
              href="/atletico-sucre-app.zip"
              download="atletico-sucre-app.zip"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-lg text-xs font-bold transition shadow-xs"
              title="Descargar código fuente completo del proyecto en archivo .ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .ZIP</span>
            </a>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Ajustes de la Escuela y Respaldos"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
