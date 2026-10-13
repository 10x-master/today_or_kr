"use client";

import {
  BarChart3,
  BookmarkCheck,
  Newspaper,
  UserRound,
} from "lucide-react";

export type MobileTab = "feed" | "analysis" | "notes" | "mypage";

const TABS: Array<{ id: MobileTab; label: string; icon: typeof Newspaper }> = [
  { id: "feed", label: "동네 피드", icon: Newspaper },
  { id: "analysis", label: "아파트 분석", icon: BarChart3 },
  { id: "notes", label: "t.note", icon: BookmarkCheck },
  { id: "mypage", label: "10X 마이페이지", icon: UserRound },
];

export default function BottomTabBar({
  activeTab,
  onChange,
  notesCount = 0,
}: {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
  notesCount?: number;
}) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {id === "notes" && notesCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                    {notesCount}
                  </span>
                )}
              </div>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
