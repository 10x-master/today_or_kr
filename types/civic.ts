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

/** 착한아파트(클린트러스트) 4대 평가 지수 스코어카드 모델 */
export type CleanTrustGrade = "AAA" | "AA" | "A" | "NORMAL";

export interface CleanTrustBreakdown {
  biddingFairness: number;    // 30점 만점 (K-apt CERA 적정가 편차 분석)
  reserveFundHealth: number;  // 25점 만점 (장충금 적립 요율 및 목적외 사용 방어)
  legalCompliance: number;    // 25점 만점 (3년 법정 장기수선계획 정기조정 이행)
  residentEngagement: number; // 20점 만점 (주민 공구 청원/투표 참여율)
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
