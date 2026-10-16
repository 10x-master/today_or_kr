"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  Star,
  ExternalLink,
  ChevronRight,
  Compass,
  Building,
  Store,
  Briefcase,
  Zap,
  MapPin,
  FileText,
  Users,
  Megaphone,
  Radio,
  FileCheck,
  Shield,
  Layers,
  Sparkles,
  Search,
  Clock,
} from "lucide-react";
import { TodayAppIcon, TodayWordmark } from "@/components/brand/TodayLogo";

/** ============================================================
    [1. 통일된 좌측 상단 복귀 앵커 컴포넌트: UnifiedHomeReturnAnchor]
   ============================================================ */
interface UnifiedHomeReturnAnchorProps {
  currentModule?: string;
  className?: string;
}

export function UnifiedHomeReturnAnchor({
  currentModule,
  className = "",
}: UnifiedHomeReturnAnchorProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 transition-all text-xs font-semibold shrink-0 group shadow-2xs ${className}`}
      title="Today. 최상위 포털 메인으로 이동"
    >
      <ArrowLeft className="h-3.5 w-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
      {/* 아이콘은 모바일 상단에서만, PC 데스크톱에서는 워드마크만 노출 */}
      <TodayAppIcon theme="light" size={20} className="sm:hidden" />
      <div className="flex items-center gap-1">
        <TodayWordmark theme="light" size="sm" className="group-hover:text-blue-600 transition-colors" />
        <span className="text-[11px] text-slate-500 font-normal">홈으로</span>
      </div>
    </Link>
  );
}

/** ============================================================
    [2. 브레드크럼 네비게이션: TodayBreadcrumbs]
   ============================================================ */
interface TodayBreadcrumbsProps {
  items: Array<{ label: string; href?: string; isCurrent?: boolean }>;
  className?: string;
}

export function TodayBreadcrumbs({ items, className = "" }: TodayBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs ${className}`}>
      <Link
        href="/"
        className="font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1 shrink-0"
      >
        {/* 아이콘은 모바일 상단에서만, PC 데스크톱에서는 워드마크만 노출 */}
        <TodayAppIcon theme="light" size={16} className="sm:hidden" />
        <TodayWordmark theme="light" size="sm" />
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="text-slate-300 font-normal">›</span>
          {item.isCurrent || !item.href ? (
            <span className="text-blue-600 font-bold">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** ============================================================
    [3. 목적 기반 서비스 런처 데이터 구조 (동네 / 혜택 / 내 가게 / 업무 / 관리)]
   ============================================================ */
export type LauncherSectionId = "TOWN" | "BENEFIT" | "STORE" | "WORK" | "ADMIN";

export interface AppLauncherItem {
  id: string;
  section: LauncherSectionId;
  title: string;
  /** 퀵메뉴·핀 바용 짧은 이름 (기억하기 쉬운 2~6글자) */
  short: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  /** 통합 검색용 동의어 키워드 (공백 구분) */
  keywords?: string;
}

export interface LauncherSection {
  id: LauncherSectionId;
  title: string;
  subtitle: string;
  items: AppLauncherItem[];
}

export const LAUNCHER_SECTIONS: LauncherSection[] = [
  {
    id: "TOWN",
    title: "📍 동네 · 우리 아파트",
    subtitle: "이웃 소식, 입주민 인증, 아파트 자산 관리",
    items: [
      {
        id: "app-local-feed",
        section: "TOWN",
        title: "투데이 로컬 피드",
        short: "동네소식",
        description: "우리 동네 실시간 소식, 소통 톡, 입주민 인증 커뮤니티",
        href: "/local",
        icon: "📍",
        badge: "실시간",
        keywords: "동네 이웃 피드 톡 소식 행사 구인 알바 커뮤니티",
      },
      {
        id: "app-aptlink-portal",
        section: "TOWN",
        title: "아파트링크 (AptLink) 공정입찰 포털",
        short: "아파트링크",
        description: "내 아파트 공사비 적정성 진단, 주민인증 락인 및 2025 장기수선 실무스쿨",
        href: "/aptlink",
        icon: "🏢",
        badge: "NEW 순백",
        keywords: "아파트 입찰 공사 장기수선 관리소 견적 주민인증",
      },
      {
        id: "app-apt-audit",
        section: "TOWN",
        title: "아파트 자산 진단 및 공구 청원",
        short: "자산진단",
        description: "단지별 공용부 관리비 감사, 10인 청원 공동구매 및 자산 보고서",
        href: "/?tab=analysis",
        icon: "📊",
        badge: "자산 팩트",
        keywords: "관리비 감사 자산 보고서 청원 단지 분석",
      },
      {
        id: "app-tcheck-report",
        section: "TOWN",
        title: "t.check 자가진단 리포트",
        short: "자가진단",
        description: "K-apt 실거래 기반 CERA 입찰 적정성 진단 및 소상공인 매장 결제망·시설 자가점검",
        href: "/t-check",
        icon: "🔍",
        badge: "CERA",
        keywords: "자가진단 체크 K-apt CERA 장기수선 시설점검 매장 결제망",
      },
    ],
  },
  {
    id: "BENEFIT",
    title: "🎁 혜택 · 수익",
    subtitle: "싸게 사고, 추천하고, 받는 모든 혜택",
    items: [
      {
        id: "app-group-buy",
        section: "BENEFIT",
        title: "공동구매 · 상품",
        short: "공동구매",
        description: "이웃과 함께 사는 10인 공구 특가와 플랫폼 상품",
        href: "/products",
        icon: "🛒",
        badge: "공구",
        keywords: "공구 공동구매 상품 쇼핑 특가 할인 구매",
      },
      {
        id: "app-linkpick-hub",
        section: "BENEFIT",
        title: "링크픽(LinkPick) 수익 허브",
        short: "링크픽",
        description: "모바일 1-Page 제휴 솔루션 추천, N차 수수료 자동 정산 허브",
        href: "/p/ambassador-01",
        icon: "🔗",
        badge: "수당 15%",
        keywords: "제휴 추천 수익 수수료 정산 앰배서더 링크 리퍼럴 지갑",
      },
    ],
  },
  {
    id: "STORE",
    title: "🏪 내 가게",
    subtitle: "매장 홈페이지, 광고, 구인 · 근로계약",
    items: [
      {
        id: "app-t-homepage",
        section: "STORE",
        title: "t.홈페이지 빌더",
        short: "내 홈페이지",
        description: "모바일 원클릭 공식 매장 웹사이트, 카카오 채널 및 단말기 연동",
        href: "/biz/apt-sanggye14",
        icon: "🌐",
        badge: "멀티테넌트",
        keywords: "홈페이지 매장 웹사이트 사이트 가게 카카오 채널",
      },
      {
        id: "app-partners-ads",
        section: "STORE",
        title: "비즈보드 광고 센터",
        short: "광고",
        description: "동네 주민 10,000명에게 즉시 알리는 하이퍼로컬 배너 광고",
        href: "/partners",
        icon: "📢",
        badge: "파트너스",
        keywords: "광고 홍보 배너 비즈보드 파트너스 마케팅",
      },
      {
        id: "app-desk-recruitment",
        section: "STORE",
        title: "알바 ATS 구인 / 근로계약",
        short: "구인·계약",
        description: "모바일 1초 표준근로계약(t.sign), 지오펜싱 50m 출결 및 3.3% 원천세",
        href: "/desk/recruitment",
        icon: "👥",
        badge: "t.sign/t.check",
        keywords: "구인 알바 채용 근로계약 출결 직원 인사 급여",
      },
      {
        id: "app-trefund-calc",
        section: "STORE",
        title: "t.환급 결제수수료 무료진단",
        short: "수수료환급",
        description: "대표가맹점 요율 대비 누수 수수료 1% 무료 환급 청구 및 모바일 매장(PWA) 무료 입점",
        href: "/t-refund",
        icon: "💳",
        badge: "무료 환급",
        keywords: "수수료 환급 카드 결제 PG 가맹점 누수 PWA 입점",
      },
      {
        id: "app-my-shop",
        section: "STORE",
        title: "내 매장 (My Shop) 관리 홈",
        short: "내 매장",
        description: "비즈홈·계약서 보관함·수수료 환급 현황을 한곳에서, 로그인 후 이용 가능",
        href: "/my-shop",
        icon: "🏪",
        badge: "로그인 필요",
        keywords: "내 매장 마이샵 비즈홈 계약서 보관함 수수료 환급",
      },
    ],
  },
  {
    id: "WORK",
    title: "💼 업무 · 생산성",
    subtitle: "AI 비서, 메모, 일정, 협업 워크스페이스",
    items: [
      {
        id: "app-tnote-desk",
        section: "WORK",
        title: "t.note 스마트 데스크",
        short: "스마트데스크",
        description: "AI 일정 비서, 음성 퀵 캡처, 구글 캘린더 양방향 실시간 동기화",
        href: "/desk",
        icon: "⚡",
        badge: "AI 워크OS",
        keywords: "데스크 일정 캘린더 비서 음성 AI 스케줄",
      },
      {
        id: "app-tnote-note",
        section: "WORK",
        title: "t.note 빠른 메모",
        short: "노트",
        description: "음성·텍스트 즉시 메모와 공유",
        href: "/note",
        icon: "📝",
        keywords: "노트 메모 기록 음성 공유 필기",
      },
      {
        id: "app-tnote-workspace",
        section: "WORK",
        title: "t.note 통합 워크스페이스",
        short: "워크스페이스",
        description: "노트, 캘린더, 로컬 자산 및 협업 관리 전체 뷰포트",
        href: "/workspace",
        icon: "📋",
        keywords: "워크스페이스 협업 업무 작업 할일 프로젝트",
      },
      {
        id: "app-today-note-capture",
        section: "WORK",
        title: "투데이노트 2-Tap 빠른 등록",
        short: "투데이노트",
        description: "사진 1장 압축 촬영 + 10초 음성 녹음으로 즉시 등록, 소싱룸 연계 및 LinkPick 숏링크 자동 결합",
        href: "/t-note",
        icon: "📸",
        badge: "2-Tap",
        keywords: "투데이노트 사진 음성 소싱룸 숏링크 링크픽 등록",
      },
      {
        id: "app-t-diary",
        section: "WORK",
        title: "t.다이어리 스마트 캘린더",
        short: "t.다이어리",
        description: "지류 다이어리 결합 브랜드 공식 행사 일정과 개인 일정을 통합하는 음성 메모 캘린더",
        href: "/t-diary",
        icon: "📔",
        keywords: "다이어리 캘린더 음성메모 지류 행사일정",
      },
    ],
  },
  {
    id: "ADMIN",
    title: "🛡️ 관리 · 영업",
    subtitle: "필드 세일즈 레이더, CRM, 전자계약, 템플릿",
    items: [
      {
        id: "app-tnote-sales",
        section: "ADMIN",
        title: "t.note Sales (필드 세일즈 & TM CRM)",
        short: "세일즈레이더",
        description: "GIS 가맹점 레이더, 수수료 누수 환급 진단, 밀착 TM 동선 관리",
        href: "/admin/radar",
        icon: "🛰️",
        badge: "M-FAD 레이더",
        keywords: "영업 세일즈 레이더 TM 가맹점 지도 수수료",
      },
      {
        id: "app-admin-crm",
        section: "ADMIN",
        title: "최고관리자 통합 CRM",
        short: "통합CRM",
        description: "서포터즈 100점 배점 심사, 비즈홈 소유권 이전 및 광고 라이브 제어",
        href: "/admin/crm",
        icon: "🛡️",
        badge: "HQ 전용",
        keywords: "관리자 CRM 승인 심사 서포터즈 소유권 어드민",
      },
      {
        id: "app-tsign-contract",
        section: "ADMIN",
        title: "t.sign AI 계약서 엔진",
        short: "전자계약",
        description: "현장 음성·통화 녹음에서 AI가 당사자·단가·기간을 자동 추출해 표준계약서를 즉시 전자체결",
        href: "/t-sign",
        icon: "✍️",
        badge: "1초 체결",
        keywords: "계약 전자서명 서명 약정 청구 카드수수료 녹음 AI파싱",
      },
      {
        id: "app-templates-center",
        section: "ADMIN",
        title: "t.홈페이지 템플릿 센터",
        short: "템플릿",
        description: "4대 표준 프리셋(아파트링크/제조사특판/동네매장/세일즈) 복제 엔진",
        href: "/admin/templates",
        icon: "📑",
        badge: "템플릿 엔진",
        keywords: "템플릿 프리셋 복제 홈페이지 디자인",
      },
      {
        id: "app-diary-providers-admin",
        section: "ADMIN",
        title: "t.다이어리 제공자 심사",
        short: "제공자심사",
        description: "t.다이어리 제공자 등록 신청 승인/조건부승인/반려 심사 대시보드",
        href: "/admin/providers",
        icon: "📋",
        badge: "HQ 전용",
        keywords: "다이어리 제공자 승인 심사 반려 조건부승인",
      },
      {
        id: "app-diary-license-crm",
        section: "ADMIN",
        title: "t.다이어리 라이선스 & 타깃 CRM",
        short: "라이선스CRM",
        description: "플랜/만료일 즉시 연장, 소속 태그 다중 필터 후 카카오 알림톡 일괄 발송",
        href: "/admin/diaries",
        icon: "🪪",
        badge: "HQ 전용",
        keywords: "라이선스 플랜 만료 갱신 CRM 알림톡 일괄발송",
      },
    ],
  },
];

/** ============================================================
    [3-1. 역할(Persona) 맞춤 · 최근 사용 유틸]
   ============================================================ */
export type RoleGroup = "RESIDENT" | "OWNER" | "MANAGER" | "ADMIN";

/** 역할별 기본 퀵메뉴 구성 (최근 사용 · 핀 고정이 우선 노출됨) */
export const ROLE_DEFAULT_QUICK: Record<RoleGroup, string[]> = {
  RESIDENT: [
    "app-local-feed",
    "app-apt-audit",
    "app-aptlink-portal",
    "app-group-buy",
    "app-linkpick-hub",
    "app-tnote-desk",
    "app-tnote-note",
  ],
  OWNER: [
    "app-partners-ads",
    "app-desk-recruitment",
    "app-t-homepage",
    "app-local-feed",
    "app-group-buy",
    "app-tnote-desk",
    "app-linkpick-hub",
  ],
  MANAGER: [
    "app-aptlink-portal",
    "app-apt-audit",
    "app-tnote-desk",
    "app-tnote-note",
    "app-tnote-workspace",
    "app-local-feed",
    "app-group-buy",
  ],
  ADMIN: [
    "app-tnote-sales",
    "app-admin-crm",
    "app-templates-center",
    "app-tnote-desk",
    "app-tsign-contract",
    "app-local-feed",
    "app-tnote-workspace",
  ],
};

/** 역할별 런처 섹션 노출 순서 */
export const ROLE_SECTION_ORDER: Record<RoleGroup, LauncherSectionId[]> = {
  RESIDENT: ["TOWN", "BENEFIT", "WORK", "STORE", "ADMIN"],
  OWNER: ["STORE", "BENEFIT", "TOWN", "WORK", "ADMIN"],
  MANAGER: ["TOWN", "WORK", "BENEFIT", "STORE", "ADMIN"],
  ADMIN: ["ADMIN", "WORK", "STORE", "TOWN", "BENEFIT"],
};

export function personaToRoleGroup(persona: string | null | undefined, isAdmin = false): RoleGroup {
  if (isAdmin) return "ADMIN";
  if (persona === "APT_MANAGER") return "MANAGER";
  if (
    persona === "RESTAURANT" ||
    persona === "MANUFACTURER" ||
    persona === "STORE_CLOSING" ||
    persona === "AMBASSADOR"
  ) {
    return "OWNER";
  }
  return "RESIDENT";
}

export const ALL_LAUNCHER_APPS: AppLauncherItem[] = LAUNCHER_SECTIONS.flatMap((s) => s.items);

const RECENT_KEY = "today_recent_apps";
const RECENT_EVENT = "today_recent_apps_changed";
const PERSONA_KEY = "today_user_persona";

export function readRecentAppIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function recordRecentApp(appId: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [appId, ...readRecentAppIds().filter((id) => id !== appId)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENT_EVENT, { detail: next }));
  } catch {}
}

