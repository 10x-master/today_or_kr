/**
 * Today 비즈 홈 (아파트 / 상점 / 기업) 및 소유권 이전 (Claim) 타입 정의
 */

export type BizType = "APT" | "STORE" | "CORP";

export type BizClaimStatus = "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED";

export interface AptPublicInfo {
  complexName: string;         // 단지명 (예: 상계주공 14단지)
  householdCount: number;      // 세대수 (예: 1188)
  approvalDate: string;        // 사용승인일 (예: 1989.11.24)
  hallwayType: string;         // 복도유형 (복도식 / 계단식)
  heatingType: string;         // 난방방식 (지역난방 / 개별난방)
  address: string;             // 도로명주소
  dong: string;                // 법정/행정동
  ceraScore: number;           // CERA 투명도 지수 (예: 94점)
  ceraGrade: "AAA" | "AA" | "A";
  nextRepairInspection: string; // 3년 정기조정 대상 (예: 2026.12)
}

export interface StorePublicInfo {
  storeName: string;           // 상호명 (예: 노원 로스터리 상계점)
  openDate: string;            // 개업일자 (예: 2021.04.15)
  category: string;            // 업종 (예: 요식업·스페셜티 카페)
  address: string;             // 도로명주소
  dong: string;                // 법정/행정동
  licenseNo?: string;          // 인허가 번호
  representativeName?: string; // 대표자 성명
}

export interface BizHomeData {
  id: string;                  // bizId (예: apt-sanggye14, store-nowon-roastery)
  bizType: BizType;
  title: string;
  claimStatus: BizClaimStatus;
  claimedBy?: {
    userId: string;
    name: string;
    role: string;
    claimedAt: string;
  };
  aptInfo?: AptPublicInfo;
  storeInfo?: StorePublicInfo;
  recentNews: Array<{
    id: string;
    title: string;
    source: string;
    date: string;
    url: string;
    summary: string;
  }>;
  portfolioNotes?: Array<{
    id: string;
    title: string;
    date: string;
    tag: string;
    summary: string;
  }>;
}

export interface BizClaimRequest {
  id: string;
  bizId: string;
  bizTitle: string;
  bizType: BizType;
  applicantName: string;
  applicantRole: "REPRESENTATIVE" | "MANAGER" | "COUNCIL" | "AGENT";
  applicantPhone: string;
  applicantEmail: string;
  proofDocumentName?: string;
  proofDocumentUrl?: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
