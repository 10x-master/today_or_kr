"use client";

import { MapPin, NotebookPen, Building2, MoreHorizontal } from "lucide-react";
import { TodayAppIcon } from "@/components/brand/TodayLogo";

export type NavTab =
  | "home"
  | "town"
  | "tnote"
  | "bizhome"
  | "more"
  // legacy ids (호환용)
  | "today"
  | "neighbors"
  | "talk"
  | "feed"
  | "benefits"
  | "work"
  | "my"
  | "notes"
  | "menu";

interface MobileBottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  notesCount?: number;
  unreadTalkCount?: number;
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
  notesCount = 0,
  unreadTalkCount = 2,
}: MobileBottomNavProps) {
  // 5대 고정 탭 (홈 / 동네 / t노트 / t비즈홈 / 더보기)
  const tabs: Array<{
    id: NavTab;
    aliases: NavTab[];
    label: string;
    icon: typeof MapPin | null;
    action: () => void;
    badge: string | null;
  }> = [
    {
      id: "home",
      aliases: ["today", "neighbors"],
      label: "홈",
      icon: null, // today. 브랜드 심볼로 대체 (아래 렌더링에서 처리)
      action: () => onChangeTab("home"),
      badge: null,
    },
    {
      id: "town",
      aliases: ["feed", "talk"],
      label: "동네",
      icon: MapPin,
      action: () => onChangeTab("town"),
      badge: unreadTalkCount > 0 ? (unreadTalkCount > 99 ? "99+" : `${unreadTalkCount}`) : null,
    },
    {
      id: "tnote",
      aliases: [],
      label: "t노트",
      icon: NotebookPen,
      action: () => onChangeTab("tnote"),
      badge: null,
    },
    {
      id: "bizhome",
      aliases: ["work"],
      label: "t비즈홈",
      icon: Building2,
      action: () => onChangeTab("bizhome"),
      badge: null,
    },
    {
      id: "more",
      aliases: ["benefits", "notes", "my", "menu"],
      label: "더보기",
      icon: MoreHorizontal,
      action: () => onChangeTab("more"),
      badge: notesCount > 0 ? (notesCount > 99 ? "99+" : `${notesCount}`) : null,
    },
  ];

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 select-none pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="grid grid-cols-5 h-14">
        {tabs.map(({ id, aliases, label, icon: Icon, action, badge }) => {
          const isActive = activeTab === id || aliases.includes(activeTab);

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={action}
              className={`group flex flex-col items-center justify-center gap-1 transition-all active:scale-95 focus:outline-hidden ${
                isActive
                  ? "text-slate-900 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <div className="relative">
                {Icon ? (
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                      isActive ? "stroke-[2.5px] text-amber-600" : "stroke-2 text-slate-400"
                    }`}
                  />
                ) : (
                  <TodayAppIcon
                    theme="light"
                    size={22}
                    className={`rounded-lg transition-all group-hover:scale-105 ${
                      isActive ? "" : "opacity-40 grayscale"
                    }`}
                  />
                )}
                {badge && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white shadow-2xs">
                    {badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? "text-amber-950 font-bold" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
