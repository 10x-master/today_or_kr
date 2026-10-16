/**
 * t.다이어리 & t.note 지류 결합 솔루션 타입 정의
 * 다양한 제공자(기업/지역 소상공인/공공/크리에이터)의 공식 행사 일정 및
 * 유튜브·사진·음성 미디어, 사용자 개인 일정·구독을 통합하는 /t-diary 전용 모델.
 */

export type DiaryApprovalStatus = "APPROVED" | "PENDING" | "CONDITIONAL" | "REJECTED";
export type DiaryProviderType = "ENTERPRISE" | "LOCAL_BIZ" | "PUBLIC" | "CREATOR";

export interface DiaryBrand {
  id: string;
  brand_slug: string;
  brand_name: string;
  logo_url: string | null;
  contact_info: string | null;
  /** 'APPROVED'(승인완료) | 'PENDING'(심사대기) | 'CONDITIONAL'(조건부 승인) | 'REJECTED'(반려) */
  approval_status: DiaryApprovalStatus;
  /** 'ENTERPRISE'(기업/인쇄) | 'LOCAL_BIZ'(지역 소상공인) | 'PUBLIC'(지자체/공공) | 'CREATOR'(강사/크리에이터) */
  provider_type: DiaryProviderType;
  /** 지역 매핑용 시군구명 (예: "노원구"), 전국 단위 제공자는 null */
  region_code: string | null;
  /** 대표 유튜브 채널 URL */
  youtube_channel: string | null;
  /** 사업자 등록번호 (선택) */
  business_reg_no: string | null;
  /** 소개글 */
  intro: string | null;
  /** 인스타그램 또는 홈페이지 링크 */
  website_url: string | null;
  created_at: string;
}

export type DiaryEventMediaType = "NONE" | "YOUTUBE" | "IMAGE" | "VOICE";

export interface DiaryEvent {
  id: string;
  diary_id: string;
  title: string;
  description: string | null;
  event_date: string; // "YYYY-MM-DD"
  is_public: boolean;
  send_alimtalk: boolean;
  media_type: DiaryEventMediaType;
  /** 유튜브 링크(단축/일반 모두 지원) 또는 이미지 URL(복수인 경우 콤마로 구분) */
  media_url: string | null;
  /** 음성 메모 링크 */
  voice_url: string | null;
}

export interface UserDiarySubscription {
  id: string;
  user_id: string;
  diary_id: string;
  created_at: string;
}
