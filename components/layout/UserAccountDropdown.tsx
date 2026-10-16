"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  Check,
  ChevronRight,
  Crown,
  FileText,
  Link2,
  LogOut,
  Shield,
  Star,
  User,
  SlidersHorizontal,
  Building,
  Coins,
  Compass,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import { signOutKakao } from "@/lib/auth/kakaoAuth";
import { SmartAppLauncherModal } from "@/components/Navigation";

export interface UserAccountDropdownProps {
  currentUser: AuthProfile | null;
  onOpenLogin: () => void;
  onOpenTerms: () => void;
  className?: string;
  align?: "right" | "left";
  triggerStyle?: "full" | "icon_only";
}

// 6대 관심사 카테고리
const INTEREST_OPTIONS = [
  { id: "RESTAURANT", label: "요식업", icon: "🍽️" },
  { id: "MANUFACTURER", label: "소공인제조", icon: "⚙️" },
  { id: "STORE_CLOSING", label: "폐업철거", icon: "🏚️" },
  { id: "APT_MANAGER", label: "아파트관리", icon: "🏢" },
  { id: "AMBASSADOR", label: "엠버서더", icon: "👑" },
  { id: "GROUP_BUY", label: "동네공구", icon: "🛍️" },
];

export default function UserAccountDropdown({
  currentUser,
  onOpenLogin,
  onOpenTerms,
  className = "",
  align = "right",
  triggerStyle = "full",
}: UserAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 실시간 관심사 다중 선택 상태 (localStorage 연동)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "RESTAURANT",
    "GROUP_BUY",
  ]);

  // 익명성 및 실명 전환 모드 상태 (기본: 익명 모드)
  const [isRealNameMode, setIsRealNameMode] = useState<boolean>(false);

  // 로컬스토리지 상태 동기화 및 런처 이벤트 수신
  useEffect(() => {
    try {
      const savedInterests = localStorage.getItem("today_user_interests");
      if (savedInterests) {
        setSelectedInterests(JSON.parse(savedInterests));
      }
      const savedRealName = localStorage.getItem("today_realname_mode");
      if (savedRealName !== null) {
        setIsRealNameMode(savedRealName === "true");
      }
    } catch {}

    const handleOpenLauncher = () => {
      setIsOpen(false);
      setIsLauncherOpen(true);
    };
    window.addEventListener("today_open_app_launcher", handleOpenLauncher);
    return () => window.removeEventListener("today_open_app_launcher", handleOpenLauncher);
  }, []);

  // 외부 클릭 및 ESC 키 바인딩
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // 관심사 토글 핸들러
  const handleToggleInterest = (id: string) => {
    const next = selectedInterests.includes(id)
      ? selectedInterests.filter((item) => item !== id)
      : [...selectedInterests, id];

    setSelectedInterests(next);
    try {
      localStorage.setItem("today_user_interests", JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent("today_interests_changed", { detail: next })
      );
    } catch {}
  };

  // 실명/익명 전환 토글 핸들러
  const handleToggleRealName = () => {
    const next = !isRealNameMode;
    setIsRealNameMode(next);
    try {
      localStorage.setItem("today_realname_mode", String(next));
      window.dispatchEvent(
        new CustomEvent("today_realname_mode_changed", { detail: next })
      );
    } catch {}
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await signOutKakao();
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("today_auth_changed"));
  };

  // 비로그인 상태: 프로필/사람 아이콘 클릭 시 [스마트 마이 메뉴 허브] 팝업
  if (!currentUser) {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        {triggerStyle === "icon_only" ? (
          <button
            type="button"
            onClick={() => setIsLauncherOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            title="스마트 마이 메뉴 앱 런처 열기"
            aria-label="스마트 마이 메뉴"
          >
            <User className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsLauncherOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
              title="스마트 마이 메뉴 앱 런처 열기"
            >
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span>마이 메뉴</span>
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs focus:outline-hidden"
              title="카카오 1초 간편 로그인 / 회원가입"
            >
              <User className="h-3.5 w-3.5 text-amber-400" />
              <span>로그인</span>
            </button>
          </div>
        )}

        {/* 스마트 마이 메뉴 앱 런처 허브 모달 */}
        <SmartAppLauncherModal isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
      </div>
    );
  }

  // 공식 뱃지 판별 로직
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";
  const userInitial = currentUser.full_name?.slice(0, 1) || "T";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 구글 스타일 원형 프로필 아바타 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-full p-0.5 ring-1 ring-slate-200 hover:ring-amber-400 focus:outline-hidden transition-all cursor-pointer group"
        title={`${currentUser.full_name || "회원"} 님의 계정`}
        aria-label="통합 계정 메뉴 열기"
        aria-expanded={isOpen}
      >
        {currentUser.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name || "프로필"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs">
            {userInitial}
          </div>
        )}
        {/* 최고관리자 점등 마커 */}
        {isSuperAdmin && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white ring-2 ring-white">
            👑
          </span>
        )}
      </button>

      {/* 구글 스타일 통합 계정 드롭다운 패널 (w-84 sm:w-96) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 w-84 sm:w-96 rounded-2xl bg-white border border-slate-100 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900 select-none`}
        >
          {/* 1) [헤더 및 공식 등급 뱃지 영역] */}
          <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
            {currentUser.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || "프로필"}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-sm font-bold shrink-0 shadow-xs">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {currentUser.full_name || "투데이 멤버"}
                </span>
                {/* 실명 / 닉네임 상태 표기 */}
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {isRealNameMode ? "실명 모드" : "익명 모드"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                {currentUser.email || "카카오 간편연동 회원"}
              </p>

              {/* 공식 등급 뱃지 표시부 */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                    <Crown className="h-3 w-3 text-amber-600" />
                    👑 최고관리자
                  </span>
                ) : currentUser.role === "STORE_OWNER" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-bold">
                    🏪 매장 파트너
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-medium">
                    인증 회원
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 🌟 [스마트 마이 메뉴 앱 런처 전체화면 허브 모달 열기] */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsLauncherOpen(true);
            }}
            className="w-full my-2.5 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-indigo-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs text-amber-300">
                <Sparkles className="h-3.5 w-3.5 fill-amber-300" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight flex items-center gap-1">
                  스마트 마이 메뉴 허브
                  <span className="text-[9px] bg-white/25 px-1.5 py-0.2 rounded-full font-bold">전체화면</span>
                </p>
                <p className="text-[10px] text-blue-100 font-normal">
                  4대 핵심 서비스 그리드 & GNB 핀 등록
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-white group-hover:translate-x-0.5 transition-transform">
              열기 →
            </span>
          </button>

          {/* 2) [4대 핵심 퀵 링크: LinkPick 허브, t.note 데스크, 비즈홈, 관리자 CRM] */}
          <div className="py-2.5 border-b border-slate-100 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 px-1 mb-1">
              핵심 퀵 링크
            </div>

            {/* 1. [🔗 내 LinkPick 허브] */}
            <Link
              href={`/p/${currentUser.id || "ambassador-01"}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-slate-800">🔗 내 LinkPick 허브</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">
                모바일 1-Page →
              </span>
            </Link>

            {/* 2. [📝 t.note 스마트 데스크 & 캘린더] */}
            <Link
              href="/note"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-slate-800">📝 t.note 캘린더 데스크</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600 transition-colors">
                1초 배포·OSMU →
              </span>
            </Link>

            {/* 2-1. [⚡ t.note 스마트 데스크 & 링크픽 허브] */}
            <Link
              href="/desk"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-600" />
                <span className="font-medium text-slate-800">⚡ t.note 스마트 데스크 & 링크픽</span>
              </div>
              <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded group-hover:bg-rose-100 transition-colors">
                AI 비서·수익화 →
              </span>
            </Link>

            {/* 2-2. [📍 Today 로컬 안심 구인 피드] */}
            <Link
              href="/local"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-slate-800">📍 Today 로컬 구인 피드</span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded group-hover:bg-amber-100 transition-colors">
                동네 일자리 →
              </span>
            </Link>

            {/* 2-3. [👥 알바 ATS & 노무·세무 데스크] */}
            <Link
              href="/desk/recruitment"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-slate-800">👥 알바 ATS & 노무·세무</span>
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded group-hover:bg-indigo-100 transition-colors">
                전자계약·출결 →
              </span>
            </Link>

            {/* 3. [💼 비즈홈 공식 페이지] */}
            <Link
              href="/biz/apt-sanggye14"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-slate-800">💼 비즈홈 공식 페이지</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 transition-colors">
                아파트·상점 →
              </span>
            </Link>

            {/* 4. [🛡️ 관리자 CRM 승인 대기열] */}
            <Link
              href="/admin/crm"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-rose-600" />
                <span className="font-medium text-slate-800">🛡️ 관리자 CRM (승인 3종)</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-rose-600 transition-colors">
                청원·클레임·광고 →
              </span>
            </Link>

            {/* 4-1. [📋 t.다이어리 제공자 심사] */}
            <Link
              href="/admin/providers"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-800">📋 t.다이어리 제공자 심사</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors">
                승인·조건부·반려 →
              </span>
            </Link>

            {/* 5. [💰 배포자 수익 지갑 & PWA 영구 지분] */}
            <Link
              href="/note?tab=wallet"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-slate-800">💰 배포자 수익 지갑 (PWA 영구 지분)</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.2 rounded group-hover:bg-emerald-100 transition-colors">
                284,000원 →
              </span>
            </Link>

            {/* 6. [🛰️ M-FAD 가맹점 수수료 레이더] */}
            <Link
              href="/admin/radar"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-slate-800">🛰️ M-FAD GIS 레이더 (실사)</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded group-hover:bg-blue-100 transition-colors">
                실사 데스크 →
              </span>
            </Link>
          </div>

          {/* 3) [실시간 관심사 설정 (체크박스/토글형)] */}
          <div className="py-2.5 border-b border-slate-100">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-700">
                  실시간 관심사 설정 (다중 선택)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {selectedInterests.length}개 선택됨
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {INTEREST_OPTIONS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleInterest(item.id)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-50/80 border border-amber-300 text-amber-950 font-medium"
                        : "bg-slate-50/70 border border-slate-100 text-slate-600 hover:bg-slate-100 font-normal"
                    }`}
                  >
                    <span className="truncate">
                      {item.icon} {item.label}
                    </span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-amber-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 px-1 leading-tight">
              * 선택한 관심사에 맞춰 메인 피드와 정책자금이 실시간 자동 추천됩니다.
            </p>
          </div>

          {/* 4) [익명성 및 실명 전환 토글] */}
          <div className="py-2.5 border-b border-slate-100">
            <div className="flex items-center justify-between px-1">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-800">
                    활동 모드 (익명 / 실명)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5 leading-tight">
                  커뮤니티 글쓰기는 기본 익명(닉네임)으로 안전하게 보호됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleRealName}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                  isRealNameMode
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isRealNameMode ? "🪪 실명 활성" : "🎭 익명 유지"}
              </button>
            </div>
          </div>

          {/* 5) [하단 푸터 영역: 로그아웃 & 은닉형 약관 트리거] */}
          <div className="pt-2.5 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-normal transition-colors cursor-pointer"
            >
              <LogOut className="h-3 w-3" />
              <span>로그아웃</span>
            </button>

            {/* 평소 화면에서는 시선이 가지 않게 매우 작고 옅은 은닉형 약관 링크 */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTerms();
              }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 cursor-pointer font-normal"
              title="서비스 기본약관 및 초상권/저작권 법적 면책 전문 확인"
            >
              [이용약관 및 면책조항]
            </button>
          </div>
        </div>
      )}

      {/* 스마트 마이 메뉴 앱 런처 허브 모달 */}
      <SmartAppLauncherModal isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
    </div>
  );
}
