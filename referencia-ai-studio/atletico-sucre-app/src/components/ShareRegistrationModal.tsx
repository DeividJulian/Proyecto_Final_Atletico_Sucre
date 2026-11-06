import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  Download,
  Printer,
  Sparkles,
  ExternalLink,
  Users,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface ShareRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareRegistrationModal: React.FC<ShareRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings } = useAcademy();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  // Build the direct registration link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const registrationUrl = `${origin}${pathname}?role=padre&action=registro`;

  const invitationMessage = `⚽ *${settings.name.toUpperCase()}* ⚽
📍 *Ipiales - Nariño*
❤️ *«${settings.slogan}»*

Estimado Padre de Familia / Acudiente:
Le damos la más cordial bienvenida a nuestra escuela de formación deportiva.

Para registrar a su campeón/a, completar sus datos, subir su foto y gestionar el estado de sus mensualidades, por favor ingrese a nuestro portal oficial en el siguiente enlace:

👉 ${registrationUrl}

📋 *Pasos sencillos para la inscripción:*
1️⃣ Abra el enlace desde su celular o computador.
2️⃣ Complete los datos del deportista (nombre, fecha de nacimiento, documento).
3️⃣ Suba una foto de su hijo/a y sus datos de contacto.
4️⃣ ¡Listo! Podrá consultar las fechas de pago y cargar comprobantes en cualquier momento.

¡Gracias por confiar en nuestra academia y apoyar el sueño deportivo de su campeón! ⚽🔥`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(invitationMessage)}`;

  // Public QR Code Generator URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    registrationUrl
  )}&color=047857&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(invitationMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="w-12 h-12 object-contain drop-shadow shrink-0 rounded-lg bg-white/10 p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Portal de Inscripciones
                </span>
                <span className="text-xs text-rose-300 font-medium hidden sm:inline">
                  ❤️ Ipiales - Nariño
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Compartir Registro e Inscripción a Padres
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* How it works info card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-xs leading-relaxed text-slate-700">
              <p className="font-bold text-emerald-950 text-sm">
                ¿Cómo funciona para el padre de familia?
              </p>
              <p className="mt-1">
                Al enviar este enlace, el padre de familia abre la aplicación directamente en su celular,
                completa los datos de su hijo (nombre, fecha de nacimiento, foto) y queda registrado en el
                sistema de <strong>{settings.name}</strong>. Podrá consultar sus mensualidades y subir comprobantes de pago sin necesidad de instalar nada.
              </p>
            </div>
          </div>

          {/* Option 1: Direct Link */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Enlace Directo de Auto-Inscripción
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={registrationUrl}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono text-slate-800 select-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: WhatsApp Share Button (Most convenient in Colombia / Latin America) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Enviar Invitación por WhatsApp (1-Clic)
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>Enviar por WhatsApp a Padres / Grupos</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Texto Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copiar Texto Completo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 whitespace-pre-wrap font-sans max-h-36 overflow-y-auto">
                {invitationMessage}
              </div>
            </div>
          </div>

          {/* Option 3: QR Code for the Pitch or Office */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>3. Código QR para Imprimir o Mostrar en la Cancha</span>
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
              <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Código QR de Registro"
                  className="w-36 h-36 object-contain"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left text-xs text-slate-600">
                <p className="font-bold text-slate-900 text-sm">
                  Código QR de Auto-Registro Inmediato
                </p>
                <p>
                  Imprímelo y pégalo en la entrada de la cancha o en la mesa técnica. Los padres sólo deben
                  apuntar la cámara de su celular al código QR para abrir el formulario de inscripción al instante.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <a
                    href={qrCodeUrl}
                    download={`QR_Inscripcion_${settings.name.replace(/\s+/g, '_')}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Imagen QR</span>
                  </a>

                  <button
                    type="button"
                    onClick={handlePrintFlyer}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Imprimir Afiche</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 italic">
            ❤️ «{settings.slogan}» • Ipiales - Nariño
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
