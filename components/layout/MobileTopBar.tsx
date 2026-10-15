"use client";

import { ChevronDown, Search, Bell, Sparkles } from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import InstallAppButton from "@/components/common/InstallAppButton";

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
      <div className="flex items-center justify-between px-3 sm:px-4 h-14">
        {/* 좌측: 현재 동네 이름 (투데이 대표 블루 컬러 text-blue-600 font-bold text-xl) */}
        <button
          type="button"
          onClick={onOpenDongSelector}
          className="group flex items-center gap-1.5 py-1 text-left focus:outline-hidden active:opacity-70 transition-opacity"
          aria-label="내 동네 핀 변경"
        >
          <span className="text-xl font-bold tracking-tight text-blue-600 group-hover:text-blue-700">
            {dongName || "내 동네"}
          </span>
          <ChevronDown className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-y-0.5" />
          {currentUser?.role === "SUPER_ADMIN" && (
            <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-black text-blue-800 border border-blue-300">
              👑 관리
            </span>
          )}
        </button>

        {/* 우측: 마이 메뉴(✨), 검색(🔍), 알림(🔔), 프로필(👤) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* 스마트 마이 메뉴 앱 런처 버튼 */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("today_open_app_launcher"))}
            className="flex h-8 sm:h-9 px-2 sm:px-2.5 items-center gap-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold text-xs active:scale-95 cursor-pointer border border-blue-200/80 shadow-2xs"
            title="스마트 마이 메뉴 앱 런처 열기"
            aria-label="마이 메뉴"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
            <span className="hidden xs:inline">마이 메뉴</span>
          </button>
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

          {/* 앱 다운로드 버튼 (비로그인 방문자에게도 항상 노출) */}
          <InstallAppButton appType="TODAY_MAIN" variant="icon" />

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
