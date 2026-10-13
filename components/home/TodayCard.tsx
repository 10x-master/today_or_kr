"use client";

import { Calendar, Eye, MapPin, Sparkles } from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";

interface TodayCardProps {
  notice: LocalOfficialNotice;
  onSelect: (notice: LocalOfficialNotice) => void;
  viewMode?: "card" | "list";
}

export default function TodayCard({
  notice,
  onSelect,
  viewMode = "card",
}: TodayCardProps) {
  const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
    label: notice.category,
    icon: "📌",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badgeText: "text-slate-700",
    borderColor: "border-slate-300",
  };

  const formattedDate = notice.publish_date.replace(/-/g, ".");

  if (viewMode === "list") {
    // 리스트 전체보기 모드
    return (
      <article
        onClick={() => onSelect(notice)}
        className="group cursor-pointer rounded-xl border border-slate-200/90 bg-[#FFFFFF] p-3.5 transition-all hover:border-slate-300 hover:shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${meta.badgeBg}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
              {notice.issuing_agency}
            </span>
            {notice.notice_no && (
              <span className="font-mono text-[11px] text-slate-400">
                {notice.notice_no}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{formattedDate}</span>
            {notice.view_count !== undefined && (
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {notice.view_count.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <h4 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {notice.title}
        </h4>

        {notice.impact_zone && (
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <MapPin className="h-3 w-3 shrink-0 text-amber-600" />
            <span className="truncate">{notice.impact_zone}</span>
          </p>
        )}

        <p className="mt-1 line-clamp-1 text-xs text-slate-600">
          {notice.summary_1}
        </p>
      </article>
    );
  }

  // 카드 요약보기 모드 (NEWNEEK 스타일 모듈러 카드)
  return (
    <article
      onClick={() => onSelect(notice)}
      className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-[#FFFFFF] p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] sm:p-5"
    >
      {/* 상단 배지 라인 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold ${meta.badgeBg}`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>

          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {notice.issuing_agency}
          </span>

          {notice.notice_no && (
            <span className="hidden font-mono text-[11px] text-slate-400 sm:inline-block">
              {notice.notice_no}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          {notice.view_count !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {notice.view_count.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* 제목 */}
      <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors sm:text-lg">
        {notice.title}
      </h3>

      {/* 영향권 (impact_zone) */}
      {notice.impact_zone && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 text-xs font-semibold text-amber-800">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>영향권: {notice.impact_zone}</span>
        </div>
      )}

      {/* NEWNEEK 스타일 팩트 중심 3줄 요약 박스 */}
      <div className="mt-3.5 space-y-2 rounded-xl bg-slate-50/90 border border-slate-100 p-3.5 text-xs leading-relaxed text-slate-700">
        <div className="flex items-start gap-2">
          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
            1
          </span>
          <div>
            <strong className="text-slate-900 font-semibold">핵심 안건: </strong>
            <span>{notice.summary_1}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            2
          </span>
          <div>
            <strong className="text-slate-900 font-semibold">일정·규모: </strong>
            <span>{notice.summary_2}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            3
          </span>
          <div>
            <strong className="text-slate-900 font-semibold">주민 확인: </strong>
            <span>{notice.summary_3}</span>
          </div>
        </div>
      </div>

      {/* 카드 하단 메타 */}
      <div className="mt-3.5 flex items-center justify-between pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600">
          <Sparkles className="h-3 w-3" />
          <span>터치하여 상세 분석 &amp; 공식 원문 보기</span>
        </div>
        {notice.notice_no && (
          <span className="text-[10px] text-slate-400 sm:hidden">
            {notice.notice_no}
          </span>
        )}
      </div>
    </article>
  );
}
