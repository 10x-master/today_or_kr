"use client";

import { ChevronDown, Search, Bell } from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";

interface MobileTopBarProps {
  dongName: string;
  onOpenDongSelector: () => void;
  onToggleSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenTerms?: () => void;
  currentUser: AuthProfile | null;
  unreadCount?: number;
  isSearchActive?: boolean;
}

export default function MobileTopBar({
  dongName,
  onOpenDongSelector,
  onToggleSearch,
  onOpenNotifications,
  onOpenProfile,
  onOpenTerms,
  currentUser,
  unreadCount = 2,
  isSearchActive = false,
}: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-14">
        {/* 좌측: 현재 동네 이름 (당근마켓 스타일 볼드 + ▾) */}
        <button
          type="button"
          onClick={onOpenDongSelector}
          className="group flex items-center gap-1.5 py-1 text-left focus:outline-hidden active:opacity-70 transition-opacity"
          aria-label="내 동네 핀 변경"
        >
          <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700">
            {dongName || "내 동네"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-y-0.5" />
          {currentUser?.role === "SUPER_ADMIN" && (
            <span className="ml-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800 border border-amber-300">
              👑 관리
            </span>
          )}
        </button>

        {/* 우측: 검색(🔍), 알림(🔔), 프로필/로그인(👤) 미니멀 아이콘 3종 */}
        <div className="flex items-center gap-1">
          {/* 검색 아이콘 */}
          <button
            type="button"
            onClick={onToggleSearch}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95 ${
              isSearchActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="행정동 및 소식 검색"
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* 알림 아이콘 */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95"
            title="동네 실시간 알림"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* 구글 스타일 통합 계정 드롭다운 (원형 아바타 & 팝오버) */}
          <UserAccountDropdown
            currentUser={currentUser}
            onOpenLogin={onOpenProfile}
            onOpenTerms={() => {
              if (onOpenTerms) onOpenTerms();
              else window.dispatchEvent(new CustomEvent("today_open_terms_modal"));
            }}
            triggerStyle="icon_only"
            align="right"
          />
        </div>
      </div>
    </header>
  );
}
