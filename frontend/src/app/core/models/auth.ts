/** Session data returned by /auth/login, /auth/register and /auth/me. */

export type Role = 'parent' | 'coach';

/** What the panels care about: parents, coaches, and coaches with admin permissions. */
export type PanelRole = 'parent' | 'coach' | 'admin';

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  display_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: SessionUser;
}

export interface Message {
  detail: string;
}
