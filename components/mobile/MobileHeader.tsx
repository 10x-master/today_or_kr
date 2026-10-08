"use client";

import { useState } from "react";
import { ChevronDown, LocateFixed, Sparkles } from "lucide-react";
import RegionDropdown from "@/components/mobile/RegionDropdown";
import type { Region } from "@/types/local";

export default function MobileHeader({
  region,
  onRegionChange,
}: {
  region: Region;
  onRegionChange: (region: Region) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocateError("이 브라우저에서는 위치 확인을 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) throw new Error("위치 변환에 실패했습니다.");
          const data: { region: Region } = await res.json();
          onRegionChange(data.region);
        } catch {
          setLocateError("위치를 변환하는 중 문제가 발생했습니다.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError("위치 권한이 거부되었습니다.");
        setLocating(false);
      }
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400">
            <Sparkles className="h-4 w-4 text-zinc-900" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-zinc-900">
            투데이픽 <span className="text-amber-500">Today Pick</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          aria-label="내 위치 확인"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>

      <div className="relative border-t border-zinc-100">
        <button
          type="button"
          onClick={() => setModalOpen((open) => !open)}
          className="flex w-full items-center justify-center gap-1 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          {region.sido} {region.gugun} {region.dong}
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
              modalOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {modalOpen && (
          <RegionDropdown
            currentRegion={region}
            onSelect={onRegionChange}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>

      {locateError && (
        <p className="border-t border-zinc-100 bg-rose-50 px-4 py-1.5 text-center text-[11px] font-medium text-rose-500">
          {locateError}
        </p>
      )}
    </header>
  );
}
