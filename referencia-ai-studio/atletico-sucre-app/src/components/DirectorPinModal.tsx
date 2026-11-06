import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Shield, KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DirectorPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectorPinModal: React.FC<DirectorPinModalProps> = ({ isOpen, onClose }) => {
  const { unlockDirector, settings } = useAcademy();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockDirector(pin);
    if (success) {
      setPin('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Acceso a Dirección</h3>
              <p className="text-xs text-slate-400">Club de Fútbol Atlético Sucre</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Panel Administrativo Restringido
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Para proteger la privacidad de los deportistas y datos financieros, ingresa el PIN de la Dirección.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
              PIN de Acceso
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              required
            />
            {error && (
              <p className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PIN incorrecto. Por favor inténtalo de nuevo.</span>
              </p>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-2">
              (PIN por defecto: <strong className="text-slate-600">1973</strong>)
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-1.5"
            >
              <span>Ingresar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
