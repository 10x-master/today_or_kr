import type { AuthorRole } from "@/types/local";

export const AUTHOR_ROLE_LABELS: Record<AuthorRole, string> = {
  gov: "지자체·공공기관",
  ngo: "시민·사회단체",
  biz: "기업·소상공인",
  club: "동호회·소모임",
  user: "개인·주민",
};

/** 역할별 테마 컬러 (배경 없이 텍스트/테두리로만 표현) */
export const AUTHOR_ROLE_TEXT_CLASS: Record<AuthorRole, string> = {
  gov: "text-blue-700",
  ngo: "text-emerald-700",
  biz: "text-indigo-700",
  club: "text-amber-600",
  user: "text-slate-700",
};
