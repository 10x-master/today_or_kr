/**
 * t.싸인(/t-sign) 음성 조판 전자계약 타입 정의 — DB 테이블 tsign_contracts 매핑.
 * TSignContractEngine(음성/통화 녹음 → AI 파싱 → 표준계약서 선택 → 전자 체결 → 전자보관함)의
 * 백엔드 영속화 계층.
 */

export type TsignContractType =
  | "LABOR_STANDARD"
  | "LABOR_PART_TIME"
  | "CLINIC_CONSENT"
  | "SECURITY_PLEDGE"
  | "NDA"
  | "B2B_SUPPLY"
  | "OUTSOURCING";

export type TsignContractStatus = "DRAFT" | "SENT" | "SIGNED" | "EXPIRED" | "REVOKED";

export type TsignIdentityProvider = "KAKAO" | "NAVER" | "NONE";
export type TsignIdentityStatus = "PENDING" | "VERIFIED" | "FAILED";

export interface TsignAiParsedFields {
  partyA: string;
  partyB: string;
  rate: string;
  period: string;
  workScope: string;
}

export interface TsignContract {
  id: string;
  tenant_id?: string | null;
  workforce_id?: string | null;
  created_by_user_id?: string | null;
  contract_type: TsignContractType;
  title: string;
  employer_name: string;
  employer_sign_svg?: string | null;
  employer_signed_at?: string | null;
  employee_name: string;
  employee_phone: string;
  employee_sign_svg?: string | null;
  employee_signed_at?: string | null;
  contract_body: Record<string, unknown>;
  contract_pdf_url?: string | null;
  sha256_hash: string;
  status: TsignContractStatus;
  effective_start_date: string;
  effective_end_date?: string | null;
  source_audio_url?: string | null;
  ai_parsed_fields?: TsignAiParsedFields | Record<string, never>;
  identity_verify_provider?: TsignIdentityProvider;
  identity_verify_status?: TsignIdentityStatus;
  vault_stored_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
