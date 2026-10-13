"use client";

import { Home, MessageSquare, BookmarkCheck, LayoutGrid } from "lucide-react";

export type NavTab = "home" | "feed" | "notes" | "menu";

interface MobileBottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenCategorySheet: () => void;
  notesCount?: number;
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
  onOpenCategorySheet,
  notesCount = 0,
}: MobileBottomNavProps) {
  const tabs = [
    {
      id: "home" as NavTab,
      label: "홈",
      icon: Home,
      action: () => onChangeTab("home"),
    },
    {
      id: "feed" as NavTab,
      label: "동네소식",
      icon: MessageSquare,
      action: () => onChangeTab("feed"),
    },
    {
      id: "notes" as NavTab,
      label: "t.note",
      icon: BookmarkCheck,
      action: () => onChangeTab("notes"),
    },
    {
      id: "menu" as NavTab,
      label: "전체메뉴",
      icon: LayoutGrid,
      action: onOpenCategorySheet,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 z-40 select-none pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 h-14">
        {tabs.map(({ id, label, icon: Icon, action }) => {
          const isActive = id === "menu" ? false : activeTab === id;
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
                    isActive ? "stroke-[2.5px] text-amber-600" : "stroke-2 text-slate-400"
                  }`}
                />
                {id === "notes" && notesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white shadow-2xs">
                    {notesCount > 99 ? "99+" : notesCount}
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
