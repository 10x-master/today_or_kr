/**
 * t.세일즈(/t-sales) 지도 기반 TM·CRM 타입 정의 — DB 테이블 tsales_leads / tsales_activity_logs 매핑.
 * 신규 테이블이라 t.싸인/t.체크처럼 선행 스키마와의 충돌은 없다 — 처음부터 테넌트 없이도
 * 혼자 쓸 수 있는 독립 구조(created_by_user_id 기준)로 설계했다.
 */

export type TsalesLeadStatus = "UNCONTACTED" | "IN_PROGRESS" | "CONTRACTED" | "REJECTED";

export const TSALES_STATUS_LABEL: Record<TsalesLeadStatus, string> = {
  UNCONTACTED: "미접촉",
  IN_PROGRESS: "상담중",
  CONTRACTED: "계약체결",
  REJECTED: "거절",
};

// 지도 핀 컬러 코딩 — 상태별로 고정된 색상을 프론트엔드와 공유한다.
export const TSALES_STATUS_PIN_COLOR: Record<TsalesLeadStatus, string> = {
  UNCONTACTED: "#94A3B8",
  IN_PROGRESS: "#F59E0B",
  CONTRACTED: "#10B981",
  REJECTED: "#F43F5E",
};

export interface TsalesProposalItem {
  name: string;
  qty: number;
  unitPriceKrw: number;
}

export interface TsalesLead {
  id: string;
  tenant_id?: string | null;
  created_by_user_id?: string | null;
  business_name: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  status: TsalesLeadStatus;
  memo?: string | null;
  estimated_deal_value_krw?: number | null;
  proposal_items?: TsalesProposalItem[];
  tsign_contract_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type TsalesActivityType =
  | "CALL"
  | "VISIT"
  | "NOTE"
  | "STATUS_CHANGE"
  | "PROPOSAL_SENT"
  | "SIGN_REQUESTED";

export const TSALES_ACTIVITY_LABEL: Record<TsalesActivityType, string> = {
  CALL: "전화 상담",
  VISIT: "현장 방문",
  NOTE: "메모",
  STATUS_CHANGE: "상태 변경",
  PROPOSAL_SENT: "제안서 발송",
  SIGN_REQUESTED: "전자계약 요청",
};

export interface TsalesActivityLog {
  id: string;
  lead_id: string;
  user_id?: string | null;
  activity_type: TsalesActivityType;
  content?: string | null;
  created_at?: string;
}

export interface TsalesRouteStop {
  leadId: string;
  businessName: string;
  lat: number;
  lng: number;
  order: number;
  legDistanceMeters: number;
  cumulativeDistanceMeters: number;
}
