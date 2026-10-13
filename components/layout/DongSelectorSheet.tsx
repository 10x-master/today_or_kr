"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, Search, X } from "lucide-react";
import { DEMO_REGIONS } from "@/lib/demoRegions";
import type { Region } from "@/types/local";

interface DongSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: Region;
  onSelectRegion: (region: Region) => void;
}

export default function DongSelectorSheet({
  isOpen,
  onClose,
  currentRegion,
  onSelectRegion,
}: DongSelectorSheetProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSearch("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRegions = DEMO_REGIONS.filter(
    (r) =>
      r.dong.includes(search) ||
      r.gugun.includes(search) ||
      r.sido.includes(search)
  );

  const handleSelect = (r: Region) => {
    onSelectRegion(r);
    onClose();
    router.push(`/${encodeURIComponent(r.dong)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* 바깥 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 바텀시트 컨테이너 (모바일 뷰포트 max-w-md 정렬) */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* 상단 드래그 핸들 */}
        <div className="py-2.5 flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">우리 동네 설정</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              관심 행정동을 선택하면 해당 지역의 고시·소식이 우선 노출됩니다.
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

        {/* 행정동 검색창 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="동 이름 검색 (예: 상계동, 중계동)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* 행정동 목록 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredRegions.map((r) => {
            const isSelected = r.code === currentRegion.code;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => handleSelect(r)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "bg-amber-50/80 text-amber-950 font-bold"
                    : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {r.dong}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.sido} {r.gugun}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Check className="h-4 w-4" />
                    <span>선택됨</span>
                  </div>
                )}
              </button>
            );
          })}

          {filteredRegions.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              검색된 행정동이 없습니다.
            </div>
          )}
        </div>

        {/* 하단 닫기 안전 영역 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.99] transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
