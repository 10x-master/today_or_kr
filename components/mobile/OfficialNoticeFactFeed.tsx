"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  LocalOfficialNotice,
  OfficialNoticeCategory,
} from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";

interface OfficialNoticeFactFeedProps {
  districtCode: string;
  dongName: string;
}

export default function OfficialNoticeFactFeed({
  districtCode,
  dongName,
}: OfficialNoticeFactFeedProps) {
  const [notices, setNotices] = useState<LocalOfficialNotice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    OfficialNoticeCategory | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const url = `/api/official-notices?district_code=${encodeURIComponent(
      districtCode
    )}${selectedCategory !== "ALL" ? `&category=${selectedCategory}` : ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.notices) {
          setNotices(data.notices);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch official notices:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [districtCode, selectedCategory]);

  const handleCopy = (notice: LocalOfficialNotice) => {
    const text = `[${notice.issuing_agency}] ${notice.title}\n📍 구역: ${notice.impact_zone || "관내"}\n🔗 원문: ${notice.official_link}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(notice.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const categories: (OfficialNoticeCategory | "ALL")[] = [
    "ALL",
    "REDEVELOP",
    "INFRA",
    "COUNCIL",
    "FESTIVAL",
    "SUBSIDY",
  ];

  return (
    <section className="mb-6 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 via-white to-white p-4 shadow-sm transition-all sm:p-5">
      {/* 섹션 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                공식 행정 고시 &amp; 인프라 팩트 피드
              </h3>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="h-3 w-3" />
                원문 검증
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {dongName} 기준 지자체·국토부·의회 공식 고시 및 재개발 사업 팩트체크
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-800">{notices.length}건</span>
          <span>공고</span>
        </div>
      </div>

      {/* 카테고리 필터 칩 */}
      <div className="no-scrollbar -mx-1 mt-3 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const label =
            cat === "ALL"
              ? "전체 팩트"
              : `${OFFICIAL_NOTICE_CATEGORIES[cat].icon} ${OFFICIAL_NOTICE_CATEGORIES[cat].label}`;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="py-8 text-center text-xs text-slate-400">
          공식 행정 고시 데이터를 확인하는 중...
        </div>
      )}

      {/* 비어있음 상태 */}
      {!loading && notices.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400">
          선택한 카테고리의 고시·공고 데이터가 없습니다.
        </div>
      )}

      {/* 팩트 카드 목록 */}
      {!loading && notices.length > 0 && (
        <div className="mt-3.5 space-y-3.5">
          {notices.map((notice) => {
            const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category];

            return (
              <article
                key={notice.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-slate-300 hover:shadow-md"
              >
                {/* 상단 메타 라인 */}
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
                      <span className="hidden font-mono text-[11px] text-slate-400 sm:inline-block">
                        {notice.notice_no}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>{notice.publish_date}</span>
                  </div>
                </div>

                {/* 타이틀 */}
                <h4 className="mt-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors sm:text-base">
                  {notice.title}
                </h4>

                {/* 영향 구역/단지명 */}
                {notice.impact_zone && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>직접 영향 구역: {notice.impact_zone}</span>
                  </div>
                )}

                {/* 3단 팩트 브리핑 박스 */}
                <div className="mt-3 space-y-2 rounded-lg bg-slate-50/90 border border-slate-100 p-3 text-xs leading-relaxed text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900 font-semibold">핵심 결정: </strong>
                      <span>{notice.summary_1}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900 font-semibold">일정·규모: </strong>
                      <span>{notice.summary_2}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900 font-semibold">주민 확인: </strong>
                      <span>{notice.summary_3}</span>
                    </div>
                  </div>
                </div>

                {/* 카드 하단 액션 바 */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    <a
                      href={notice.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <span>공식 원문 바로가기</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(notice)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {copiedId === notice.id ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3 w-3" />
                          <span>공유·복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  {notice.notice_no && (
                    <span className="text-[10px] text-slate-400 sm:hidden">
                      {notice.notice_no}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
