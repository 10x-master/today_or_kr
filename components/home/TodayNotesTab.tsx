"use client";

import { Bookmark, BookmarkCheck, Calendar, MapPin, Trash2 } from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";

interface TodayNotesTabProps {
  bookmarkedNotices: LocalOfficialNotice[];
  onSelect: (notice: LocalOfficialNotice) => void;
  onRemoveBookmark: (id: string) => void;
  onNavigateFeed: () => void;
}

export default function TodayNotesTab({
  bookmarkedNotices,
  onSelect,
  onRemoveBookmark,
  onNavigateFeed,
}: TodayNotesTabProps) {
  if (bookmarkedNotices.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Bookmark className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">
          아직 담아둔 티노트가 없습니다
        </h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          동네 피드에서 관심 있는 행정 고시·재개발 팩트를 &apos;티노트 (t.note)에 담기&apos;로 스크랩해보세요.
        </p>
        <button
          type="button"
          onClick={onNavigateFeed}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          동네 피드 보러가기
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              📌 나의 티노트 보관함 ({bookmarkedNotices.length})
            </h2>
            <span className="text-xs font-semibold text-slate-500">(t.note)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            필요할 때 언제든 다시 확인할 수 있는 우리동네 핵심 고시 요약함
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {bookmarkedNotices.map((notice) => {
          const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
            label: notice.category,
            icon: "📌",
            badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
          };

          return (
            <article
              key={notice.id}
              className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-indigo-200 hover:shadow-md transition-all"
              onClick={() => onSelect(notice)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.badgeBg}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBookmark(notice.id);
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  aria-label="보관함에서 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {notice.title}
              </h3>

              {notice.impact_zone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                  <MapPin className="h-3 w-3 shrink-0 text-amber-600" />
                  <span>{notice.impact_zone}</span>
                </p>
              )}

              <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 space-y-1">
                <p>
                  <strong>핵심:</strong> {notice.summary_1}
                </p>
                <p>
                  <strong>일정:</strong> {notice.summary_2}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>{notice.issuing_agency}</span>
                <span>{notice.publish_date}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
