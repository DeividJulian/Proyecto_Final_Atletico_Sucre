import React, { useRef } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player } from '../types';
import { calculateAge, getCategoryMeta } from '../utils/categories';
import { getCurrentDateInfo } from '../utils/dateAndPayment';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  QrCode,
  Sparkles,
  Phone,
  User,
  Heart,
} from 'lucide-react';

interface PlayerCarnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: Player;
}

export const PlayerCarnetModal: React.FC<PlayerCarnetModalProps> = ({
  isOpen,
  onClose,
  player,
}) => {
  const { settings, selectedYear } = useAcademy();
  const { year: currentYear } = getCurrentDateInfo();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !player) return null;

  const age = calculateAge(player.birthDate);
  const categoryMeta = getCategoryMeta(player.category);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const playerUrl = `${origin}${pathname}?role=padre&player=${player.id}`;
    const text = `⚽ *CARNET OFICIAL DEPORTIVO - ${settings.name.toUpperCase()}* ⚽\n_${settings.slogan}_\n\nDeportista: *${player.fullName}*\nCategoría: *${player.category}* | Camiseta *#${player.jerseyNumber}*\nDocumento: *${player.documentId}*\nTemporada: *${selectedYear}*\n\nAccede a tu carnet digital e imprímelo aquí:\n👉 ${playerUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header (Hidden when printing) */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              🪪
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Credencial Oficial • Temporada {selectedYear}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Carnet Deportivo de {player.fullName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Carnet</span>
              <span className="sm:hidden">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner (Hidden when printing) */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs text-emerald-900 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Listo para imprimir y plastificar:</strong> Puedes imprimir en cartulina o papel fotográfico a color para presentar en torneos y entrenamientos.
            </span>
          </div>
        </div>

        {/* Printable Carnet Area */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto bg-slate-100 flex flex-col items-center gap-6 print:p-0 print:bg-white print:gap-4">
          {/* Printable Cards Container (Anverso + Reverso side by side or stacked for fold) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl print:grid-cols-2 print:gap-4 print:w-full">
            
            {/* ======================================================== */}
            {/* CARNET FRENTE (ANVERSO)                                 */}
            {/* ======================================================== */}
            <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 rounded-2xl p-4 text-white shadow-xl border-2 border-amber-400/60 relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-2 print:border-amber-500">
              {/* Background watermark / decorative curves */}
              <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 pointer-events-none blur-2xl" />
              <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-48 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

              {/* Carnet Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">⚽</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black tracking-wider uppercase text-amber-300 leading-tight">
                      {settings.name}
                    </h4>
                    <span className="text-[8px] font-semibold text-emerald-200 tracking-widest uppercase block">
                      Carnet Oficial • Temporada {selectedYear}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                    DEPORTISTA
                  </span>
                </div>
              </div>

              {/* Carnet Middle: Photo & Details */}
              <div className="flex items-center gap-3.5 my-auto relative z-10 py-1">
                {/* Photo with Gold Frame */}
                <div className="relative shrink-0">
                  <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-xl bg-slate-800 p-1 border-2 border-amber-400 shadow-md overflow-hidden">
                    <img
                      src={player.photoUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150'}
                      alt={player.fullName}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=150';
                      }}
                    />
                  </div>
                  <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-slate-950 text-amber-300 font-black text-[10px] px-2 py-0.2 rounded-full border border-amber-400/80 shadow">
                    #{player.jerseyNumber}
                  </span>
                </div>

                {/* Player Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider block">
                      Nombre Completo
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                      {player.fullName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div>
                      <span className="text-[8px] text-slate-300 uppercase block font-semibold">Documento</span>
                      <span className="font-mono font-bold text-amber-200 text-[11px] truncate block">
                        {player.documentId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-300 uppercase block font-semibold">Categoría</span>
                      <span className="font-bold text-white text-[10px] truncate block">
                        {player.category} ({age} años)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-0.5">
                    <div>
                      <span className="text-[8px] text-slate-300 uppercase block font-semibold">Posición</span>
                      <span className="font-bold text-emerald-300 text-[10px] truncate block">
                        {player.position}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-300 uppercase block font-semibold">Estado</span>
                      <span className="font-black text-emerald-400 text-[9px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVO
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carnet Footer */}
              <div className="border-t border-white/15 pt-1.5 flex items-center justify-between text-[8px] text-slate-300 relative z-10">
                <span className="italic text-emerald-200 truncate">
                  «{settings.slogan}»
                </span>
                <span className="font-mono font-bold text-amber-300 shrink-0">
                  ID: {player.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* CARNET REVERSO (DORSO)                                  */}
            {/* ======================================================== */}
            <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 rounded-2xl p-4 text-white shadow-xl border-2 border-emerald-500/50 relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-2 print:border-emerald-600">
              {/* Top Bar Reverso */}
              <div className="border-b border-white/15 pb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider">
                  DATOS DE CONTACTO & ASISTENCIA
                </span>
                <span className="text-[8px] text-slate-400">
                  Sede: {settings.address || 'Ipiales - Nariño'}
                </span>
              </div>

              {/* Emergency Contact & School Rules */}
              <div className="my-auto py-1 space-y-2 text-[10px]">
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-300">Acudiente Responsable:</span>
                    <strong className="text-white truncate">{player.parentName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-300">Teléfono de Emergencia:</span>
                    <strong className="text-emerald-300 font-mono">{player.parentPhone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-300">Contacto Dirección:</span>
                    <strong className="text-amber-200 font-mono">{settings.phone}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-0.5">
                  {/* QR code simulation with clean SVG */}
                  <div className="w-14 h-14 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center shadow">
                    <div className="w-full h-full bg-slate-950 rounded p-1 flex flex-col items-center justify-center text-white">
                      <QrCode className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Sign / Slogan */}
                  <div className="text-right flex-1 space-y-0.5">
                    <div className="border-b border-slate-400/40 pb-0.5">
                      <span className="text-[9px] font-serif italic text-amber-300 font-bold block">
                        {settings.directorName}
                      </span>
                    </div>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block">
                      Dirección Deportiva Oficial
                    </span>
                    <span className="text-[7.5px] text-emerald-300 italic font-medium block">
                      «En Atlético Sucre enseñamos de corazón a corazón»
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom legal notice */}
              <div className="border-t border-white/15 pt-1 text-[7.5px] text-slate-400 text-center">
                Este carnet es personal e intransferible. Válido para torneos locales e intercolegiados de fútbol.
              </div>
            </div>

          </div>

          {/* Cutting and Fold Guide (visible when printing) */}
          <div className="text-center text-xs text-slate-500 print:text-[10px] print:text-slate-400">
            ✂️ <em>Línea de corte: Recortar por el borde exterior, doblar por el centro y plastificar.</em>
          </div>
        </div>

        {/* Footer (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Escuela de Fútbol {settings.name} • Formando campeones con valores deportivos
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Carnet</span>
            </button>
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
    </div>
  );
};
