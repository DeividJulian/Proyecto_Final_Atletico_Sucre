import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Monitor, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Zap,
  WifiOff
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await promptInstall();
      if (result === 'accepted') {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 mx-auto mb-3 bg-white p-1 rounded-2xl shadow-lg ring-4 ring-emerald-400/30 flex items-center justify-center overflow-hidden">
            <img
              src="/public/assets/aistudio/03caefd5-a1fd-4140-9f99-e95f36de3697_9ee162e8.JPG"
              alt="Atlético Sucre"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <h2 className="text-xl font-bold">Instalar Atlético Sucre</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Lleva la aplicación en tu pantalla de inicio como una App nativa
          </p>
        </div>

        {/* Status / Quick Action */}
        <div className="p-6 space-y-6">
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-emerald-900 text-base">¡App ya instalada!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Ya estás usando la aplicación en modo nativo o instalada en tu dispositivo.
              </p>
            </div>
          ) : canInstall ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl p-5 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white mb-3 shadow-md">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Tu navegador soporta instalación directa</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Presiona el botón para instalar el acceso directo oficial en tu celular o computador con un solo toque.
              </p>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
              >
                <Download className="w-5 h-5" />
                {installing ? 'Instalando...' : 'Instalar Ahora en Este Dispositivo'}
              </button>
            </div>
          ) : null}

          {/* Device Tabs for Step-by-Step Guidance */}
          <div>
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'android' || (activeTab === 'auto' && !isIOS)
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Android / Chrome
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios' || (activeTab === 'auto' && isIOS)
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                iPhone / iPad
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2.5 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'desktop'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4 text-purple-600" />
                PC / Laptop
              </button>
            </div>

            {/* Tab content: Android */}
            {(activeTab === 'android' || (activeTab === 'auto' && !isIOS)) && (
              <div className="py-4 space-y-3">
                <div className="text-xs text-slate-600 font-medium">Instalación en teléfonos Android (Google Chrome):</div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Abre el menú de opciones</p>
                      <p className="text-slate-500">Toca los <strong>tres puntos verticales (⋮)</strong> en la esquina superior derecha del navegador Chrome.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Selecciona "Instalar aplicación"</p>
                      <p className="text-slate-500">O elige <strong>"Agregar a la pantalla principal"</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Confirma la instalación</p>
                      <p className="text-slate-500">Presiona <strong>"Instalar"</strong>. El icono con el escudo de Atlético Sucre aparecerá en tus aplicaciones.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content: iOS Safari */}
            {(activeTab === 'ios' || (activeTab === 'auto' && isIOS)) && (
              <div className="py-4 space-y-3">
                <div className="text-xs text-slate-600 font-medium">Instalación en iPhone / iPad (Navegador Safari):</div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <div>
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <span>Toca el botón Compartir</span>
                        <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                      </div>
                      <p className="text-slate-500">En la barra inferior de Safari, presiona el icono de compartir (el cuadrado con flecha hacia arriba).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <div>
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <span>Selecciona "Agregar a inicio"</span>
                        <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                      </div>
                      <p className="text-slate-500">Desplaza las opciones hacia abajo y toca <strong>"Agregar al inicio"</strong> (o "Add to Home Screen").</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Toca "Agregar" en la esquina superior</p>
                      <p className="text-slate-500">¡Listo! La app se abrirá en pantalla completa sin barra de navegador con su icono oficial.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content: Desktop */}
            {activeTab === 'desktop' && (
              <div className="py-4 space-y-3">
                <div className="text-xs text-slate-600 font-medium">Instalación en PC / Computador (Google Chrome o MS Edge):</div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Busca el icono en la barra de direcciones</p>
                      <p className="text-slate-500">Al final de la barra donde escribes la URL (junto a la estrella de favoritos), verás un icono de <strong>computador con flecha</strong> o el botón <strong>"Instalar app"</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">O desde el menú del navegador</p>
                      <p className="text-slate-500">Haz clic en <strong>(⋮) Menú → Guardar y compartir → Instalar Atlético Sucre</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share or Open on Mobile Phone */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Enlace de la aplicación para tu celular:</span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 hover:underline"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar enlace
                  </>
                )}
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200 truncate select-all">
              {currentUrl}
            </div>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-emerald-50/50 rounded-lg">
              <Zap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-800">Apertura Rápida</p>
              <p className="text-[10px] text-slate-500">Carga al instante</p>
            </div>
            <div className="p-2 bg-emerald-50/50 rounded-lg">
              <WifiOff className="w-4 h-4 text-teal-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-800">Acceso Offline</p>
              <p className="text-[10px] text-slate-500">Funciona sin internet</p>
            </div>
            <div className="p-2 bg-emerald-50/50 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-800">100% Seguro</p>
              <p className="text-[10px] text-slate-500">Tus datos en tu móvil</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