/** 홈 URL(/?tab=...)과 같은 href 기준으로 앱 id를 역조회 */
export function findAppByHref(href: string): AppLauncherItem | undefined {
  return ALL_LAUNCHER_APPS.find((a) => a.href === href);
}

export function readStoredPersona(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PERSONA_KEY);
  } catch {
    return null;
  }
}

export { RECENT_EVENT as RECENT_APPS_EVENT };

/** ============================================================
    [3-2. 상단 모드 체인저: 이웃 주민 모드 ⟷ 사장님·기업 모드]
   ============================================================ */
export type TopMode = "RESIDENT" | "OWNER";

interface ModeChangerToggleProps {
  mode: TopMode;
  onChange: (mode: TopMode) => void;
  className?: string;
}

/** 상단 고정 모드 체인저 — 홈·런처·퀵메뉴 전반의 역할 기본값을 한 번에 전환합니다. */
export function ModeChangerToggle({ mode, onChange, className = "" }: ModeChangerToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="이웃 주민 모드 / 사장님·기업 모드 전환"
      className={`inline-flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-bold select-none ${className}`}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "RESIDENT"}
        onClick={() => onChange("RESIDENT")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-all cursor-pointer ${
          mode === "RESIDENT" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        이웃 주민
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "OWNER"}
        onClick={() => onChange("OWNER")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-all cursor-pointer ${
          mode === "OWNER" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Briefcase className="h-3.5 w-3.5" />
        사장님·기업
      </button>
    </div>
  );
}

/** ============================================================
    [4. 전체 서비스 런처 모달 (검색 · 최근 사용 · 핀): SmartAppLauncherModal]
   ============================================================ */
interface SmartAppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PINNED = ["app-local-feed", "app-tnote-sales", "app-desk-recruitment", "app-tnote-desk"];

export function SmartAppLauncherModal({ isOpen, onClose }: SmartAppLauncherModalProps) {
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [roleGroup, setRoleGroup] = useState<RoleGroup>("RESIDENT");
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PINNED;
    try {
      const saved = localStorage.getItem("today_pinned_apps");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PINNED;
  });

  const handleTogglePin = (appId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setPinnedAppIds((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem("today_pinned_apps", JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("today_pinned_apps_changed", { detail: next }));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      setQuery("");
      setRecentIds(readRecentAppIds());
      setRoleGroup(personaToRoleGroup(readStoredPersona()));
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const orderedSections = useMemo(() => {
    const order = ROLE_SECTION_ORDER[roleGroup];
    return [...LAUNCHER_SECTIONS].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [roleGroup]);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return ALL_LAUNCHER_APPS.filter((a) =>
      `${a.title} ${a.short} ${a.description} ${a.badge ?? ""} ${a.keywords ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const recentApps = recentIds
    .map((id) => ALL_LAUNCHER_APPS.find((a) => a.id === id))
    .filter((a): a is AppLauncherItem => !!a);

  if (!isOpen) return null;

  const handleOpenApp = (app: AppLauncherItem) => {
    recordRecentApp(app.id);
    onClose();
  };

  const renderAppRow = (app: AppLauncherItem) => {
    const isPinned = pinnedAppIds.includes(app.id);
    return (
      <Link
        key={app.id}
        href={app.href}
        onClick={() => handleOpenApp(app)}
        className="group flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all text-left"
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="text-xl shrink-0 mt-0.5">{app.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {app.title}
              </span>
              {app.badge && (
                <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  {app.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
              {app.description}
            </p>
          </div>
        </div>

        {/* 우측 핀(즐겨찾기) 버튼 */}
        <button
          type="button"
          onClick={(e) => handleTogglePin(app.id, e)}
          className={`p-1.5 rounded-lg transition-colors ml-2 cursor-pointer shrink-0 ${
            isPinned
              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
              : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
          }`}
          title={isPinned ? "상단 빠른 실행 바에서 제거" : "상단 빠른 실행 바에 핀 고정"}
          aria-label={isPinned ? "핀 제거" : "핀 고정"}
        >
          <Star className={`h-4 w-4 ${isPinned ? "fill-amber-400" : ""}`} />
        </button>
      </Link>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-5 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="전체 서비스"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* 모달 상단 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <TodayAppIcon theme="light" size={44} className="rounded-2xl shadow-md" />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                전체 서비스
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                하고 싶은 일로 찾으세요. 이름이 기억나지 않아도 검색하면 바로 나옵니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="닫기"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 통합 검색 */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="launcher-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예) 공구, 노트, 광고, 구인, 입찰, 일정…"
            autoFocus
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>

        {normalizedQuery ? (
          /* 검색 결과 */
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">
              검색 결과 {searchResults.length}건
            </p>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.map(renderAppRow)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                “{query}”에 해당하는 서비스가 없습니다. 다른 단어로 검색해 보세요.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 최근 사용 */}
            {recentApps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  최근 사용
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recentApps.map((app) => (
                    <Link
                      key={app.id}
                      href={app.href}
                      onClick={() => handleOpenApp(app)}
                      className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <span>{app.icon}</span>
                      <span>{app.short}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 목적별 섹션 (역할에 맞춰 순서 정렬) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderedSections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{sec.title}</h3>
                    <span className="text-[10.5px] text-slate-400 text-right">{sec.subtitle}</span>
                  </div>
                  <div className="space-y-2">{sec.items.map(renderAppRow)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 모달 하단 풋터 안내 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>☆ 핀을 누르면 상단 빠른 실행 바에 고정됩니다</span>
          <div className="flex items-center gap-3">
            <Link href="/terms" onClick={onClose} className="hover:text-slate-600">
              이용약관
            </Link>
            <span>·</span>
            <Link href="/" onClick={onClose} className="text-blue-600 font-bold hover:underline">
              메인 포털로 가기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ============================================================
    [5. 상단 GNB 빠른 실행 핀 바: FastPinnedAppsBar]
   ============================================================ */
export function FastPinnedAppsBar({ className = "" }: { className?: string }) {
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>([]);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  useEffect(() => {
    const loadPinned = () => {
      try {
        const saved = localStorage.getItem("today_pinned_apps");
        if (saved) {
          setPinnedAppIds(JSON.parse(saved));
        } else {
          setPinnedAppIds(["app-local-feed", "app-tnote-sales", "app-desk-recruitment", "app-tnote-desk"]);
        }
      } catch {}
    };

    loadPinned();

    const handleStorageChange = () => loadPinned();
    const handleCustomChange = (e: any) => {
      if (e.detail) setPinnedAppIds(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("today_pinned_apps_changed" as any, handleCustomChange);
    window.addEventListener("today_open_app_launcher", () => setIsLauncherOpen(true));

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("today_pinned_apps_changed" as any, handleCustomChange);
      window.removeEventListener("today_open_app_launcher", () => setIsLauncherOpen(true));
    };
  }, []);

  const allApps = LAUNCHER_SECTIONS.flatMap((s) => s.items);
  const pinnedApps = allApps.filter((a) => pinnedAppIds.includes(a.id));

  return (
    <>
      <div className={`flex items-center gap-1.5 overflow-x-auto text-xs ${className}`}>
        <button
          type="button"
          onClick={() => setIsLauncherOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shrink-0 shadow-2xs"
          title="스마트 마이 메뉴 앱 런처 열기"
        >
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>마이 메뉴</span>
        </button>

        {pinnedApps.map((app) => (
          <Link
            key={app.id}
            href={app.href}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 border border-slate-200/80 transition-colors font-medium shrink-0"
          >
            <span className="text-[11px]">{app.icon}</span>
            <span className="text-[11px]">{app.short}</span>
          </Link>
        ))}
      </div>

      <SmartAppLauncherModal isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
    </>
  );
}

export default UnifiedHomeReturnAnchor;
