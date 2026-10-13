import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ReferralWalletSummary,
  CoupangSubIdSettlement,
  BizboardAdRevenue,
  B2BReferralFee,
  ReferralActivityLog,
  PayoutRequest,
} from "@/types/commerce";

const STORAGE_KEY_WALLET = "today_referral_wallet";
const STORAGE_KEY_LOGS = "today_referral_logs";
const STORAGE_KEY_COUPANG = "today_coupang_settlements";
const STORAGE_KEY_PAYOUTS = "today_payout_requests";

// 기본 목데이터: 상계동 엠버서더 142대 PWA 배포자 기준
export const INITIAL_WALLET_SUMMARY: ReferralWalletSummary = {
  userId: "ambassador-01",
  userName: "김민수 엠버서더",
  installedDevicesCount: 142,
  withdrawableAmount: 284000,
  totalAccumulatedAmount: 1450000,
  settledThisMonth: 284000,
  pendingSettlement: 126500,
  lastSettledDate: "2026.10.10",
};

export const INITIAL_COUPANG_SETTLEMENTS: CoupangSubIdSettlement[] = [
  {
    id: "coup-1",
    productTitle: "농심 신라면 120g 20개입 묶음",
    subId: "ref-amb01_sanggye14_shin",
    clicks: 312,
    cartConversions: 48,
    conversionRate: 15.38,
    commissionAmount: 86400,
    status: "CONFIRMED",
    date: "2026.10.13",
  },
  {
    id: "coup-2",
    productTitle: "다우니 섬유유연제 엑스퍼트 실내건조 4L",
    subId: "ref-amb01_sanggye14_downy",
    clicks: 184,
    cartConversions: 29,
    conversionRate: 15.76,
    commissionAmount: 52200,
    status: "CONFIRMED",
    date: "2026.10.12",
  },
  {
    id: "coup-3",
    productTitle: "크리넥스 3겹 데코앤소프트 화장지 30롤",
    subId: "ref-amb01_sanggye14_kleenex",
    clicks: 245,
    cartConversions: 38,
    conversionRate: 15.51,
    commissionAmount: 68400,
    status: "CONFIRMED",
    date: "2026.10.11",
  },
  {
    id: "coup-4",
    productTitle: "제주 삼다수 무라벨 2L x 12병",
    subId: "ref-amb01_sanggye14_water",
    clicks: 290,
    cartConversions: 42,
    conversionRate: 14.48,
    commissionAmount: 45000,
    status: "CONFIRMED",
    date: "2026.10.10",
  },
  {
    id: "coup-5",
    productTitle: "맥케어 초음파식 안심 세척기 다목적 살균 카트리지",
    subId: "ref-amb01_welfare_filter",
    clicks: 95,
    cartConversions: 18,
    conversionRate: 18.95,
    commissionAmount: 32000,
    status: "PENDING",
    date: "2026.10.09",
  },
];

export const INITIAL_BIZBOARD_REVENUES: BizboardAdRevenue[] = [
  {
    id: "ad-1",
    campaignTitle: "노원구 착한세탁소 가을맞이 침구류 특가",
    category: "생활/세탁",
    impressions: 1420,
    clicks: 42,
    ctr: 2.95,
    allocatedAmount: 50400,
    shareRate: 60,
    date: "2026.10.13",
  },
  {
    id: "ad-2",
    campaignTitle: "상계동 온누리약국 환절기 면역 영양제",
    category: "건강/의료",
    impressions: 980,
    clicks: 31,
    ctr: 3.16,
    allocatedAmount: 37200,
    shareRate: 60,
    date: "2026.10.12",
  },
  {
    id: "ad-3",
    campaignTitle: "중계동 입시수학학원 10월 입시설명회",
    category: "교육/학원",
    impressions: 1150,
    clicks: 28,
    ctr: 2.43,
    allocatedAmount: 33600,
    shareRate: 60,
    date: "2026.10.10",
  },
];

export const INITIAL_B2B_FEES: B2BReferralFee[] = [
  {
    id: "b2b-1",
    aptName: "상계주공 14단지",
    itemTitle: "장기수선계획 3년 법정 정기조정 기술사 컨설팅 의결 성사",
    contractAmount: 3000000,
    referralRate: 5,
    feeAmount: 150000,
    status: "COMPLETED",
    date: "2026.10.05",
  },
  {
    id: "b2b-2",
    aptName: "중계그린아파트",
    itemTitle: "단지 승강기 보수자재 공동구매 50가구 성사",
    contractAmount: 2500000,
    referralRate: 3,
    feeAmount: 75000,
    status: "COMPLETED",
    date: "2026.09.28",
  },
  {
    id: "b2b-3",
    aptName: "하계현대아파트",
    itemTitle: "장충금 현실화 주민설득 1장 리포트 컨설팅",
    contractAmount: 1200000,
    referralRate: 5,
    feeAmount: 60000,
    status: "IN_PROGRESS",
    date: "2026.10.11",
  },
];

