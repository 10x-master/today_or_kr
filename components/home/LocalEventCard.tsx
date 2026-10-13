"use client";

import { Building2, Calendar, CheckCircle2, ChevronRight, Gift, Sparkles } from "lucide-react";
import type { LocalComplexEvent } from "@/types/officialNotice";

interface LocalEventCardProps {
  event: LocalComplexEvent;
  onSelect: (event: LocalComplexEvent) => void;
  className?: string;
}

export default function LocalEventCard({
  event,
  onSelect,
  className = "",
}: LocalEventCardProps) {
  // D-Day 계산
  const getDDay = (validUntil?: string | null) => {
    if (!validUntil) return null;
    const target = new Date(validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "D-Day";
    if (diffDays > 0) return `D-${diffDays}`;
    return "마감";
  };

  const dDay = getDDay(event.valid_until);

  return (
    <article
      onClick={() => onSelect(event)}
      className={`group cursor-pointer rounded-3xl border-2 border-rose-100/90 bg-gradient-to-br from-rose-50/30 via-[#FFFFFF] to-amber-50/20 p-4.5 shadow-[0_2px_12px_rgba(244,63,94,0.06)] transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)] sm:p-5 ${className}`}
    >
      {/* 1. 상단 배지 라인 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
            <Gift className="h-3.5 w-3.5 text-rose-600" />
            <span>{event.badge_label || "단지 전용 혜택"}</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
            <Building2 className="h-3 w-3 text-slate-500" />
            <span>{event.complex_name} 한정</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 마감일 디데이(D-Day) 배지 */}
          {dDay && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-xs ${
                dDay === "마감"
                  ? "bg-slate-200 text-slate-600"
                  : "bg-rose-600 text-white"
              }`}
            >
              {dDay}
            </span>
          )}

          {event.remaining_count !== undefined && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/80">
              선착순 {event.remaining_count}명 남음
            </span>
          )}
        </div>
      </div>

      {/* 2. 타이틀 */}
      <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 group-hover:text-rose-600 transition-colors sm:text-lg">
        {event.title}
      </h3>

      {/* 3. 혜택 안내 박스 */}
      <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5 text-xs leading-relaxed text-slate-800 space-y-1.5">
        <div className="flex items-start gap-1.5 font-medium text-slate-900">
          <Sparkles className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{event.benefit_summary}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-rose-100/70">
          <span>제휴: {event.provider_name}</span>
          {event.valid_until && (
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3 text-slate-400" />
              {event.valid_until}까지
            </span>
          )}
        </div>
      </div>

      {/* 4. 하단 CTA 배너 & 인증 버튼 */}
      <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          아파트아이 / 관리비 고지서 간편 인증
        </span>

        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-rose-600 transition-colors shadow-xs">
          <span>입주민 인증하고 혜택 받기</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}
