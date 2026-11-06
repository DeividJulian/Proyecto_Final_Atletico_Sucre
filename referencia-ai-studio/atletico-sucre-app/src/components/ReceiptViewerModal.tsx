import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { PaymentRecord, Player } from '../types';
import { MONTH_NAMES, formatCurrency } from '../utils/dateAndPayment';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Clock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: PaymentRecord;
  player?: Player;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  payment,
  player,
}) => {
  const { verifyPayment, deletePayment, role, settings } = useAcademy();
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [notes, setNotes] = useState<string>(payment?.notes || '');

  if (!isOpen || !payment) return null;

  const monthName = MONTH_NAMES[payment.month - 1];

  const handleApprove = () => {
    verifyPayment(payment.id, true, notes.trim() || 'Aprobado por Dirección');
    onClose();
  };

  const handleReject = () => {
    verifyPayment(payment.id, false, notes.trim() || 'Comprobante ilegible o monto incorrecto');
    onClose();
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de eliminar este registro de pago?')) {
      deletePayment(payment.id);
      onClose();
    }
  };

  const handleDownload = () => {
    if (!payment.receiptUrl) return;
    const a = document.createElement('a');
    a.href = payment.receiptUrl;
    a.download = `comprobante_${player?.fullName.replace(/\s+/g, '_')}_${monthName}_${payment.year}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Mes: {monthName} {payment.year}
              </span>
              {payment.isVerified ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                </span>
              ) : (
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> Pendiente de Verificación
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Comprobante de Pago • {player?.fullName || 'Deportista'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Descargar comprobante"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Split Image Viewer & Details */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Image Canvas & Controls */}
          <div className="p-4 sm:p-6 bg-slate-100 flex flex-col items-center justify-between min-h-[320px]">
            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 self-center">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.2))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 min-w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.2))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Rotar 90 grados"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-[260px]">
              {payment.receiptUrl ? (
                <div
                  className="transition-transform duration-200 max-w-full max-h-[380px] flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={payment.receiptUrl}
                    alt="Soporte de pago"
                    className="max-h-[360px] object-contain rounded-xl shadow-md border border-slate-300"
                  />
                </div>
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">No se adjuntó imagen para este pago</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Soporte digital cargado por el acudiente
            </p>
          </div>

          {/* Right Column: Transaction metadata & Validation Actions */}
          <div className="p-4 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detalles de la Transacción
                </h4>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(payment.amount, settings.currencyCode, settings.currencySymbol)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Deportista:</span>
                  <strong className="text-slate-800">{player?.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Categoría:</span>
                  <strong className="text-slate-800">{player?.category}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha del Pago:</span>
                  <strong className="text-slate-800">{payment.paymentDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Medio:</span>
                  <strong className="text-slate-800">{payment.paymentMethod}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">No. de Referencia / Aprobación:</span>
                  <strong className="text-slate-800 font-mono">{payment.referenceNumber}</strong>
                </div>
              </div>

              {/* Verified Status Banner */}
              {payment.isVerified ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Comprobante Validado y Aprobado</p>
                    <p className="text-emerald-700 mt-0.5">
                      {payment.verifiedBy && `Validado por: ${payment.verifiedBy}`}
                      {payment.verifiedAt && ` el ${new Date(payment.verifiedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-cyan-900">En Espera de Verificación</p>
                    <p className="text-cyan-700 mt-0.5">
                      Verifique que la transferencia coincida en la cuenta bancaria de la escuela.
                    </p>
                  </div>
                </div>
              )}

              {/* Notes Input for Director */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas de Auditoría
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas (ej: confirmado en extracto Bancolombia)..."
                  rows={2}
                  disabled={role !== 'director'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {role === 'director' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleReject}
                      className="px-4 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-xs transition"
                    >
                      Rechazar / Observación
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar Comprobante</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1 self-center pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar este registro de pago</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
