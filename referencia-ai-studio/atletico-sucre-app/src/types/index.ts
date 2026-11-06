export type AgeCategory =
  | 'Sub-6'
  | 'Sub-7'
  | 'Sub-8'
  | 'Sub-9'
  | 'Sub-10'
  | 'Sub-11'
  | 'Sub-12'
  | 'Sub-13'
  | 'Sub-14'
  | 'Sub-15'
  | 'Sub-16'
  | 'Sub-17'
  | 'Sub-18';

export type PaymentMethod =
  | 'Transferencia Bancaria'
  | 'Nequi / Daviplata'
  | 'Efectivo'
  | 'Tarjeta de Débito/Crédito'
  | 'Otro';

export type PaymentStatusType =
  | 'pagado'
  | 'pendiente_verificacion'
  | 'vencido'
  | 'pendiente'
  | 'adelantado';

export interface PaymentRecord {
  id: string;
  playerId: string;
  year: number;
  month: number; // 1 = Enero, ..., 12 = Diciembre
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receiptUrl?: string; // base64 or image URL
  receiptFileName?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface Player {
  id: string;
  fullName: string;
  documentId: string; // Cédula de menor, T.I. o R.C.
  birthDate: string; // YYYY-MM-DD
  category: AgeCategory;
  jerseyNumber: number;
  position: 'Portero' | 'Defensa' | 'Mediocampista' | 'Delantero';
  photoUrl: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  monthlyFee: number;
  dueDay: number; // Day of month (e.g., 5 or 10)
  isActive: boolean;
  notes?: string;
  enrolledDate: string;
}

export interface AcademySettings {
  name: string;
  slogan: string;
  logoUrl?: string;
  directorName: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string;
  currencyCode: string; // 'COP', 'USD', 'MXN', etc.
  defaultMonthlyFee: number;
  defaultDueDay: number; // e.g., 5
  directorPin: string; // PIN for Director access protection
  paymentInstructions: string;
  bankAccounts: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  }[];
}

export type UserRole = 'director' | 'padre';

export interface MonthlyStatusInfo {
  month: number;
  monthName: string;
  status: PaymentStatusType;
  payment?: PaymentRecord;
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  isFutureMonth: boolean;
}
