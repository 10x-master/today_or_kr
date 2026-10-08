import type { CivicCategory } from "@/types/civic";

export const CIVIC_CATEGORY_ICONS: Record<CivicCategory, string> = {
  행정복지: "🏛️",
  문화체육: "🎭",
  생활안전: "🚨",
  주민소식: "📰",
};

/** 3열 신문형 레이아웃에서 어느 컬럼에 속하는지 */
export type CivicColumn = 1 | 2 | 3;

export const CIVIC_CATEGORY_COLUMN: Record<CivicCategory, CivicColumn> = {
  행정복지: 1,
  생활안전: 1,
  문화체육: 2,
  주민소식: 3,
};

export const CIVIC_COLUMN_TITLES: Record<CivicColumn, string> = {
  1: "🏛️ 지자체 행정·복지·보건",
  2: "🎭 문화·행사·평생교육",
  3: "👥 동네 소식·모임·상생",
};
