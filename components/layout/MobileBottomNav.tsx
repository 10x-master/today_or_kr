"use client";

import { Home, MapPin, Gift, Briefcase, User } from "lucide-react";

export type NavTab =
  | "today"
  | "town"
  | "benefits"
  | "work"
  | "my"
  // legacy ids (호환용)
  | "neighbors"
  | "talk"
  | "feed"
  | "more"
  | "home"
  | "notes"
  | "menu";

interface MobileBottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenCategorySheet?: () => void;
  notesCount?: number;
  unreadTalkCount?: number;
  /** 4번째 탭 라벨 (역할별: 우리아파트 / 내 가게 / 업무 / 관리) */
  workLabel?: string;
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
  onOpenCategorySheet,
  notesCount = 0,
  unreadTalkCount = 2,
  workLabel = "업무",
}: MobileBottomNavProps) {
  // 5대 고정 탭 (오늘 / 동네 / 혜택 / 업무 / MY) — PC 사이드바와 동일 구성
  const tabs: Array<{
    id: NavTab;
    aliases: NavTab[];
    label: string;
    icon: typeof Home;
    action: () => void;
    badge: string | null;
  }> = [
    {
      id: "today",
      aliases: ["home", "neighbors"],
      label: "오늘",
      icon: Home,
      action: () => onChangeTab("today"),
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
      id: "benefits",
      aliases: ["notes"],
      label: "혜택",
      icon: Gift,
      action: () => onChangeTab("benefits"),
      badge: notesCount > 0 ? (notesCount > 99 ? "99+" : `${notesCount}`) : null,
    },
    {
      id: "work",
      aliases: [],
      label: workLabel,
      icon: Briefcase,
      action: () => onChangeTab("work"),
      badge: null,
    },
    {
      id: "my",
      aliases: ["more", "menu"],
      label: "MY",
      icon: User,
      action: () => onChangeTab("my"),
      badge: null,
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
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                    isActive
                      ? "stroke-[2.5px] text-amber-600"
                      : "stroke-2 text-slate-400"
                  }`}
                />
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
