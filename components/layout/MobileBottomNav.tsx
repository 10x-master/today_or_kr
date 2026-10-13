"use client";

import {
  Users,
  MessageCircle,
  Newspaper,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";

export type NavTab =
  | "neighbors"
  | "talk"
  | "feed"
  | "benefits"
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
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
  onOpenCategorySheet,
  notesCount = 0,
  unreadTalkCount = 2,
}: MobileBottomNavProps) {
  // 5대 탭 (이웃 / 톡 / 피드 / 혜택 / 더보기)
  const tabs = [
    {
      id: "neighbors" as NavTab,
      alias: "home" as NavTab,
      label: "이웃",
      icon: Users,
      action: () => onChangeTab("neighbors"),
      badge: null,
    },
    {
      id: "talk" as NavTab,
      alias: "talk" as NavTab,
      label: "톡",
      icon: MessageCircle,
      action: () => onChangeTab("talk"),
      badge: unreadTalkCount > 0 ? (unreadTalkCount > 99 ? "99+" : `${unreadTalkCount}`) : null,
    },
    {
      id: "feed" as NavTab,
      alias: "feed" as NavTab,
      label: "피드",
      icon: Newspaper,
      action: () => onChangeTab("feed"),
      badge: null,
    },
    {
      id: "benefits" as NavTab,
      alias: "notes" as NavTab,
      label: "혜택",
      icon: Sparkles,
      action: () => onChangeTab("benefits"),
      badge: notesCount > 0 ? (notesCount > 99 ? "99+" : `${notesCount}`) : null,
    },
    {
      id: "more" as NavTab,
      alias: "menu" as NavTab,
      label: "더보기",
      icon: MoreHorizontal,
      action: () => {
        if (onOpenCategorySheet) {
          onOpenCategorySheet();
        } else {
          onChangeTab("more");
        }
      },
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 select-none pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="grid grid-cols-5 h-14">
        {tabs.map(({ id, alias, label, icon: Icon, action, badge }) => {
          const isActive =
            activeTab === id ||
            (id === "neighbors" && activeTab === "home") ||
            (id === "benefits" && activeTab === "notes") ||
            (id === "more" && activeTab === "menu");

          return (
            <button
              key={id}
              type="button"
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
