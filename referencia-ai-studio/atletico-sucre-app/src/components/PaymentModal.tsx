import React, { useState, useEffect } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player, PaymentMethod, PaymentRecord } from '../types';
import { MONTH_NAMES, formatCurrency, getCurrentDateInfo } from '../utils/dateAndPayment';
import { generateDemoVoucherSvg } from '../data/initialData';
import {
  X,
  Upload,
  CheckCircle2,
  Calendar,
  DollarSign,
  CreditCard,
  Hash,
  FileImage,
  Sparkles,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer?: Player;
  initialMonth?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  targetPlayer,
  initialMonth,
}) => {
  const { players, registerPayment, selectedYear, settings, role } = useAcademy();
  const { month: currentMonth } = getCurrentDateInfo();

  const [playerId, setPlayerId] = useState<string>(targetPlayer?.id || players[0]?.id || '');
  const [month, setMonth] = useState<number>(initialMonth || currentMonth);
  const [year, setYear] = useState<number>(selectedYear);
  const [amount, setAmount] = useState<number>(targetPlayer?.monthlyFee || settings.defaultMonthlyFee);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Nequi / Daviplata');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(role === 'director');

  useEffect(() => {
    if (targetPlayer) {
      setPlayerId(targetPlayer.id);
      setAmount(targetPlayer.monthlyFee);
    }
  }, [targetPlayer]);

  useEffect(() => {
    if (initialMonth) {
      setMonth(initialMonth);
    }
  }, [initialMonth]);

  useEffect(() => {
    setYear(selectedYear);
  }, [selectedYear]);

  // Update amount if player changes
  const handlePlayerChange = (id: string) => {
    setPlayerId(id);
    const found = players.find((p) => p.id === id);
    if (found) {
      setAmount(found.monthlyFee);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setReceiptUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to load a demo voucher quickly for testing
  const handleLoadDemoVoucher = () => {
    const selected = players.find((p) => p.id === playerId) || targetPlayer || players[0];
    const monthName = MONTH_NAMES[month - 1];
    const ref = `DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceNumber(ref);
    const demoSvg = generateDemoVoucherSvg(
      selected.fullName,
      monthName,
      amount,
      ref,
      paymentDate,
      paymentMethod
    );
    setReceiptUrl(demoSvg);
    setReceiptFileName(`comprobante_${paymentMethod.toLowerCase().replace(/[^a-z]/g, '_')}.png`);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;

    registerPayment(
      {
        playerId,
        year,
        month,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        receiptUrl: receiptUrl || undefined,
        receiptFileName: receiptFileName || undefined,
        isVerified,
        verifiedAt: isVerified ? new Date().toISOString() : undefined,
        verifiedBy: isVerified ? settings.directorName : undefined,
        notes: notes.trim() || undefined,
      },
      true
    );

    onClose();
  };

  const selectedPlayer = players.find((p) => p.id === playerId) || targetPlayer;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Registrar Pago de Mensualidad</h3>
              <p className="text-xs text-slate-400">
                {selectedPlayer ? selectedPlayer.fullName : 'Seleccionar deportista'}
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Player Selection if not fixed */}
          {!targetPlayer && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deportista *
              </label>
              <select
                value={playerId}
                onChange={(e) => handlePlayerChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.category} - #{p.jerseyNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Select Season Months (Octubre - Diciembre 2027) */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-900 block">
              ⭐ Meses del Ciclo Oficial (2027):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { m: 10, name: 'Octubre 2027' },
                { m: 11, name: 'Noviembre 2027' },
                { m: 12, name: 'Diciembre 2027' },
              ].map(({ m, name }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMonth(m);
                    setYear(2027);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center ${
                    month === m && year === 2027
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                      : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Month and Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mes a Pagar *
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                required
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name} {idx + 1 >= 10 && idx + 1 <= 12 ? '⭐ (Ciclo 2027)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Año
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-semibold"
                required
              />
            </div>
          </div>

          {/* Amount and Payment Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valor Pagado *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Method and Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Medio de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              >
                <option value="Nequi / Daviplata">Nequi / Daviplata</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta de Débito/Crédito">Tarjeta Débito/Crédito</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. Comprobante / Aprobación
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej: NQ-984421"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Comprobante de Pago (Voucher Upload) - KEY REQUIREMENT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <FileImage className="w-3.5 h-3.5 text-emerald-600" />
                Cargar Comprobante de Pago
              </label>
              <button
                type="button"
                onClick={handleLoadDemoVoucher}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generar Demo</span>
              </button>
            </div>

            {receiptUrl ? (
              <div className="relative rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3 flex items-center gap-3">
                <img
                  src={receiptUrl}
                  alt="Comprobante cargado"
                  className="w-16 h-20 object-cover rounded-xl border border-emerald-200 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-900 truncate">
                    {receiptFileName || 'Comprobante listo'}
                  </p>
                  <p className="text-[11px] text-emerald-700">Imagen cargada correctamente</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setReceiptFileName('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Eliminar comprobante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 bg-slate-50/50 hover:bg-emerald-50/20 block">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">
                  Seleccionar foto o captura de pantalla
                </span>
                <span className="text-[11px] text-slate-400">PNG, JPG, WebP o captura de app bancaria</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Director Verification Checkbox */}
          {role === 'director' ? (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="isVerified"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="isVerified" className="text-xs font-bold text-slate-800 cursor-pointer">
                Aprobar inmediatamente como Pago Verificado (Al Día)
              </label>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
              ℹ️ Al enviar este comprobante, la dirección de la escuela lo revisará y actualizará el estado a verificado.
            </p>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pago realizado por el tío, descuento por hermanos, etc."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
              <span>Guardar Pago de {MONTH_NAMES[month - 1]}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
