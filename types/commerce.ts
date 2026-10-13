/**
 * 링크픽형 제휴 커머스 & 착한소비 펀딩 관련 타입 정의
 */

/** 상품 유형 */
export type ProductType =
  | "coupang_affiliate"
  | "local_specialty" // 반건조생선 등 지역 특산물
  | "welfare_device"; // 초음파세척기/맥케어 등 복지기기

/** 가격 노출 방식 */
export type PriceDisplayMode =
  | "show_price"
  | "lowest_price_btn"
  | "special_deal_btn";

export interface LinkPickProduct {
  id: string;
  sellerId: string;
  productType: ProductType;
  title: string;
  price?: number;
  priceDisplayMode: PriceDisplayMode;
  originalUrl: string;
  affiliateUrl: string;
  thumbnail: string;
  /** 착한소비 건당 기부 적립금 */
  donationPerSale?: number;
}

/** 복지기기 수혜 대상 */
export type BeneficiaryDevice = "mckare" | "ultrasonic_washer";

export interface DonationCompletedReport {
  id: string;
  /** 투명 설치 인증 리포트 번호 (예: "제18호") */
  reportNo: string;
  title: string;
  installDate: string;
  photoUrl: string;
  /** 설치를 수행한 협회 대리점 바이라인 */
  byline: string;
}

/** 목표 금액 달성 시 생성되는 설치 예정 알림 */
export interface InstallScheduledNotice {
  message: string;
  scheduledDevice: BeneficiaryDevice;
  notifiedAt: string;
}

export interface DonationCampaign {
  id: string;
  targetRegion: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  beneficiaryDevice: BeneficiaryDevice;
  completedReports: DonationCompletedReport[];
  /** targetAmount 도달 여부 */
  isAchieved: boolean;
  /** 목표 금액 도달 시점에 생성되는 설치 예정 알림 */
  installNotice?: InstallScheduledNotice;
}

/** ==========================================
 * PWA 배포자 수익 지갑 & 제휴 파이프라인 정산 규격
 * ========================================== */

/** 배포자 디지털 영토 및 수익 요약 */
export interface ReferralWalletSummary {
  userId: string;
  userName: string;
  /** 누적 홈 화면 설치 기기 (PWA 영구 지분) */
  installedDevicesCount: number;
  /** 이번 달 출금 가능 적립금 */
  withdrawableAmount: number;
  /** 총 누적 리워드 */
  totalAccumulatedAmount: number;
  /** 이번 달 정산 완료액 */
  settledThisMonth: number;
  /** 정산 대기(익월 이월) 예정액 */
  pendingSettlement: number;
  /** 마지막 정산 기준일 */
  lastSettledDate: string;
}

/** 1) 쿠팡 파트너스 SubID 정산 항목 */
export interface CoupangSubIdSettlement {
  id: string;
  productTitle: string;
  subId: string;
  clicks: number;
  cartConversions: number;
  conversionRate: number;
  commissionAmount: number;
  status: "CONFIRMED" | "PENDING";
  date: string;
}

/** 2) 64px 비즈보드 광고 클릭/배분금 */
export interface BizboardAdRevenue {
  id: string;
  campaignTitle: string;
  category: string;
  impressions: number;
  clicks: number;
  ctr: number;
  allocatedAmount: number;
  shareRate: number; // 기본 60%
  date: string;
}

/** 3) B2B 견적/발주 리퍼럴 피 */
export interface B2BReferralFee {
  id: string;
  aptName: string;
  itemTitle: string;
  contractAmount: number;
  referralRate: number; // 3~5%
  feeAmount: number;
  status: "COMPLETED" | "IN_PROGRESS";
  date: string;
}

/** 실시간 활동 트래킹 로그 */
export interface ReferralActivityLog {
  id: string;
  timestamp: string;
  deviceLocation: string;
  pipelineType: "COUPANG" | "BIZBOARD" | "B2B_CONSULTING" | "PWA_INSTALL";
  description: string;
  pointReward: number;
}

/** 3.3% 원천징수 출금 신청 모델 */
export interface PayoutRequest {
  id: string;
  userId: string;
  requestedAmount: number;
  taxRate: number; // 0.033
  incomeTax: number; // 3%
  localTax: number; // 0.3%
  totalTax: number; // 3.3%
  netPayoutAmount: number; // 실지급액
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  taxIdType: "RESIDENT_ID" | "BUSINESS_ID";
  taxIdMasked: string;
  status: "REQUESTED" | "PROCESSING" | "COMPLETED";
  createdAt: string;
}

