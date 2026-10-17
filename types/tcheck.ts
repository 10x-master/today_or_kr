/**
 * t.체크(/t-check) 소상공인 카드 매출 수수료 진단 타입 정의 — DB 테이블 tcheck_logs 매핑.
 * tcheck_logs는 원래 근태/순찰(GPS·QR·NFC 체크인) 기록용으로 설계되었으나,
 * 수수료 진단 결과도 "현장에서 발생한 체크 기록"의 한 종류로 보고 같은 테이블에 적재한다
 * (check_type = 'CARD_FEE_DIAGNOSIS'). 자세한 컬럼 확장은
 * supabase/migrations/20261028120000_tcheck_fee_diagnosis.sql 참고.
 */

export interface TcheckAddonService {
  name: string;
  monthlyFeeKrw: number;
  inUse: boolean;
}

export interface TcheckDiagnosisInput {
  businessRegNumber: string;
  storeName?: string;
  annualCardSalesKrw: number;
  currentFeeRatePercent: number;
  addons?: TcheckAddonService[];
}

export interface TcheckDiagnosisResult {
  businessRegNumberValid: boolean;
  merchantTierLabel: string;
  legalFeeRatePercent: number;
  currentFeeRatePercent: number;
  isOvercharged: boolean;
  overchargedAmountKrw: number;
  unnecessaryAddons: TcheckAddonService[];
  addonAnnualSavingsKrw: number;
  estimatedRefundKrw: number;
}

export type TcheckCheckType =
  | "CHECK_IN"
  | "CHECK_OUT"
  | "BREAK_START"
  | "BREAK_END"
  | "PATROL_WAYPOINT"
  | "CARD_FEE_DIAGNOSIS";

export interface TcheckLog {
  id: string;
  tenant_id?: string | null;
  workforce_id?: string | null;
  created_by_user_id?: string | null;
  user_id?: string | null;
  check_type: TcheckCheckType;
  verification_method?: string;
  checked_at: string;
  notes?: string | null;
  business_reg_number?: string | null;
  store_name?: string | null;
  annual_card_sales_krw?: number | null;
  current_fee_rate_percent?: number | null;
  legal_fee_rate_percent?: number | null;
  overcharged_amount_krw?: number | null;
  unnecessary_addons?: TcheckAddonService[];
  addon_annual_savings_krw?: number | null;
  estimated_refund_krw?: number | null;
  created_at?: string;
}
