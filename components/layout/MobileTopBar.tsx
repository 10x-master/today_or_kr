"use client";

import { ChevronDown, Search, Bell, User as UserIcon } from "lucide-react";
import type { AuthProfile } from "@/types/auth";

interface MobileTopBarProps {
  dongName: string;
  onOpenDongSelector: () => void;
  onToggleSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
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
          aria-label="동네 변경"
        >
          <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-slate-700">
            {dongName || "상계동"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-700 transition-transform group-hover:translate-y-0.5" />
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

          {/* 프로필 / 간편 로그인 아이콘 */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors active:scale-95 overflow-hidden"
            title={currentUser ? `${currentUser.full_name || "입주민"} 프로필` : "카카오 간편 로그인"}
            aria-label="프로필"
          >
            {currentUser?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || "프로필"}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-amber-300"
              />
            ) : currentUser ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-900">
                {currentUser.full_name?.slice(0, 1) || "U"}
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800 transition-colors">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
