/**
 * 공식 행정 고시, 로컬 인프라/재개발 팩트 피드, 광고 캠페인 및 업무일지 타입 정의
 */

export type OfficialNoticeCategory =
  | "ALL"
  | "CAFE"      // ☕ 동네카페
  | "REDEVELOP" // 재개발·실거래
  | "INFRA"     // 국토부·교통
  | "EDU"       // 단지 AI교육 공모
  | "COUNCIL"   // 의회·행정
  | "FESTIVAL"  // 축제·행사
  | "SUBSIDY";  // 지원금

export type TargetRole = "RESIDENT" | "REP" | "MANAGER" | "CITIZEN" | "ALL";

export interface TargetRoleMeta {
  role: TargetRole;
  label: string;
  icon: string;
}

export const TARGET_ROLE_OPTIONS: TargetRoleMeta[] = [
  { role: "RESIDENT", label: "입주민", icon: "👤" },
  { role: "REP", label: "동대표", icon: "👔" },
  { role: "MANAGER", label: "관리소장", icon: "🏢" },
  { role: "CITIZEN", label: "동네주민", icon: "🏠" },
];

export interface LocalOfficialNotice {
  id: string;
  district_code: string;
  category: OfficialNoticeCategory;
  notice_no: string | null;
  issuing_agency: string;
  title: string;
  impact_zone: string | null;
  summary_1: string;
  summary_2: string;
  summary_3: string;
  details_body?: string | null;
  contact_info?: string | null;
  official_link: string;
  publish_date: string;
  view_count?: number;
  related_tags?: string[];
  target_roles?: string[];
  created_at?: string;
}

export interface OfficialNoticeCategoryMeta {
  label: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const OFFICIAL_NOTICE_CATEGORIES: Record<
  string,
  OfficialNoticeCategoryMeta
> = {
  CAFE: {
    label: "동네카페",
    icon: "☕",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    badgeText: "text-amber-800",
    borderColor: "border-amber-300",
  },
  REDEVELOP: {
    label: "재개발·실거래",
    icon: "🏢",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "text-amber-700",
    borderColor: "border-amber-300",
  },
  INFRA: {
    label: "국토부·교통",
    icon: "🏗️",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "text-blue-700",
    borderColor: "border-blue-300",
  },
  EDU: {
    label: "단지 AI교육 공모",
    icon: "🎓",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-700",
    borderColor: "border-emerald-300",
  },
  COUNCIL: {
    label: "의회·행정",
    icon: "🏛️",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "text-purple-700",
    borderColor: "border-purple-300",
  },
  FESTIVAL: {
    label: "축제·행사",
    icon: "🎪",
    badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
    badgeText: "text-pink-700",
    borderColor: "border-pink-300",
  },
  SUBSIDY: {
    label: "지원금",
    icon: "💡",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-700",
    borderColor: "border-rose-300",
  },
};

/** 스폰서드 광고 캠페인 테이블 ad_campaigns */
export interface AdCampaign {
  id: string;
  industry_type: string;
  title: string;
  badge_label?: string | null;
  benefit_summary: string;
  target_interests?: string[];
  cta_button_text?: string | null;
  is_active?: boolean;
  created_at?: string;
}

/** 아파트 단지 AI 교육 신청 테이블 apt_edu_applications */
export interface AptEduApplication {
  id?: string;
  complex_name: string;
  district_code: string;
  applicant_name: string;
  applicant_role: string;
  applicant_contact: string;
  expected_attendees?: number;
  status?: string;
  created_at?: string;
}

/** 마케팅 리드 테이블 marketing_leads */
export interface MarketingLead {
  id?: string;
  phone_number: string;
  subscribed_keyword: string;
  district_code: string;
  is_marketing_agreed?: boolean;
  marketing_agreed_at?: string;
  source_funnel?: string;
  created_at?: string;
}

/** 업무일지 테이블 work_logs */
export interface WorkLog {
  id: string;
  workspace_id?: string | null;
  author_id?: string | null;
  title: string;
  content_text?: string | null;
  due_date?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  is_alert_enabled: boolean;
  alert_time: string;
  created_at?: string;
  updated_at?: string;
}

/** 티노트/티단노트 고시 스크랩 및 일정 테이블 today_notes */
export interface TodayNote {
  id: string;
  user_id?: string | null;
  title: string;
  content: string;
  note_type: "SCHEDULE" | "MEMO" | "TASK" | string;
  due_date: string | null;
  linked_notice_id: string;
  linked_kapt_code?: string | null;
  created_at?: string;
  updated_at?: string;
  linked_notice?: LocalOfficialNotice | null;
}

/** 로컬 단지 제휴 이벤트 테이블 local_complex_events */
export interface LocalComplexEvent {
  id: string;
  complex_name: string;
  kapt_code?: string | null;
  district_code: string;
  title: string;
  badge_label?: string | null;
  benefit_summary: string;
  provider_name: string;
  valid_until?: string | null;
  remaining_count?: number;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type VerificationMethod = "APT_I_APP" | "BILL_RECEIPT";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** 입주민 인증 신청 테이블 resident_verifications */
export interface ResidentVerification {
  id?: string;
  event_id?: string | null;
  applicant_name: string;
  phone_number: string;
  verification_method: VerificationMethod;
  proof_image_url?: string | null;
  complex_name: string;
  dong_ho?: string | null;
  status?: VerificationStatus;
  privacy_agreed?: boolean;
  created_at?: string;
}

/** 로컬 단지 이벤트 응모 테이블 local_event_applications */
export interface LocalEventApplication {
  id?: string;
  event_id: string;
  verification_id?: string | null;
  applicant_name: string;
  phone_number: string;
  complex_name: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
  created_at?: string;
}

export type PlatformProductCategory =
  | "INTERIOR"
  | "ELECTRONICS"
  | "COMMERCE"
  | "LIVING";

export type PartnerGrade = "ALL" | "NORMAL" | "VIP" | "EXCLUSIVE";

/** 취급제품 및 메인 롤링 제품 마스터 테이블 platform_products */
export interface PlatformProduct {
  id: string;
  title: string;
  subtitle?: string | null;
  category: PlatformProductCategory | string;
  main_image_url: string;
  is_hero_rolling?: boolean;
  rolling_order?: number;
  is_public?: boolean;
  allowed_categories?: string[];
  min_partner_grade?: PartnerGrade | string;
  price_info?: string | null;
  spec_summary?: string | null;
  contact_phone?: string | null;
  created_at?: string;
  updated_at?: string;
}



