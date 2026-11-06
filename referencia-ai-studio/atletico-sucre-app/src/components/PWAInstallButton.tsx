import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running standalone, we can still allow opening the modal or a badge
  const handleClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable' || outcome === 'dismissed') {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (variant === 'settings') {
    return (
      <>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                {isInstalled ? 'App Ya Instalada' : 'Descargar / Instalar App'}
              </p>
              <p className="text-xs text-emerald-700">
                {isInstalled
                  ? 'Abierto en modo aplicación en este equipo'
                  : 'Instala el acceso directo en celular Android, iPhone o PC'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded-lg shadow-sm">
            {isInstalled ? 'Ver Info' : 'Instalar'}
          </span>
        </button>

        <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'banner') {
    if (isInstalled) return null;
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-300 flex-shrink-0 animate-pulse" />
            <span className="font-medium">
              ¿Quieres usar la app en tu celular como aplicación nativa?
            </span>
          </div>
          <button
            onClick={handleClick}
            className="flex-shrink-0 px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold rounded-lg transition text-xs shadow"
          >
            Instalar App
          </button>
        </div>
        <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Default navbar variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
          isInstalled
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-700/30'
        }`}
        title="Instalar Atlético Sucre en tu teléfono o PC"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isInstalled ? 'App Instalada' : 'Descargar App'}</span>
        <span className="sm:hidden">{isInstalled ? 'App' : 'Instalar'}</span>
      </button>

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
