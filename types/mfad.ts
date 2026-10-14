/**
 * M-FAD (Merchant Fee Audit & Defense) Geo-Radar Types
 * 가맹점 카드 수수료 정합성 사전 실사 및 GIS 레이더 타입 정의
 */

export type MfadCategory = "HOSPITAL" | "RESTAURANT" | "GYM" | "NEW_STORE";

export type MfadVisitStatus = "UNVISITED" | "ASSIGNED" | "VISITED" | "CONTRACTED" | "REJECTED" | "SCHEDULED";

/** TM CRM 프로젝트 단위 정의 */
export interface CrmProject {
  id: string;
  name: string;
  isDefault?: boolean;
  color?: string;
  targetCount?: number;
}

/** 상담 타임라인 기록 */
export interface CrmConsultRecord {
  id: string;
  date: string;
  text: string;
  result?: string;
}

/** 관리자 vs 로컬 서포터즈 권한 등급 */
export type MfadUserRole = "HQ_ADMIN" | "LOCAL_SUPPORTER";

export interface MfadTargetMetadata {
  /** 3개년 추정 과오납 회수 예상액 (원) */
  estimated_refund: number;
  /** 주 누수 원인 요약 */
  leakage_cause: string;
  /** 상세 진단 내역 */
  leakage_detail: string;
  /** 7대 누수 코드 식별자 (LEAK_01 ~ LEAK_07) */
  primary_leak_code: string;
  /** 사업자등록번호 */
  biz_reg_no: string;
  /** 월평균 카드 매출액 (원) */
  monthly_card_sales: number;
  /** 현재 적용 차감 수수료율 (%) */
  applied_rate: number;
  /** 법정 적정 우대 수수료율 (%) */
  statutory_rate: number;
  /** 연간 누수 추정액 (원) */
  annual_leak_estimate: number;
  /** 3개년 소급 청구액 (원) */
  three_year_recovery: number;
  /** 개업일자 */
  opened_date?: string;
  /** 대표자 직함/성명 */
  representative_title?: string;
  /** 결제 단말기 / PG사 */
  terminal_company?: string;
  /** 키오스크 / 테이블오더 도입 여부 */
  has_kiosk?: boolean;
}

export interface MfadGeoTarget {
  id: string;
  tenant_id?: string | null;
  /** 소속 프로젝트 ID */
  project_id?: string;
  project_name?: string;
  /** 정식 실명 상호 */
  target_name: string;
  /** 정보보호 마스킹 별칭 (예: "역삼 *** 치과의원") */
  masked_name?: string;
  /** 롤오버 호버 시 누수 예측 코멘트 */
  leakage_reason_comment?: string;
  category: MfadCategory;
  road_address: string;
  dong: string;
  district: string; // e.g. "분당구", "강남구", "노원구"
  lat: number;
  lng: number;
  contact_number: string;
  representative_name: string;
  visit_status: MfadVisitStatus;
  assigned_supporter_id?: string | null;
  assigned_supporter_name?: string | null;
  last_visited_at?: string | null;
  visit_notes?: string | null;
  /** TM CRM 관심도/반응도 (0: 거절, 1~5: 점수) */
  interest_rating?: number;
  /** 통화 결과 코드: 부재중 | 재통화요청 | 방문예약 | 계약완료 */
  call_result_code?: string | null;
  /** 방문 상담 예약 일시 */
  scheduled_visit_date?: string | null;
  /** 상담 메모 타임라인 */
  consult_timeline?: CrmConsultRecord[];
  /** 음성 녹음 및 사진 구글 드라이브 백업 링크 */
  google_drive_url?: string | null;
  metadata: MfadTargetMetadata;
  created_at?: string;
  updated_at?: string;
}

/** 상호명 마스킹 헬퍼 함수 */
export function maskTargetName(name: string): string {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length >= 3) {
    return `${parts[0]} *** ${parts[parts.length - 1]}`;
  }
  if (parts.length === 2) {
    const starCount = Math.max(2, parts[1].length - 1);
    return `${parts[0]} ${"*".repeat(starCount)}`;
  }
  if (name.length <= 4) {
    return name.slice(0, 1) + "**" + name.slice(-1);
  }
  return name.slice(0, 2) + "***" + name.slice(-2);
}

/** 7대 누수 코드 항목 정의 */
export interface MfadLeakCodeItem {
  code: string;
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "NORMAL";
}

export const MFAD_LEAK_CODES: MfadLeakCodeItem[] = [
  {
    code: "LEAK_01",
    title: "영세·중소 우대요율 미소급 과오납",
    description: "개업 6개월 미만 신규 사업자에게 일반가맹점 요율(2.0~2.3%)이 적용된 후 우대요율(0.5%) 소급 정산 누락",
    severity: "HIGH",
  },
  {
    code: "LEAK_02",
    title: "키오스크/테이블오더 PG 마크업 중복 가산",
    description: "오프라인 결제임에도 PG(온라인) 수수료 체계가 적용되어 0.8~1.2% 임의 추가 수수료 차감",
    severity: "HIGH",
  },
  {
    code: "LEAK_03",
    title: "다개월 무이자 프로모션 분담금 과다 청구",
    description: "병원/의원 비급여 및 헬스장 연간권 다개월 무이자 할부 시 카드사 행사 분담금 비율 불일치 차감",
    severity: "HIGH",
  },
  {
    code: "LEAK_04",
    title: "배달앱·간편결제 매출 중복 정산 차감",
    description: "네이버페이, 카카오페이 등 간편결제 및 배달앱 주문 매출에 대한 중복 밴(VAN) 수수료 공제",
    severity: "MEDIUM",
  },
  {
    code: "LEAK_05",
    title: "포인트 청구할인 가맹점 정산 지연 및 미수금",
    description: "소비자 카드 청구할인 적용분 중 카드사 전산 미매칭으로 인한 가맹점 입금 누락",
    severity: "MEDIUM",
  },
  {
    code: "LEAK_06",
    title: "밴(VAN) 전표매입 비표준 고정료 부과",
    description: "건당 30~50원 수준의 표준 매입비용을 초과하는 불공정 고정 유지보수료 임의 차감",
    severity: "NORMAL",
  },
  {
    code: "LEAK_07",
    title: "매출 취소분 수수료 미환급 및 정산 오차",
    description: "고객 승인 취소/환불 건에 대해 기차감된 결제대행 수수료가 익월 정산 시 미반영 누락",
    severity: "NORMAL",
  },
];
