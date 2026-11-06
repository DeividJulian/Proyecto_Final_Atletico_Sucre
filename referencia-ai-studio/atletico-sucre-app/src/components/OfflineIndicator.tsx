import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showToast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-bounce">
      {!isOnline ? (
        <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-2.5 text-xs backdrop-blur-md">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-amber-300">Modo Sin Conexión</p>
            <p className="text-[11px] text-slate-300">Tus datos se guardan de forma segura en este dispositivo.</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-900/95 text-white px-4 py-2 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-2 text-xs backdrop-blur-md">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-emerald-200">¡Conexión a internet restablecida!</span>
        </div>
      )}
    </div>
  );
};
