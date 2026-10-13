import type { Region } from "@/types/local";

/** 지자체 공식 고시공고/새소식 분류 */
export type CivicCategory = "행정복지" | "문화체육" | "생활안전" | "주민소식";

/** 지자체 공식 고시공고/새소식 (실제 구청·시청 게시판 원문 기반) */
export interface CivicNotice {
  id: string;
  region: Region;
  category: CivicCategory;
  /** 원문 제목 */
  title: string;
  /** 발행 부서 */
  department: string;
  /** 실제 게시일 (ISO) */
  publishedAt: string;
  /** 구청/시청 공식 원문 링크 */
  originUrl: string;
}

/** 공동주택 안심 케어 & 자산 수호 진단 스코어카드 모델 */
export type CleanTrustGrade = "AAA" | "AA" | "A" | "CARE" | "NORMAL";

export interface CleanTrustBreakdown {
  biddingFairness: number;    // K-apt 실거래 예산 적정성 (30점 기준)
  reserveFundHealth: number;  // 미래 대규모 수선 준비도 (25점 기준)
  legalCompliance: number;    // 지자체 행정 점검 안심도 (25점 기준)
  residentEngagement: number; // 입주민 상생 소통 지수 (20점 기준)
}

export interface CleanTrustScoreCard {
  apartmentName: string;
  totalScore: number; // 100점 만점, 예: 94
  grade: CleanTrustGrade;
  breakdown: CleanTrustBreakdown;
  statusMessage: string;
  certified?: boolean; // 85점 이상 시 공인 인증 단지
  updatedAt?: string;
}
