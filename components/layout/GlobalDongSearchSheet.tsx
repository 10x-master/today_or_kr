"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Eye,
  MapPin,
  Plus,
  Search,
  Sparkles,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import { DEMO_REGIONS } from "@/lib/demoRegions";
import {
  addDongPin,
  getUserDongPins,
  isSuperAdmin,
  getMaxSlotsForScore,
} from "@/lib/dong/pinManager";

interface GlobalDongSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthProfile | null;
  onSelectDong: (dong: string) => void;
}

const POPULAR_DONGS = [
  { dong: "상계동", sido: "서울", gugun: "노원구" },
  { dong: "중계동", sido: "서울", gugun: "노원구" },
  { dong: "하계동", sido: "서울", gugun: "노원구" },
  { dong: "공릉동", sido: "서울", gugun: "노원구" },
  { dong: "월계동", sido: "서울", gugun: "노원구" },
  { dong: "돌산읍", sido: "전남", gugun: "여수시" },
];

export default function GlobalDongSearchSheet({
  isOpen,
  onClose,
  currentUser,
  onSelectDong,
}: GlobalDongSearchSheetProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pinnedDongNames, setPinnedDongNames] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const superAdmin = isSuperAdmin(currentUser);

  useEffect(() => {
    if (isOpen) {
      const pins = getUserDongPins(currentUser?.id || "guest");
      setPinnedDongNames(pins.map((p) => p.dong_name));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setFeedback(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // 동네 이름 정규화 ('상계' -> '상계동')
  const normalizeDong = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return "";
    if (!trimmed.endsWith("동") && !trimmed.endsWith("읍") && !trimmed.endsWith("면") && !trimmed.endsWith("리")) {
      return `${trimmed}동`;
    }
    return trimmed;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = normalizeDong(query);
    if (!target) return;

    if (superAdmin) {
      // 최고관리자는 즉시 전역 이동
      onSelectDong(target);
      onClose();
      router.push(`/${encodeURIComponent(target)}`);
    } else {
      // 일반 유저는 둘러보기 이동
      handleBrowse(target);
    }
  };

  // 1. 읽기 전용 둘러보기
  const handleBrowse = (targetDong: string) => {
    onSelectDong(targetDong);
    onClose();
    router.push(`/${encodeURIComponent(targetDong)}?mode=browse`);
  };

  // 2. 내 동네 핀에 추가
  const handleAddPin = (targetDong: string) => {
    const res = addDongPin(targetDong, currentUser);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      const updated = getUserDongPins(currentUser?.id || "guest");
      setPinnedDongNames(updated.map((p) => p.dong_name));
      onSelectDong(targetDong);
      setTimeout(() => {
        onClose();
        router.push(`/${encodeURIComponent(targetDong)}`);
      }, 1200);
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const searchedClean = normalizeDong(query);
  const matchedDemoRegions = query
    ? DEMO_REGIONS.filter(
        (r) =>
          r.dong.includes(query) ||
          r.gugun.includes(query) ||
          r.sido.includes(query)
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* 바깥 딤 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 바텀시트 컨테이너 (max-w-md 모바일 컨테이너) */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* 상단 드래그 핸들 */}
        <div className="pt-2.5 pb-1 flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 피드백 알림 배너 */}
        {feedback && (
          <div
            className={`mx-4 my-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 ${
              feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900">
                {superAdmin ? "전국 동네 전역 검색" : "동네 검색 & 둘러보기"}
              </h2>
              {superAdmin && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300">
                  <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />
                  <span>최고관리자 프리패스</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {superAdmin
                ? "제한 없이 전국 어떤 동네든 즉시 탐색하고 관리할 수 있습니다."
                : "타 지역 소식을 둘러보거나 내 동네 핀 슬롯에 추가하세요."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색 입력 폼 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-amber-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="동네 이름을 검색하세요 (예: 상계동, 역삼동)"
              autoFocus
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* 검색 결과 및 추천 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 입력한 동네에 대한 직접 액션 카드 */}
          {query.trim().length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {searchedClean}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {pinnedDongNames.includes(searchedClean)
                        ? "내 동네 핀에 이미 등록되어 있습니다."
                        : "입력하신 동네로 바로 이동하거나 핀으로 등록할 수 있습니다."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                {superAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDong(searchedClean);
                      onClose();
                      router.push(`/${encodeURIComponent(searchedClean)}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-700 active:scale-[0.98] transition-all"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    <span>최고관리자 즉시 접근</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBrowse(searchedClean)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>둘러보기 (읽기전용)</span>
                    </button>

                    {!pinnedDongNames.includes(searchedClean) ? (
                      <button
                        type="button"
                        onClick={() => handleAddPin(searchedClean)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-400" />
                        <span>내 핀에 추가</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDong(searchedClean);
                          onClose();
                          router.push(`/${encodeURIComponent(searchedClean)}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 active:scale-[0.98] transition-all shadow-2xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>이 동네 피드로 이동</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 추천 / 인기 행정동 목록 */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 mb-2 px-1">
              {query ? "매칭된 행정동 추천" : "인기 등록 행정동"}
            </h4>
            <div className="space-y-1.5">
              {(query ? matchedDemoRegions : POPULAR_DONGS).map((r) => {
                const isPinned = pinnedDongNames.includes(r.dong);
                return (
                  <div
                    key={r.dong}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-white hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
                        📍
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {r.dong}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          {r.sido} {r.gugun}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBrowse(r.dong)}
                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-50"
                      >
                        둘러보기
                      </button>
                      {!isPinned && !superAdmin && (
                        <button
                          type="button"
                          onClick={() => handleAddPin(r.dong)}
                          className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-slate-800"
                        >
                          + 핀추가
                        </button>
                      )}
                      {superAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDong(r.dong);
                            onClose();
                            router.push(`/${encodeURIComponent(r.dong)}`);
                          }}
                          className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-600"
                        >
                          관리 이동
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