export const INITIAL_ACTIVITY_LOGS: ReferralActivityLog[] = [
  {
    id: "log-1",
    timestamp: "방금 전",
    deviceLocation: "상계주공 14단지",
    pipelineType: "COUPANG",
    description: "상계주공 14단지 기기에서 쿠팡 1초 담기 발생",
    pointReward: 450,
  },
  {
    id: "log-2",
    timestamp: "12분 전",
    deviceLocation: "중계주공 5단지",
    pipelineType: "BIZBOARD",
    description: "중계주공 5단지 기기에서 64px 비즈보드 광고 클릭",
    pointReward: 60,
  },
  {
    id: "log-3",
    timestamp: "45분 전",
    deviceLocation: "하계현대아파트",
    pipelineType: "B2B_CONSULTING",
    description: "하계현대 기기에서 장충금 주민설득 리포트 견적서 열람",
    pointReward: 100,
  },
  {
    id: "log-4",
    timestamp: "2시간 전",
    deviceLocation: "상계보람아파트",
    pipelineType: "PWA_INSTALL",
    description: "상계보람 PWA 신규 홈 화면 1-Tap 설치 완료 (영구 지분 등록)",
    pointReward: 1000,
  },
  {
    id: "log-5",
    timestamp: "3시간 전",
    deviceLocation: "상계주공 14단지",
    pipelineType: "COUPANG",
    description: "상계주공 14단지 기기에서 '다우니 4L' 장바구니 담기",
    pointReward: 1200,
  },
];

/**
 * 3.3% 원천징수 세액 자동 계산 함수 (사업소득세 3% + 지방소득세 0.3%)
 */
export function calculateWithholdingTax(amount: number) {
  const safeAmount = Math.max(0, Math.floor(amount));
  const incomeTax = Math.floor(safeAmount * 0.03); // 3%
  const localTax = Math.floor(safeAmount * 0.003); // 0.3%
  const totalTax = incomeTax + localTax; // 3.3%
  const netPayoutAmount = safeAmount - totalTax;

  return {
    requestedAmount: safeAmount,
    taxRate: 0.033,
    incomeTax,
    localTax,
    totalTax,
    netPayoutAmount,
  };
}

/**
 * 배포자 지갑 요약 데이터 조회 (LocalStorage + 기본값)
 */
export function getReferralWalletSummary(): ReferralWalletSummary {
  if (typeof window === "undefined") return INITIAL_WALLET_SUMMARY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLET);
    if (raw) {
      return { ...INITIAL_WALLET_SUMMARY, ...JSON.parse(raw) };
    }
  } catch {}
  return INITIAL_WALLET_SUMMARY;
}

/**
 * 쿠팡 SubID 정산 내역 조회
 */
export function getCoupangSettlements(): CoupangSubIdSettlement[] {
  if (typeof window === "undefined") return INITIAL_COUPANG_SETTLEMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUPANG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_COUPANG_SETTLEMENTS;
}

/**
 * 실시간 트래킹 로그 조회
 */
export function getReferralActivityLogs(): ReferralActivityLog[] {
  if (typeof window === "undefined") return INITIAL_ACTIVITY_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_ACTIVITY_LOGS;
}

/**
 * 쿠팡 1초 담기 / 클릭 트래킹 실행
 * - LocalStorage 누적
 * - 실시간 CustomEvent 발생
 * - Supabase 비동기 적립 시도 (pwa_install_referrals / referral_revenue_logs)
 */
