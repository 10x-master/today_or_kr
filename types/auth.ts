/**
 * 카카오 간편가입 및 10단계 추천인(MLM) 계층 관련 타입 정의
 */

export interface UserConsents {
  terms: boolean;
  /** 보험/자동차/부동산/정책자금 등 5대 업종 제휴 리드 동의 */
  thirdPartyFinancialLead: boolean;
}

/** 회원 등급 */
export type MembershipTier = "free" | "association_regular"; // 협회정회원

export interface UserProfile {
  id: string;
  kakaoId: string;
  name: string;
  phone: string;
  email: string;
  registeredDong: string;
  age?: number;
  /** 본인 추천인 코드 (타인이 가입 시 입력하는 코드) */
  referrerCode: string;
  /** 상위 10단계 추천인 ID 배열 (가까운 순 -> 먼 순) */
  pathHierarchy: string[];
  consents: UserConsents;
  membershipTier: MembershipTier;
  /** 10X 상생 기여 포인트 누적 합계 */
  tenXPoints: number;
}

/** 10X 연계 실적 발생 시 단계별 수당 적립 내역 */
export interface CommissionLedgerEntry {
  id: string;
  /** 적립 수혜자(상위 추천인) ID */
  beneficiaryUserId: string;
  /** 실적 발생자 ID */
  sourceUserId: string;
  /** 추천 단계 (1~10) */
  level: number;
  contractAmount: number;
  contractType: string;
  /** 적립액 (contractAmount * 2%) */
  amount: number;
  createdAt: string;
}
