import React, { useState, useEffect } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Player, AgeCategory } from '../types';
import { CATEGORIES, detectCategoryFromBirthDate, calculateAge } from '../utils/categories';
import {
  X,
  User,
  Camera,
  Upload,
  Calendar,
  Shield,
  Phone,
  Mail,
  DollarSign,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerToEdit?: Player;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508215885820-4523e431397e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  playerToEdit,
}) => {
  const { addPlayer, updatePlayer, deletePlayer, settings, role } = useAcademy();

  const [fullName, setFullName] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('2016-05-10');
  const [category, setCategory] = useState<AgeCategory>('Sub-10');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [position, setPosition] = useState<Player['position']>('Delantero');
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_AVATARS[0]);
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [monthlyFee, setMonthlyFee] = useState<number>(settings.defaultMonthlyFee);
  const [dueDay, setDueDay] = useState<number>(settings.defaultDueDay);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (playerToEdit) {
      setFullName(playerToEdit.fullName);
      setDocumentId(playerToEdit.documentId);
      setBirthDate(playerToEdit.birthDate);
      setCategory(playerToEdit.category);
      setJerseyNumber(playerToEdit.jerseyNumber);
      setPosition(playerToEdit.position);
      setPhotoUrl(playerToEdit.photoUrl);
      setParentName(playerToEdit.parentName);
      setParentPhone(playerToEdit.parentPhone);
      setParentEmail(playerToEdit.parentEmail || '');
      setMonthlyFee(playerToEdit.monthlyFee);
      setDueDay(playerToEdit.dueDay);
      setNotes(playerToEdit.notes || '');
    } else {
      // New player defaults
      setFullName('');
      setDocumentId('');
      setBirthDate('2016-05-10');
      setCategory('Sub-10');
      setJerseyNumber(Math.floor(Math.random() * 20) + 1);
      setPosition('Delantero');
      setPhotoUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setMonthlyFee(settings.defaultMonthlyFee);
      setDueDay(settings.defaultDueDay);
      setNotes('');
    }
  }, [playerToEdit, settings, isOpen]);

  // When birthDate changes, auto-suggest Category
  const handleBirthDateChange = (date: string) => {
    setBirthDate(date);
    if (date) {
      const suggestedCategory = detectCategoryFromBirthDate(date);
      setCategory(suggestedCategory);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !parentPhone.trim()) return;

    if (playerToEdit) {
      updatePlayer(playerToEdit.id, {
        fullName: fullName.trim(),
        documentId: documentId.trim(),
        birthDate,
        category,
        jerseyNumber: Number(jerseyNumber),
        position,
        photoUrl,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim() || undefined,
        monthlyFee: Number(monthlyFee),
        dueDay: Number(dueDay),
        notes: notes.trim() || undefined,
      });
    } else {
      addPlayer({
        fullName: fullName.trim(),
        documentId: documentId.trim() || `TI-${Date.now().toString().slice(-6)}`,
        birthDate,
        category,
        jerseyNumber: Number(jerseyNumber),
        position,
        photoUrl,
        parentName: parentName.trim() || 'Acudiente',
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim() || undefined,
        monthlyFee: Number(monthlyFee),
        dueDay: Number(dueDay),
        isActive: true,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (playerToEdit && confirm(`¿Estás seguro de eliminar a ${playerToEdit.fullName}?`)) {
      deletePlayer(playerToEdit.id);
      onClose();
    }
  };

  const currentAge = calculateAge(birthDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="w-12 h-12 object-contain drop-shadow rounded-lg shrink-0 bg-white/10 p-0.5"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {settings.name}
                </span>
                <span className="text-[11px] text-emerald-300 italic hidden sm:inline">
                  «{settings.slogan}»
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {playerToEdit
                  ? role === 'padre'
                    ? 'Corregir / Editar Datos de mi Deportista'
                    : 'Editar Ficha del Deportista'
                  : 'Formulario Oficial de Inscripción'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Helpful Registration Guide Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-emerald-950 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                {playerToEdit
                  ? role === 'padre'
                    ? '✏️ Corrección de Formulario de Inscripción:'
                    : 'Edición de Ficha Deportiva:'
                  : 'Guía rápida de inscripción:'}
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {playerToEdit
                  ? 'Corrige cualquier dato de tu deportista (nombre, documento, fecha de nacimiento, foto carnet, dorsal, posición o datos de contacto). Los cambios se reflejarán de inmediato en su carnet deportivo.'
                  : 'Completa los datos de tu deportista. La categoría se calcula automáticamente con la fecha de nacimiento. La foto que elijas o subas quedará en su Carnet Oficial Deportivo para imprimir.'}
              </p>
            </div>
          </div>

          {/* Photo & Basic Info Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Photo Preview & Upload */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Foto del jugador"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
                />
                <label className="absolute -bottom-2 -right-2 p-1.5 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-emerald-600 shadow transition">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[10px] text-slate-400">Subir foto</span>
            </div>

            {/* Quick avatar selection */}
            <div className="flex-1 w-full">
              <p className="text-xs font-bold text-slate-600 mb-1.5">
                O selecciona una foto predefinida:
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(avatar)}
                    className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      photoUrl === avatar ? 'border-emerald-500 scale-105' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Player Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Datos del Deportista
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Mateo Castro Rincón"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Documento de Identidad (TI / RC) *
                </label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="Ej: TI 1.098.344.201"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Birth date, Category and Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                  Edad calculada: {currentAge} años
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría por Edad *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AgeCategory)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Diferenciador para torneos
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Camiseta
                </label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(Number(e.target.value))}
                  min={1}
                  max={99}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posición en Cancha
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Portero', 'Defensa', 'Mediocampista', 'Delantero'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosition(pos)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition ${
                      position === pos
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Parent / Guardian Data for Weekly Reminders */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Datos del Acudiente / Contacto Semanal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Acudiente / Padre de Familia *
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ej: Andrés Castro"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Teléfono / WhatsApp *</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Para recordatorios</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Ej: 312 456 7890"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="padre@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor Mensualidad Acordada *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    disabled={role === 'padre'}
                    className={`w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-300 font-black ${
                      role === 'padre'
                        ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                        : 'text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    }`}
                    required
                  />
                </div>
                {role === 'padre' && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tarifa mensual oficial del club
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Día Límite de Pago *
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  disabled={role === 'padre'}
                  className={`w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold ${
                    role === 'padre'
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                      : 'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Día del mes (ej: 5)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas Médicas / Observaciones
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alergias, grupo sanguíneo, autorizaciones especiales, etc."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {playerToEdit && role === 'director' ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Deportista</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
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
                <span>
                  {playerToEdit
                    ? role === 'padre'
                      ? 'Guardar Correcciones'
                      : 'Actualizar Ficha'
                    : 'Inscribir Deportista'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
