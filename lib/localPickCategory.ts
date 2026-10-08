import type { LocalPickCategory } from "@/types/local";

export const LOCAL_PICK_CATEGORY_LABELS: Record<LocalPickCategory, string> = {
  notice: "지자체 공지",
  festival: "축제/행사",
  spot: "명소/여행",
  food: "특산물/맛집",
  activity: "체험/공방",
  welfare: "안심복지",
  repair: "동네수리",
  business: "소상공인",
};

export const LOCAL_PICK_CATEGORIES = Object.keys(
  LOCAL_PICK_CATEGORY_LABELS
) as LocalPickCategory[];

/** 동네 피드 화면의 카테고리 필터 칩 그룹 */
export type FeedFilterGroup = "all" | "notice" | "welfare" | "culture" | "life";

export const FEED_FILTER_GROUP_LABELS: Record<FeedFilterGroup, string> = {
  all: "전체",
  notice: "지자체 공지",
  welfare: "복지·보건",
  culture: "문화·행사",
  life: "주민생활",
};

export const FEED_FILTER_GROUPS: FeedFilterGroup[] = [
  "all",
  "notice",
  "welfare",
  "culture",
  "life",
];

/** LocalPickCategory -> 피드 필터 칩 그룹 매핑 */
export const CATEGORY_TO_FILTER_GROUP: Record<LocalPickCategory, FeedFilterGroup> = {
  notice: "notice",
  welfare: "welfare",
  festival: "culture",
  activity: "culture",
  spot: "culture",
  food: "life",
  repair: "life",
  business: "life",
};
