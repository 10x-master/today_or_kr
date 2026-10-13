/**
 * 티노트(t.note) 구글 캘린더 OAuth 연동 및 실시간 동기화 타입 정의
 */

export interface UserGoogleCalendarToken {
  id?: string;
  user_id: string;
  email?: string | null;
  access_token: string;
  refresh_token?: string | null;
  scope?: string | null;
  token_type?: string;
  expiry_date?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  reminderMinutes?: number;
  location?: string;
}

export interface GoogleCalendarEventResult {
  id?: string;
  htmlLink?: string;
  status: string;
  summary: string;
  created?: string;
}

export interface GoogleAuthStatusResponse {
  isConnected: boolean;
  email?: string;
  expiresAt?: string;
  updatedAt?: string;
}
