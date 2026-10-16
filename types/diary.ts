/**
 * t.다이어리 & t.note 지류 결합 솔루션 타입 정의
 * 다양한 제공자(기업/지역 소상공인/공공/크리에이터)의 공식 행사 일정 및
 * 유튜브·사진·음성 미디어, 사용자 개인 일정·구독을 통합하는 /t-diary 전용 모델.
 */

export type DiaryApprovalStatus = "APPROVED" | "PENDING" | "CONDITIONAL" | "REJECTED";
export type DiaryProviderType = "ENTERPRISE" | "LOCAL_BIZ" | "PUBLIC" | "CREATOR";
export type DiaryLicenseStatus = "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | "SUSPENDED";
export type DiaryPlan = "BUNDLE" | "PRO" | "ENTERPRISE";

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
  // --- t.홈피-t.노트-t.싸인 3각 연계 + 라이선스 엔진 (선택 필드 — 레거시 레코드는 ACTIVE/무제한으로 간주) ---
  /** 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED'. 미설정 시 ACTIVE로 간주 */
  license_status?: DiaryLicenseStatus;
  /** 'BUNDLE' | 'PRO' | 'ENTERPRISE' 요금제 */
  plan?: DiaryPlan;
  /** 라이선스 만료일 (ISO) */
  valid_until?: string | null;
  /** 최대 구성원 수 */
  max_members?: number;
  /** 연결된 t.홈페이지 슬러그 또는 절대경로("/"로 시작 시 그대로, 아니면 /biz/<slug>) */
  connected_homepage_slug?: string | null;
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
  /** 공개 대상 역할 — 기본 ['ALL']. 'PARENT'/'STUDENT'/'TEACHER' 등으로 제한 가능 */
  target_roles: string[];
  /** 공개 대상 학년/그룹 — 기본 ['ALL']. 예: ['1학년', '2학년'] */
  target_grades: string[];
  // --- t.note 멀티미디어 고도화 + t.sign 연동 (선택 필드) ---
  /** 다중 사진 URL 배열 */
  image_urls?: string[];
  /** 웹페이지 스크랩 북마크(OG 카드) 배열 */
  bookmark_urls?: DiaryBookmark[];
  /** 누적 음성 녹음 시간(초) */
  audio_duration?: number;
  /** 사용자 지정 소급/현재 기록 날짜 (event_date와 별개로 "실제 기록 시점"을 의미) */
  record_date?: string | null;
  /** 연동된 t.sign 전자계약/동의서 문서 ID */
  t_sign_doc_id?: string | null;
  /** 'NONE' | 'REQUESTED' | 'COMPLETED' */
  sign_status?: "NONE" | "REQUESTED" | "COMPLETED";
}

/** 웹페이지 스크랩 북마크 (OpenGraph 카드) */
export interface DiaryBookmark {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export interface UserDiarySubscription {
  id: string;
  user_id: string;
  diary_id: string;
  created_at: string;
}

/** 폐쇄형 커뮤니티 구성원 역할 */
export type DiaryMemberRole = "OWNER" | "TEACHER" | "PARENT" | "STUDENT";
export type DiaryMemberStatus = "APPROVED" | "PENDING";

export interface DiaryMember {
  id: string;
  diary_id: string;
  user_id: string;
  role: DiaryMemberRole;
  /** 담당/소속 학년·그룹 태그. 예: ['1학년'] */
  grade_tags: string[];
  status: DiaryMemberStatus;
  created_at: string;
}

/** 우리 반/우리 그룹 커뮤니티 게시글 (알림장/활동 사진·영상) */
export interface DiaryPost {
  id: string;
  diary_id: string;
  author_id: string;
  author_role: DiaryMemberRole;
  title: string;
  content: string | null;
  media_urls: string[];
  /** 노출 대상 학년/그룹. 기본 ['ALL'] */
  target_grades: string[];
  created_at: string;
}

/** 커뮤니티 게시글 비밀 댓글 (안심 소통창구) */
export interface DiaryComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}
