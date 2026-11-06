/** Shapes of the public endpoints (/public/*, /app-release). Field names match the API (snake_case). */

export type CategoryGender = 'mixed' | 'female';
export type TrainingShift = 'morning' | 'afternoon' | 'all';

export interface Category {
  id: number;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
  gender: CategoryGender;
  coach_id: number | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Venue {
  id: number;
  name: string;
  description: string | null;
  surface: string | null;
  is_main: boolean;
  address: string | null;
  maps_url: string | null;
  is_active: boolean;
}

export interface ScheduleItem {
  session_id: number;
  category_id: number;
  category_name: string;
  venue_id: number;
  venue_name: string;
  weekday: number;
  weekday_name: string;
  /** "HH:MM:SS" */
  start_time: string;
  end_time: string;
  shift: TrainingShift;
}

export interface Coach {
  id: number;
  full_name: string;
  role_title: string;
  credentials: string[];
  photo_url: string | null;
  photo_position: string;
  display_order: number;
  is_public: boolean;
}

export interface PublicClub {
  enrollment_fee: number;
  monthly_fee: number;
  due_day: number;
  sibling_discount_percent: number;
  payment_methods: string[];
  nequi_number: string | null;
  nequi_holder: string | null;
  payment_contact_message: string | null;
  whatsapp: string;
  whatsapp_url: string;
  payment_instructions: string | null;
  uniform_store: string | null;
  data_policy_version: string;
  data_policy_text: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  cover_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  caption: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  tag: string | null;
  display_order: number;
}

export interface AppRelease {
  id: number;
  version: string;
  build_number: number;
  apk_url: string;
  release_notes: string | null;
  min_android: string | null;
  released_at: string;
}
