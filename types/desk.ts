/**
 * t.note 스마트 데스크 & 링크픽(LinkPick) 통합 타입 규격
 * (Supabase tnote_cards, linkpick_items, job_applicants 스키마와 1:1 호환)
 */

export type TNoteCardType = "VOICE" | "LOCATION" | "TODO" | "NOTE";

export interface TNoteTodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TNoteCard {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  card_type: TNoteCardType;
  title: string;
  content: string;
  /** 음성 메모 전용 필드 */
  voice_audio_url?: string | null;
  voice_duration_sec?: number | null;
  voice_transcript?: string | null;
  /** 위치 기반 알림 전용 필드 */
  location_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  geofence_radius_meters?: number;
  /** 체크리스트 전용 필드 */
  todo_items?: TNoteTodoItem[];
  /** 비주얼 메타데이터 */
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  order_index: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type LinkPickPriceMode = "SHOW_PRICE" | "LOWEST_PRICE_BTN" | "SPECIAL_DEAL_BTN";

export interface LinkPickDeskItem {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  title: string;
  subtitle?: string | null;
  item_type: "COUPANG" | "DIRECT_PRODUCT" | "AFFILIATE" | "CUSTOM_LINK";
  original_url: string;
  affiliate_url?: string | null;
  coupang_sub_id?: string | null;
  product_id?: string | null;
  thumbnail_url?: string | null;
  display_price?: number | null;
  price_mode: LinkPickPriceMode;
  click_count: number;
  conversion_count: number;
  total_commission: number;
  /** 티홈페이지 공개 노출 여부 (실시간 스위치) */
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DeskApplicantWidgetData {
  new_applicants_count: number;
  active_postings_count: number;
  recent_applicant_name: string;
  recent_role: string;
  received_time_text: string;
}
