"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";

interface DistrictSearchBarProps {
  currentDong?: string;
  className?: string;
}

const POPULAR_DONGS = ["상계동", "중계동", "하계동", "공릉동"];

export default function DistrictSearchBar({
  currentDong,
  className = "",
}: DistrictSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // '동', '읍', '면'이 생략된 경우 보정 (예: '상계' -> '상계동')
    let target = trimmed;
    if (!target.endsWith("동") && !target.endsWith("읍") && !target.endsWith("면")) {
      target = `${target}동`;
    }

    router.push(`/${encodeURIComponent(target)}`);
  };

  const handleSelectDong = (dong: string) => {
    router.push(`/${encodeURIComponent(dong)}`);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 검색 입력 폼 */}
      <form onSubmit={handleSearch} className="relative flex items-center">
        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
          <Search className="h-4 w-4 text-indigo-600" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="행정동 또는 단지명을 검색하세요 (예: 상계동, 중계동)"
          className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-2xs transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </form>

      {/* 인기/추천 행정동 칩 */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-0.5 mr-0.5">
          <MapPin className="h-3 w-3 text-indigo-500" />
          추천:
        </span>
        {POPULAR_DONGS.map((dong) => {
          const isActive = currentDong === dong;
          return (
            <button
              key={dong}
              type="button"
              onClick={() => handleSelectDong(dong)}
              className={`flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span>{dong}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
