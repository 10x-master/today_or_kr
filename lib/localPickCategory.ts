import type { LocalPickCategory } from "@/types/local";

/** 채널 아이콘 (이모지) */
export const LOCAL_PICK_CATEGORY_ICONS: Record<LocalPickCategory, string> = {
  notice: "📢",
  meetup: "👥",
  talk: "☕",
  flash: "⚡",
  tip: "💡",
};

/** 채널 라벨 (아이콘 없이, 카드/select 등에서 사용) */
export const LOCAL_PICK_CATEGORY_LABELS: Record<LocalPickCategory, string> = {
  notice: "지자체·공지",
  meetup: "동네소모임·클럽",
  talk: "자유토크·잡담",
  flash: "번개·나눔",
  tip: "동네질문·꿀팁",
};

export const LOCAL_PICK_CATEGORIES = Object.keys(
  LOCAL_PICK_CATEGORY_LABELS
) as LocalPickCategory[];

/** 상단 채널 탭 바에서 사용하는 필터 값 ("전체" + 5개 채널) */
export type FeedChannelFilter = "all" | LocalPickCategory;

export const FEED_CHANNEL_FILTERS: FeedChannelFilter[] = ["all", ...LOCAL_PICK_CATEGORIES];

/** 탭 바 라벨 (아이콘 포함) */
export const FEED_CHANNEL_TAB_LABELS: Record<FeedChannelFilter, string> = {
  all: "전체",
  notice: `${LOCAL_PICK_CATEGORY_ICONS.notice} ${LOCAL_PICK_CATEGORY_LABELS.notice}`,
  meetup: `${LOCAL_PICK_CATEGORY_ICONS.meetup} ${LOCAL_PICK_CATEGORY_LABELS.meetup}`,
  talk: `${LOCAL_PICK_CATEGORY_ICONS.talk} ${LOCAL_PICK_CATEGORY_LABELS.talk}`,
  flash: `${LOCAL_PICK_CATEGORY_ICONS.flash} ${LOCAL_PICK_CATEGORY_LABELS.flash}`,
  tip: `${LOCAL_PICK_CATEGORY_ICONS.tip} ${LOCAL_PICK_CATEGORY_LABELS.tip}`,
};
