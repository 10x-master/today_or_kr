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
