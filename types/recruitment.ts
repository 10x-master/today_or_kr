/**
 * 알바 구인구직 ATS, t.sign 전자근로계약, t.check 근태 및 세무 정산 타입 규격
 * (Supabase job_applicants, tsign_contracts, store_workforce, tcheck_logs 100% 호환)
 */

export type AtsPipelineStage = "APPLIED" | "INTERVIEW" | "HIRED" | "ACTIVE" | "REJECTED";

export interface AtsApplicant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  salary_text: string;
  hourly_wage: number;
  stage: AtsPipelineStage;
  intro?: string;
  interview_scheduled_at?: string;
  interview_notes?: string;
  contract_id?: string;
  workforce_id?: string;
  applied_at: string;
}

export type TSignContractStatus = "DRAFT" | "SENT" | "SIGNED" | "EXPIRED";

export interface TSignAuditTrail {
  auth_method: "KAKAO_CERT" | "PASS_CERT" | "PIN";
  ip_address: string;
  signed_at: string;
  cert_serial: string;
}

export interface TSignLaborContract {
  id: string;
  applicant_id: string;
  employer_name: string;
  employer_store: string;
  biz_reg_number: string;
  employee_name: string;
  employee_phone: string;
  hourly_wage: number;
  daily_hours: number;
  weekly_days: number;
  weekly_hours: number;
  is_holiday_pay_eligible: boolean; // 주 15시간 이상 여부
  work_start_date: string;
  work_end_date: string;
  renewal_alert_date: string; // 계약만료 3일 전
  sha256_hash: string;
  status: TSignContractStatus;
  audit_trail?: TSignAuditTrail;
  signature_svg?: string;
  created_at: string;
  updated_at: string;
}

export interface TCheckAttendanceLog {
  id: string;
  workforce_id: string;
  employee_name: string;
  check_type: "CHECK_IN" | "CHECK_OUT";
  checked_at: string;
  distance_meters: number; // 50m 지오펜스 반경 내 실제 거리
  is_geofence_verified: boolean;
  device_name: string;
}

export interface TaxSettlementItem {
  id: string;
  employee_name: string;
  employee_phone: string;
  period: string; // "2026년 10월"
  total_work_hours: number;
  base_pay: number;
  holiday_pay: number; // 주휴수당
  gross_pay: number; // 총 지급액
  income_tax_3pct: number; // 사업소득세 3%
  local_tax_03pct: number; // 지방소득세 0.3%
  total_withholding_tax: number; // 3.3% 원천징수액
  net_pay: number; // 차인지급액 (실수령액)
  store_name: string;
  biz_reg_number: string;
  representative_name: string;
}
