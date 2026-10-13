"use client";

import { Eye, MapPin, Sparkles, Star } from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";
import type { LocalCafePlace } from "@/types/local";
import type { LocalComplexEvent } from "@/types/officialNotice";

export interface CompactFeedItemProps {
  notice?: LocalOfficialNotice;
  cafe?: LocalCafePlace;
  event?: LocalComplexEvent;
  onClick: () => void;
  isBookmarked?: boolean;
}

export default function CompactFeedItem({
  notice,
  cafe,
  event,
  onClick,
  isBookmarked = false,
}: CompactFeedItemProps) {
  // 1. 동네 카페인 경우
  if (cafe) {
    return (
      <article
        onClick={onClick}
        className="group relative flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3.5 transition-colors hover:bg-amber-50/30 active:bg-slate-100/70 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 pr-1">
          {/* 상단 뱃지 & 위치 */}
          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-800 border border-amber-200/80">
              <span>☕</span>
              <span>동네카페</span>
            </span>
            <span className="font-semibold text-slate-500">{cafe.dong}</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-0.5 font-bold text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              <span>{cafe.rating.toFixed(1)}</span>
            </span>
          </div>

          {/* 메인 상호명 1줄 */}
          <h3 className="truncate text-[14px] font-bold text-slate-900 group-hover:text-amber-950 leading-snug">
            {cafe.name}
          </h3>

          {/* 혜택 / 시그니처 캡션 */}
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {cafe.discount_benefit ? (
              <span className="truncate font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 text-[11px]">
                🎁 {cafe.discount_benefit}
              </span>
            ) : (
              <span className="truncate text-slate-500 text-[11px]">
                {cafe.signature_menu}
              </span>
            )}
          </div>
        </div>

        {/* 우측 정사각 미니 썸네일 (56x56) */}
        {cafe.image_url && (
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cafe.image_url}
              alt={cafe.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </article>
    );
  }

  // 2. 단지 제휴 이벤트인 경우
  if (event) {
    return (
      <article
        onClick={onClick}
        className="group relative flex items-center justify-between gap-3 border-b border-emerald-100/60 bg-emerald-50/20 px-4 py-3.5 transition-colors hover:bg-emerald-50/40 active:bg-emerald-100/40 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100/80 px-1.5 py-0.5 font-bold text-emerald-800 border border-emerald-200">
              <span>🧾</span>
              <span>단지제휴</span>
            </span>
            <span className="font-semibold text-slate-500">{event.provider_name}</span>
          </div>

          <h3 className="truncate text-[14px] font-bold text-slate-900 group-hover:text-emerald-950 leading-snug">
            {event.title}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded truncate max-w-[140px]">
              {event.badge_label || event.benefit_summary}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 truncate">{event.complex_name}</span>
          </div>
        </div>

        {event.image_url && (
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-100 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </article>
    );
  }

  // 3. 기본 공식 행정 고시 (LocalOfficialNotice)
  if (!notice) return null;

  const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
    label: notice.category,
    icon: "📌",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badgeText: "text-slate-700",
  };

  const formattedDate = notice.publish_date ? notice.publish_date.replace(/-/g, ".") : "";

  return (
    <article
      onClick={onClick}
      className="group relative flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3.5 transition-colors hover:bg-slate-50/70 active:bg-slate-100/70 cursor-pointer select-none"
    >
      <div className="flex-1 min-w-0 pr-1">
        {/* 상단 1행: 카테고리 미니 배지 + 발행처 */}
        <div className="flex items-center gap-1.5 mb-1 text-[11px]">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold border ${meta.badgeBg}`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
          <span className="font-semibold text-slate-600 truncate max-w-[130px] sm:max-w-[200px]">
            {notice.issuing_agency}
          </span>
          {notice.impact_zone && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 truncate max-w-[80px]">
                {notice.impact_zone}
              </span>
            </>
          )}
        </div>

        {/* 메인 제목 1줄 (truncate) */}
        <h3 className="truncate text-[14px] font-bold text-slate-900 group-hover:text-amber-950 leading-snug">
          {notice.title}
        </h3>

        {/* 하단 캡션: 날짜 · 조회수 · 북마크 뱃지 */}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
          <span>{formattedDate}</span>
          {notice.view_count !== undefined && (
            <span className="flex items-center gap-0.5 text-slate-400">
              <Eye className="h-3 w-3" />
              <span>{notice.view_count.toLocaleString()}</span>
            </span>
          )}
          {isBookmarked && (
            <span className="rounded bg-amber-50 px-1 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200">
              t.note 담김
            </span>
          )}
        </div>
      </div>

      {/* 우측 정사각 미니 썸네일 / 카테고리 엠블럼 (56x56) */}
      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-2xl shadow-2xs group-hover:bg-slate-100 transition-colors">
        <span>{meta.icon}</span>
      </div>
    </article>
  );
}
