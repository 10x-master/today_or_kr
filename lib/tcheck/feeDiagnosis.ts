// t.체크 소상공인 카드 매출 수수료 진단 — 순수 계산 함수. DB 접근은 API 라우트에서 한다.
//
// 금융위원회가 고시하는 영세·중소가맹점 우대수수료율 구간을 단순화해 참고용으로 사용한다.
// 실제 적용 수수료율은 카드사·업종·결제 방식에 따라 달라질 수 있으므로, 이 진단은
// "과오납 가능성이 있는지" 를 가늠하는 추정치이며 금융기관 실시간 조회를 대체하지 않는다.
import type { TcheckAddonService, TcheckDiagnosisInput, TcheckDiagnosisResult } from "@/types/tcheck";

const MERCHANT_TIERS: Array<{ maxAnnualSalesKrw: number; label: string; legalFeeRatePercent: number }> = [
  { maxAnnualSalesKrw: 300_000_000, label: "영세가맹점 (연매출 3억원 이하)", legalFeeRatePercent: 0.5 },
  { maxAnnualSalesKrw: 500_000_000, label: "중소가맹점 1구간 (연매출 3억~5억원)", legalFeeRatePercent: 1.1 },
  { maxAnnualSalesKrw: 1_000_000_000, label: "중소가맹점 2구간 (연매출 5억~10억원)", legalFeeRatePercent: 1.25 },
  { maxAnnualSalesKrw: 3_000_000_000, label: "중소가맹점 3구간 (연매출 10억~30억원)", legalFeeRatePercent: 1.5 },
];
const GENERAL_MERCHANT_TIER = {
  label: "일반가맹점 (연매출 30억원 초과, 개별 협의 대상 참고 평균)",
  legalFeeRatePercent: 2.0,
};

// 사업자등록번호 체크섬(공개 알고리즘)으로 형식상 유효성만 가볍게 검사한다.
// 국세청 실시간 조회(진위 확인)는 별도 외부 API 연동이 필요해 이번 단계의 스코프를 넘어선다.
export function validateBusinessRegNumber(raw: string): { normalized: string; valid: boolean } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 10) return { normalized: digits, valid: false };

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  const d = digits.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += d[i] * weights[i];
  sum += Math.floor((d[8] * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;

  return { normalized: digits, valid: checkDigit === d[9] };
}

function resolveMerchantTier(annualCardSalesKrw: number): { label: string; legalFeeRatePercent: number } {
  const tier = MERCHANT_TIERS.find((t) => annualCardSalesKrw <= t.maxAnnualSalesKrw);
  return tier
    ? { label: tier.label, legalFeeRatePercent: tier.legalFeeRatePercent }
    : GENERAL_MERCHANT_TIER;
}

export function diagnoseCardFee(input: TcheckDiagnosisInput): TcheckDiagnosisResult {
  const { valid: businessRegNumberValid } = validateBusinessRegNumber(input.businessRegNumber);
  const tier = resolveMerchantTier(input.annualCardSalesKrw);

  const isOvercharged = input.currentFeeRatePercent > tier.legalFeeRatePercent;
  const overchargedAmountKrw = isOvercharged
    ? Math.round((input.annualCardSalesKrw * (input.currentFeeRatePercent - tier.legalFeeRatePercent)) / 100)
    : 0;

  const addons = input.addons ?? [];
  const unnecessaryAddons: TcheckAddonService[] = addons.filter((a) => !a.inUse);
  const addonAnnualSavingsKrw = unnecessaryAddons.reduce((sum, a) => sum + a.monthlyFeeKrw, 0) * 12;

  return {
    businessRegNumberValid,
    merchantTierLabel: tier.label,
    legalFeeRatePercent: tier.legalFeeRatePercent,
    currentFeeRatePercent: input.currentFeeRatePercent,
    isOvercharged,
    overchargedAmountKrw,
    unnecessaryAddons,
    addonAnnualSavingsKrw,
    estimatedRefundKrw: overchargedAmountKrw + addonAnnualSavingsKrw,
  };
}
