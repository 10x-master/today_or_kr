"use client";

import { MapPin } from "lucide-react";
import { DEMO_REGIONS } from "@/lib/demoRegions";
import type { Region } from "@/types/local";

export default function RegionDropdown({
  currentRegion,
  onSelect,
  onClose,
}: {
  currentRegion: Region;
  onSelect: (region: Region) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* 바깥 클릭 시 닫히는 투명 캐처 (어둡게 덮지 않음) */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute left-1/2 top-full z-50 mt-1.5 w-60 -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl">
        {DEMO_REGIONS.map((region) => {
          const active = region.code === currentRegion.code;
          return (
            <button
              key={region.code}
              type="button"
              onClick={() => {
                onSelect(region);
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                active ? "bg-amber-50 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <MapPin className={`h-4 w-4 shrink-0 ${active ? "text-amber-500" : "text-zinc-400"}`} />
              {region.sido} {region.gugun} {region.dong}
            </button>
          );
        })}
      </div>
    </>
  );
}
