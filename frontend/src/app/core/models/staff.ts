/** Shapes of the coach (/coach/*) and admin (/admin/*) endpoints. Field names match the API. */
import { AttendanceStatus, EnrollmentStatus, Payment, PaymentConcept, PaymentMethod, Player } from './family';

export interface AttendanceRow {
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  status: AttendanceStatus | null;
}

export interface AttendanceSheet {
  session_id: number;
  session_date: string;
  category_name: string;
  rows: AttendanceRow[];
}

export interface NoteInput {
  note_date: string;
  content: string;
  visible_to_guardian: boolean;
}

export interface AnnouncementInput {
  category_id: number | null;
  title: string;
  body: string;
  expires_at: string | null;
}

export interface CategoryCount {
  category_id: number | null;
  category_name: string;
  players: number;
}

export interface Stats {
  players_approved: number;
  players_pending: number;
  guardians: number;
  coaches_with_account: number;
  payments_to_verify: number;
  players_up_to_date: number;
  players_overdue: number;
  revenue_this_month: number;
  attendance_rate_30_days: number;
  by_category: CategoryCount[];
}

export interface PaymentAdmin extends Payment {
  player_name: string;
  guardian_name: string;
  guardian_phone: string;
}

export interface PaymentAdminInput {
  player_id: number;
  concept: PaymentConcept;
  period_year: number | null;
  period_month: number | null;
  amount: number;
  method: PaymentMethod;
  paid_on: string;
  reference_number: string | null;
  notes: string | null;
}

export interface Overdue {
  player_id: number;
  player_name: string;
  category_name: string | null;
  guardian_name: string;
  guardian_phone: string;
  overdue_months: number;
  amount_due: number;
  whatsapp_url: string;
}

export interface CoachProfile {
  id: number;
  full_name: string;
  role_title: string;
  credentials: string[];
  photo_url: string | null;
  photo_position: string;
  display_order: number;
  is_public: boolean;
  has_account: boolean;
  email: string | null;
  account_active: boolean | null;
}

export interface PlayerAdminUpdate {
  category_id?: number | null;
  monthly_fee?: number;
  enrollment_status?: EnrollmentStatus;
  jersey_number?: number | null;
  position?: string | null;
}

export interface ClubSettings {
  enrollment_fee: number;
  monthly_fee: number;
  due_day: number;
  sibling_discount_percent: number;
  nequi_number: string | null;
  nequi_holder: string | null;
  whatsapp: string;
  payment_instructions: string | null;
  uniform_store: string | null;
  data_policy_version: string;
  data_policy_text: string;
}

export interface AppReleaseFull {
  id: number;
  version: string;
  build_number: number;
  apk_url: string;
  release_notes: string | null;
  min_android: string | null;
  is_current: boolean;
  released_at: string;
}

export type PlayerList = Player[];