export async function trackCoupangClick(options: {
  productId: string;
  productTitle: string;
  subId?: string;
  referrerUserId?: string;
  aptName?: string;
  pointReward?: number;
}) {
  const reward = options.pointReward ?? 450;
  const apt = options.aptName || "단지";

  const newLog: ReferralActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: "방금 전",
    deviceLocation: apt,
    pipelineType: "COUPANG",
    description: `${apt} 기기에서 쿠팡 1초 담기 발생 ('${options.productTitle}')`,
    pointReward: reward,
  };

  if (typeof window !== "undefined") {
    try {
      // 1. 로그 저장
      const existingLogs = getReferralActivityLogs();
      const updatedLogs = [newLog, ...existingLogs.slice(0, 49)];
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));

      // 2. 지갑 잔액 갱신
      const wallet = getReferralWalletSummary();
      const updatedWallet: ReferralWalletSummary = {
        ...wallet,
        withdrawableAmount: wallet.withdrawableAmount + reward,
        totalAccumulatedAmount: wallet.totalAccumulatedAmount + reward,
      };
      localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(updatedWallet));

      // 3. 쿠팡 SubID 내역 갱신
      const settlements = getCoupangSettlements();
      const targetSubId = options.subId || "ref-today_biz";
      const existingIdx = settlements.findIndex(
        (s) => s.productTitle.includes(options.productTitle.slice(0, 10)) || s.subId === targetSubId
      );

      let updatedSettlements = [...settlements];
      if (existingIdx >= 0) {
        const item = updatedSettlements[existingIdx];
        const nextClicks = item.clicks + 1;
        const nextConversions = item.cartConversions + 1;
        updatedSettlements[existingIdx] = {
          ...item,
          clicks: nextClicks,
          cartConversions: nextConversions,
          conversionRate: Number(((nextConversions / nextClicks) * 100).toFixed(2)),
          commissionAmount: item.commissionAmount + reward,
        };
      } else {
        updatedSettlements.unshift({
          id: `coup-${Date.now()}`,
          productTitle: options.productTitle,
          subId: targetSubId,
          clicks: 1,
          cartConversions: 1,
          conversionRate: 100.0,
          commissionAmount: reward,
          status: "PENDING",
          date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        });
      }
      localStorage.setItem(STORAGE_KEY_COUPANG, JSON.stringify(updatedSettlements));

      // 4. 실시간 커스텀 이벤트 전파 (대시보드 즉시 반응)
      window.dispatchEvent(
        new CustomEvent("today_referral_activity", {
          detail: {
            log: newLog,
            wallet: updatedWallet,
            settlements: updatedSettlements,
          },
        })
      );
    } catch (e) {
      console.warn("Failed to persist referral click to localStorage", e);
    }
  }

  // 5. Supabase 비동기 기록 시도 (선택적 영속화)
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from("referral_revenue_logs").insert({
        referrer_id: options.referrerUserId || "ambassador-01",
        pipeline_type: "COUPANG",
        product_id: options.productId,
        product_title: options.productTitle,
        sub_id: options.subId,
        reward_amount: reward,
        device_location: apt,
        created_at: new Date().toISOString(),
      });
    }
  } catch {
    // Supabase 미설정 또는 오류 시에도 UI는 정상 동작 유지
  }

  return newLog;
}

/**
 * 출금 신청 처리
 */
export async function submitPayoutRequest(params: {
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  taxIdType: "RESIDENT_ID" | "BUSINESS_ID";
  taxId: string;
}): Promise<PayoutRequest> {
  const tax = calculateWithholdingTax(params.amount);

  const request: PayoutRequest = {
    id: `payout-${Date.now()}`,
    userId: params.userId,
    requestedAmount: tax.requestedAmount,
    taxRate: tax.taxRate,
    incomeTax: tax.incomeTax,
    localTax: tax.localTax,
    totalTax: tax.totalTax,
    netPayoutAmount: tax.netPayoutAmount,
    bankName: params.bankName,
    accountNumber: params.accountNumber,
    accountHolder: params.accountHolder,
    taxIdType: params.taxIdType,
    taxIdMasked:
      params.taxIdType === "RESIDENT_ID"
        ? `${params.taxId.slice(0, 6)}-*******`
        : `${params.taxId.slice(0, 3)}-**-*****`,
    status: "REQUESTED",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      // 출금 목록 저장
      const raw = localStorage.getItem(STORAGE_KEY_PAYOUTS);
      const list: PayoutRequest[] = raw ? JSON.parse(raw) : [];
      list.unshift(request);
      localStorage.setItem(STORAGE_KEY_PAYOUTS, JSON.stringify(list));

      // 지갑 잔액 차감
      const wallet = getReferralWalletSummary();
      const updatedWallet: ReferralWalletSummary = {
        ...wallet,
        withdrawableAmount: Math.max(0, wallet.withdrawableAmount - tax.requestedAmount),
      };
      localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(updatedWallet));

      // 이벤트 전파
      window.dispatchEvent(
        new CustomEvent("today_payout_submitted", {
          detail: { request, wallet: updatedWallet },
        })
      );
    } catch (e) {
      console.warn("Failed to save payout request", e);
    }
  }

  return request;
}
