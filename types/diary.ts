/**
 * t.다이어리 & t.note 지류 결합 솔루션 타입 정의
 * 브랜드(지류 다이어리 발행사)별 공식 행사 일정과 사용자 개인 일정을 통합하는 /t-diary 전용 모델.
 */

export interface DiaryBrand {
  id: string;
  brand_slug: string;
  brand_name: string;
  logo_url: string | null;
  contact_info: string | null;
  created_at: string;
}

export interface DiaryEvent {
  id: string;
  diary_id: string;
  title: string;
  description: string | null;
  event_date: string; // "YYYY-MM-DD"
  is_public: boolean;
  send_alimtalk: boolean;
}
