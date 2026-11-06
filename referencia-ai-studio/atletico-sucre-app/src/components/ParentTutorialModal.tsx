import React, { useState } from 'react';
import {
  X,
  BookOpen,
  UserPlus,
  CreditCard,
  Upload,
  Printer,
  Smartphone,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';

interface ParentTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const ParentTutorialModal: React.FC<ParentTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
}) => {
  const { settings, selectedYear } = useAcademy();
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?role=padre` : '';
  const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?action=registro` : '';

  const tutorialWhatsAppText = `📖 *GUÍA COMPLETA PARA PADRES DE FAMILIA - ESCUELA DE FÚTBOL ${settings.name.toUpperCase()}* ⚽
_${settings.slogan}_

Apreciada familia, a través de nuestra aplicación oficial puedes gestionar todo el proceso deportivo de tu hijo/a:

📲 *ENLACE DEL PORTAL DE PADRES:*
👉 ${currentUrl}

📝 *ENLACE DIRECTO DE REGISTRO / INSCRIPCIÓN:*
👉 ${registerUrl}

---
🔹 *PASO 1: ¿CÓMO DILIGENCIAR EL FORMULARIO DE REGISTRO?*
1. Ingresa al enlace de inscripción o toca *"+ Inscribir Nuevo Deportista"*.
2. Completa los datos del deportista:
   • Nombre completo y documento de identidad (T.I. o R.C.).
   • Fecha de nacimiento (el sistema asignará automáticamente la categoría por año exacto: Sub-6 a Sub-18: Sub-6, Sub-7, Sub-8, Sub-9, Sub-10, Sub-11, Sub-12, Sub-13, Sub-14, Sub-15, Sub-16, Sub-17 o Sub-18).
   • Número de camiseta deseado y posición en la cancha.
   • Sube una foto clara del rostro del deportista para su carnet oficial.
3. Completa los datos del acudiente:
   • Tu nombre y número de celular con WhatsApp para recibir comunicados y citaciones.
4. Toca *"Registrar Deportista"*. ¡Tu hijo quedará inscrito en la base de datos oficial!

🔹 *PASO 2: ¿CÓMO CONSULTAR EL ESTADO DE CUENTA?*
Ingresa con el documento del niño o tu celular. Verás el ciclo oficial de mensualidades (*Octubre a Diciembre ${selectedYear}*):
• 🟢 *Al Día:* Mensualidad paga y verificada por el director.
• 🔵 *En Revisión:* Comprobante cargado, en proceso de confirmación.
• 🟡 *Por Pagar:* Cuota vigente dentro del plazo mensual.
• 🔴 *En Mora:* Plazo vencido pendiente de pago.

🔹 *PASO 3: ¿CÓMO CANCELAR LA MENSUALIDAD Y SUBIR EL COMPROBANTE?*
1. *Cuentas Oficiales Avaladas:*
   • 📱 *NEQUI:* Número *3188948054* a nombre de *Nora Nallely Morán*.
   • 💵 *EFECTIVO:* Puedes cancelar directamente en efectivo en el *sitio de entrenamiento*.
   *(⚠️ Nota: Son las ÚNICAS modalidades de pago avaladas por la escuela).*
2. Toca el botón verde *"Subir Comprobante"*.
3. Selecciona el mes (Octubre, Noviembre o Diciembre) e ingresa el valor pagado.
4. Si pagaste por Nequi, adjunta la foto o captura de pantalla de la transferencia. Si cancelaste en efectivo en el entrenamiento, regístralo como Efectivo.
5. Presiona *"Confirmar y Subir Comprobante"*. El Director lo verificará de inmediato.

🔹 *PASO 4: ¿CÓMO DESCARGAR E IMPRIMIR EL CARNET DEPORTIVO?*
1. En la ficha de tu deportista, toca el botón *"🪪 Carnet Oficial"*.
2. Se abrirá la credencial oficial con foto, dorsal, categoría y datos de emergencia.
3. Presiona *"🖨️ Imprimir Carnet"* para imprimirlo en cartulina o papel fotográfico a color, recortarlo y plastificarlo para los partidos y torneos.

🔹 *PASO 5: ¿CÓMO INSTALAR LA APP EN TU CELULAR?*
• *Android:* Toca *"Descargar App"* o en los tres puntos (⋮) de Chrome selecciona *"Instalar aplicación"*.
• *iPhone:* Toca el botón Compartir (⎋) en Safari y selecciona *"Agregar a la pantalla de inicio"*.

Para cualquier apoyo o asesoría:
📞 ${settings.phone} • ${settings.directorName}
❤️ *En Atlético Sucre enseñamos de corazón a corazón.*`;

  const handleCopyTutorial = () => {
    navigator.clipboard.writeText(tutorialWhatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Guía Completa para Padres de Familia
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Tutorial de Gestión Deportiva
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

        {/* Steps Tab bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeStep === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>1. Diligenciar Registro</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeStep === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>2. Consultar Pagos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeStep === 3
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>3. Subir Comprobante</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(4)}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeStep === 4
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>4. Carnet Deportivo</span>
          </button>
        </div>

        {/* Body based on activeStep */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          
          {/* ========================================================= */}
          {/* STEP 1: FORMULARIO DE REGISTRO                            */}
          {/* ========================================================= */}
          {activeStep === 1 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Paso 1: ¿Cómo diligenciar el formulario de inscripción?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Solo toma 2 minutos registrar a tu hijo/a en la escuela oficial.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900">Datos Personales del Deportista:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Escribe el nombre completo y el documento de identidad (Tarjeta de Identidad o Registro Civil).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900">Fecha de Nacimiento y Categoría Automática:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Ingresa la fecha de nacimiento. La aplicación calculará automáticamente su edad y categoría deportiva por año (Sub-6, Sub-7, Sub-8, Sub-9, Sub-10, Sub-11, Sub-12, Sub-13, Sub-14, Sub-15, Sub-16, Sub-17 o Sub-18).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900">Foto del Deportista para el Carnet:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Sube una foto clara tipo carnet donde se aprecie bien el rostro de tu hijo, o elige un avatar temporal. Esta foto saldrá impresa en su carnet oficial.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900">Datos de Contacto del Acudiente:</strong>
                    <p className="text-slate-600 mt-0.5">
                      Ingresa tu nombre y tu número celular con WhatsApp. Con este número podrás ingresar a la app y recibirás las citaciones a partidos y entrenamientos.
                    </p>
                  </div>
                </div>
              </div>

              {onOpenRegister && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Abrir Formulario de Registro Ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: CONSULTAR MENSUALIDADES                           */}
          {/* ========================================================= */}
          {activeStep === 2 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Paso 2: ¿Cómo consultar el estado de las mensualidades?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ciclo oficial: Octubre, Noviembre y Diciembre {selectedYear}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-black text-emerald-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    🟢 Al Día / Pagado
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    La mensualidad está paga y aprobada por el Director. Tu hijo tiene cobertura deportiva completa.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                  <span className="font-black text-cyan-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    🔵 En Revisión
                  </span>
                  <p className="text-[11px] text-cyan-700 mt-1">
                    Ya subiste la foto del comprobante; la escuela está confirmando el abono en la cuenta bancaria.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="font-black text-amber-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    🟡 Por Pagar
                  </span>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Cuota del mes vigente. Por favor programa el pago antes de la fecha límite (día de corte).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="font-black text-rose-800 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    🔴 En Mora / Vencido
                  </span>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Cuota vencida pendiente de pago. Realiza la transferencia lo antes posible para mantener la participación en partidos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SUBIR COMPROBANTE DE PAGO                         */}
          {/* ========================================================= */}
          {activeStep === 3 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black shrink-0">
                  <Upload className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Paso 3: ¿Cómo subir el comprobante de pago?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Carga la captura de Nequi o foto de la consignación en segundos.
                  </p>
                </div>
              </div>

              {/* Highlight of ONLY Authorized Accounts */}
              <div className="bg-gradient-to-br from-amber-50 to-emerald-50 border-2 border-emerald-500/50 rounded-2xl p-3.5 space-y-2">
                <span className="text-[11px] font-black uppercase text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ÚNICAS CUENTAS AVALADAS PARA EL PAGO:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                    <span className="font-bold text-emerald-800 text-[11px] block">📱 CUENTA NEQUI</span>
                    <p className="font-mono font-black text-sm text-slate-900 mt-0.5">3188948054</p>
                    <p className="text-[11px] text-slate-600 font-semibold">Titular: Nora Nallely Morán</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-300 shadow-2xs">
                    <span className="font-bold text-amber-800 text-[11px] block">💵 PAGO EN EFECTIVO</span>
                    <p className="font-black text-xs text-slate-900 mt-0.5">En el sitio de entrenamiento</p>
                    <p className="text-[11px] text-slate-600">Directamente con la administración</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 italic">
                  ⚠️ <em>Por tu seguridad, estas son las únicas dos modalidades oficiales avaladas por Atlético Sucre.</em>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900">Realiza tu pago:</strong>
                    <p className="text-slate-600">Transfiere al Nequi <strong>3188948054</strong> (Nora Nallely Morán) o cancela en efectivo en el entrenamiento.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900">Presiona «Subir Comprobante»:</strong>
                    <p className="text-slate-600">Toca el botón verde en la ficha de tu hijo y selecciona el mes correspondiente (Octubre, Noviembre o Diciembre).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900">Adjunta el archivo:</strong>
                    <p className="text-slate-600">Sube la captura de Nequi o recibo en efectivo, coloca el valor y número de comprobante y confirma. ¡Quedará registrado de inmediato!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: CARNET DEPORTIVO IMPRIMIBLE                       */}
          {/* ========================================================= */}
          {activeStep === 4 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0">
                  <Printer className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Paso 4: Descargar e Imprimir el Carnet Oficial
                  </h4>
                  <p className="text-xs text-slate-500">
                    Credencial deportiva oficial para presentar en partidos y torneos.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5 text-slate-800">
                <p>
                  Tu deportista cuenta con un <strong>Carnet Oficial Deportivo</strong> emitido por el Club Deportivo Atlético Sucre con su foto, número de camiseta, categoría, documento y datos de emergencia.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>1. Toca «🪪 Carnet Oficial»</strong> en la ficha de tu hijo.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>2. Presiona «🖨️ Imprimir Carnet»</strong> para imprimir a color en cartulina o papel fotográfico.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>3. Recorta por la línea de corte y plastifícalo</strong> para llevarlo en la maleta deportiva a todos los partidos.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Copy for WhatsApp Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                ¿Quieres compartir esta guía a los padres por WhatsApp?
              </span>
              <button
                type="button"
                onClick={handleCopyTutorial}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    Copiar para WhatsApp
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-emerald-800">
              Copia este mensaje listo y envíalo al grupo de WhatsApp de padres de Atlético Sucre para que conozcan cómo hacer el registro, subir pagos e imprimir su carnet.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(step)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition flex items-center justify-center ${
                  activeStep === step
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {step}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
