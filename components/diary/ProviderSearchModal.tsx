"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Plus, Search, X } from "lucide-react";
import type { DiaryBrand, DiaryProviderType } from "@/types/diary";

const CATEGORY_LABELS: Record<DiaryProviderType, string> = {
  ENTERPRISE: "🏢 기업/인쇄",
  LOCAL_BIZ: "🏪 지역 소상공인",
  PUBLIC: "🏛️ 지자체/공공",
  CREATOR: "🎬 크리에이터",
};

export default function ProviderSearchModal({
  isOpen,
  onClose,
  subscribedIds,
  onToggleSubscribe,
}: {
  isOpen: boolean;
  onClose: () => void;
  subscribedIds: string[];
  onToggleSubscribe: (brand: DiaryBrand) => void;
}) {
  const [providers, setProviders] = useState<DiaryBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<DiaryProviderType | "ALL">("ALL");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/t-diary/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const regionOptions = useMemo(() => {
    const regions = Array.from(new Set(providers.map((p) => p.region_code).filter((r): r is string => !!r)));
    return regions;
  }, [providers]);

  const filteredProviders = providers.filter((p) => {
    if (regionFilter !== "ALL" && p.region_code !== regionFilter) return false;
    if (categoryFilter !== "ALL" && p.provider_type !== categoryFilter) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="flex items-center gap-1.5 pr-6 text-base font-black text-slate-900">
          <Search className="h-4 w-4 text-blue-600" />
          제공자 탐색 / 구독
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          승인 완료된 제공자만 검색 결과에 노출됩니다. 구독하면 내 다이어리 캘린더에 자동으로 일정이 표시돼요.
        </p>

        {/* 카테고리 필터 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              categoryFilter === "ALL" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            전체
          </button>
          {(Object.keys(CATEGORY_LABELS) as DiaryProviderType[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                categoryFilter === cat ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 지역 필터 */}
        {regionOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setRegionFilter("ALL")}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                regionFilter === "ALL" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              전체 지역
            </button>
            {regionOptions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setRegionFilter(region)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  regionFilter === region ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                📍 {region}
              </button>
            ))}
          </div>
        )}

        {/* 제공자 목록 */}
        <div className="mt-4 space-y-2">
          {loading && <p className="text-center text-xs text-slate-300 py-6">불러오는 중...</p>}

          {!loading && filteredProviders.length === 0 && (
            <p className="text-center text-xs text-slate-300 py-6">조건에 맞는 제공자가 없습니다.</p>
          )}

          {filteredProviders.map((p) => {
            const isSubscribed = subscribedIds.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt={p.brand_name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    {p.brand_name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">{p.brand_name}</span>
                    {p.approval_status === "CONDITIONAL" && (
                      <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                        조건부 승인
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{CATEGORY_LABELS[p.provider_type]}</span>
                    <span>·</span>
                    <span>{p.region_code || "전국"}</span>
                    {p.youtube_channel && (
                      <a
                        href={p.youtube_channel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-rose-500 hover:text-rose-600"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        채널
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSubscribe(p)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    isSubscribed ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>구독중</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>구독</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
