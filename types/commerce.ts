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
