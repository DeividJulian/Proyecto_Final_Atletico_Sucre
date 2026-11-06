import React, { useState, useEffect } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { ATLETICO_SUCRE_DEFAULT_LOGO } from '../data/initialData';
import {
  X,
  Settings,
  Building,
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Camera,
  Heart,
  Image as ImageIcon,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    clearAllPlayers,
    resetToDefaults,
    exportDataJson,
    importDataJson,
  } = useAcademy();

  const [form, setForm] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm((prev) => ({ ...prev, logoUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: ATLETICO_SUCRE_DEFAULT_LOGO }));
  };

  const handleAddAccount = () => {
    setForm({
      ...form,
      bankAccounts: [
        ...form.bankAccounts,
        {
          bankName: 'Nequi',
          accountType: 'Celular',
          accountNumber: '300 000 0000',
          accountHolder: form.directorName,
        },
      ],
    });
  };

  const handleRemoveAccount = (index: number) => {
    setForm({
      ...form,
      bankAccounts: form.bankAccounts.filter((_, i) => i !== index),
    });
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const updated = [...form.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, bankAccounts: updated });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          alert('¡Datos restaurados con éxito!');
          onClose();
        } else {
          alert('El archivo no tiene el formato correcto.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Configuración de la Escuela</h3>
              <p className="text-xs text-slate-400">
                Ajuste de datos institucionales, cuentas bancarias y copias de seguridad
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Section 1: Academy Basics, Logo & Slogan */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              Identidad y Datos del Club
            </h4>

            {/* Club Logo Upload Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Logo Preview */}
              <div className="relative shrink-0">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white border-2 border-slate-200 p-2 shadow-sm flex items-center justify-center overflow-hidden">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo del Club"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  )}
                </div>
              </div>

              {/* Logo Upload Controls */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <h5 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
                    <span>Escudo / Logo Oficial del Club</span>
                  </h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Este logo aparecerá en el encabezado, comprobantes, mensajes y certificados de Paz y Salvo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir Mi Logo (PNG / JPG / SVG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
                    title="Cargar el escudo conmemorativo de Atlético Sucre"
                  >
                    Escudo Oficial Sucre
                  </button>

                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logoUrl: undefined }))}
                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Club Name & Slogan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Escuela / Club *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Club Deportivo Atlético Sucre"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Eslogan del Club *</span>
                </label>
                <input
                  type="text"
                  value={form.slogan}
                  onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                  placeholder="En Atlético Sucre enseñamos de corazón a corazón"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium italic text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Director / Responsable *
                </label>
                <input
                  type="text"
                  value={form.directorName}
                  onChange={(e) => setForm({ ...form, directorName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sede / Dirección
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cuota Mensual
                </label>
                <input
                  type="number"
                  value={form.defaultMonthlyFee}
                  onChange={(e) => setForm({ ...form, defaultMonthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Día de Vencimiento
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={form.defaultDueDay}
                  onChange={(e) => setForm({ ...form, defaultDueDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>PIN Director</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Seguridad</span>
                </label>
                <input
                  type="text"
                  value={form.directorPin || '1973'}
                  onChange={(e) => setForm({ ...form, directorPin: e.target.value })}
                  placeholder="1973"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Accounts for Payments */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Cuentas Bancarias para Padres de Familia
              </h4>
              <button
                type="button"
                onClick={handleAddAccount}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Cuenta</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {form.bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Banco</label>
                    <input
                      type="text"
                      value={acc.bankName}
                      onChange={(e) => handleAccountChange(idx, 'bankName', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="Ej: Bancolombia"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                    <input
                      type="text"
                      value={acc.accountType}
                      onChange={(e) => handleAccountChange(idx, 'accountType', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="Ahorros / Celular"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Número</label>
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) => handleAccountChange(idx, 'accountNumber', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Titular</label>
                      <input
                        type="text"
                        value={acc.accountHolder}
                        onChange={(e) => handleAccountChange(idx, 'accountHolder', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    {form.bankAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg mt-3"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Install App */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Instalación en Celular o PC
            </h4>
            <PWAInstallButton variant="settings" />
          </div>

          {/* Section 3: Data Backup & Reset */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Copia de Seguridad y Respaldos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={exportDataJson}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Descargar Copia JSON</span>
              </button>

              <label className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Restaurar Copia</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Deseas vaciar la lista de deportistas y dejar el sistema en blanco para registrar nuevos datos?')) {
                    clearAllPlayers();
                    alert('Lista de deportistas vaciada. El sistema ha quedado en blanco.');
                    onClose();
                  }
                }}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                title="Elimina todos los deportistas registrados para empezar una lista limpia"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Vaciar Lista (En Blanco)</span>
              </button>
            </div>

            <div className="pt-1">
              <a
                href="/atletico-sucre-app.zip"
                download="atletico-sucre-app.zip"
                className="w-full p-3 bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-md border border-emerald-700/50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>📦 Descargar Código Fuente Completo de la Aplicación (.ZIP)</span>
              </a>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess ? '¡Guardado!' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
