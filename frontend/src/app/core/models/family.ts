/** Shapes of the parent endpoints (/auth/register, /me/*). Field names match the API. */
import { ScheduleItem } from './public';

export type DocumentTypeGuardian = 'CC' | 'CE' | 'PPT' | 'PA';
export type DocumentTypePlayer = 'RC' | 'TI' | 'NUIP' | 'PPT' | 'PA';
export type Relationship = 'mother' | 'father' | 'grandparent' | 'uncle_aunt' | 'sibling' | 'legal_guardian' | 'other';
export type Sex = 'F' | 'M';
export type SchoolShift = 'morning' | 'afternoon' | 'full_day';
export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'inactive';
export type MonthStatus = 'paid' | 'in_review' | 'due' | 'overdue' | 'not_enrolled' | 'grace' | 'upcoming';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';
export type PaymentConcept = 'enrollment' | 'monthly';
export type PaymentMethod = 'cash' | 'nequi';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface GuardianInput {
  first_names: string;
  last_names: string;
  document_type: DocumentTypeGuardian;
  document_number: string;
  phone: string;
  alt_phone: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  relationship_to_player: Relationship;
}

export interface Guardian extends GuardianInput {
  id: number;
  full_name: string;
  email: string;
}

export interface PlayerInput {
  first_names: string;
  last_names: string;
  document_type: DocumentTypePlayer;
  document_number: string;
  birth_date: string;
  sex: Sex;
  school_name: string;
  school_shift: SchoolShift;
  eps: string;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface CategoryBrief {
  id: number;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
  gender: string;
}

export interface Player {
  id: number;
  first_names: string;
  last_names: string;
  full_name: string;
  document_type: DocumentTypePlayer;
  document_number: string;
  birth_date: string;
  age: number;
  sex: Sex;
  category: CategoryBrief | null;
  has_photo: boolean;
  jersey_number: number | null;
  position: string | null;
  school_name: string;
  school_shift: SchoolShift;
  training_shift: string;
  enrollment_status: EnrollmentStatus;
  rejection_reason: string | null;
  monthly_fee: number;
  enrolled_at: string;
}

export interface PlayerHealth {
  eps: string;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface PlayerDetail extends Player {
  health: PlayerHealth;
  guardian: { id: number; full_name: string; phone: string; relationship_to_player: string };
  schedule: ScheduleItem[];
}

export interface RegisterInput {
  email: string;
  password: string;
  guardian: GuardianInput;
  players: PlayerInput[];
  accept_data_policy: boolean;
  accept_image_use: boolean;
}

export interface AttendanceRecord {
  id: number;
  session_date: string;
  status: AttendanceStatus;
  training_session_id: number;
  weekday: number;
  start_time: string;
  venue_name: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  rate: number;
  records: AttendanceRecord[];
}

export interface Payment {
  id: number;
  player_id: number;
  concept: PaymentConcept;
  period_year: number | null;
  period_month: number | null;
  amount: number;
  method: PaymentMethod;
  paid_on: string;
  reference_number: string | null;
  has_receipt: boolean;
  status: PaymentStatus;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  verified_at: string | null;
}

export interface MonthState {
  year: number;
  month: number;
  month_name: string;
  status: MonthStatus;
  payment_id: number | null;
}

export interface AccountStatus {
  player_id: number;
  is_up_to_date: boolean;
  enrollment_paid: boolean;
  overdue_months: number;
  amount_due: number;
  months: MonthState[];
  payments: Payment[];
}

export interface Note {
  id: number;
  player_id: number;
  note_date: string;
  content: string;
  visible_to_guardian: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  category_id: number | null;
  category_name: string | null;
  title: string;
  body: string;
  created_at: string;
  expires_at: string | null;
}
