"use client";

import { HeartHandshake, Newspaper, ShoppingBag, UserRound } from "lucide-react";

export type MobileTab = "feed" | "funding" | "store" | "mypage";

const TABS: Array<{ id: MobileTab; label: string; icon: typeof Newspaper }> = [
  { id: "feed", label: "동네 피드", icon: Newspaper },
  { id: "funding", label: "착한소비 펀딩", icon: HeartHandshake },
  { id: "store", label: "링크픽 스토어", icon: ShoppingBag },
  { id: "mypage", label: "10X 마이페이지", icon: UserRound },
];

export default function BottomTabBar({
  activeTab,
  onChange,
}: {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
