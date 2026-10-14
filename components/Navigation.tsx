"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[10.5px] shadow-2xs">
        T.
      </div>
      <div className="flex items-center gap-1">
        <span className="font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
          Today.
        </span>
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
        <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-[9px]">
          T
        </div>
        <span>Today.</span>
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
    [3. 스마트 마이 메뉴 앱 런처 데이터 구조]
   ============================================================ */
export interface AppLauncherItem {
  id: string;
  section: "RESIDENT" | "STORE" | "SALES" | "PRODUCTIVITY";
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface LauncherSection {
  id: "RESIDENT" | "STORE" | "SALES" | "PRODUCTIVITY";
  title: string;
  subtitle: string;
  items: AppLauncherItem[];
}

export const LAUNCHER_SECTIONS: LauncherSection[] = [
  {
    id: "RESIDENT",
    title: "🏢 로컬 & 입주민",
    subtitle: "동네 소식, 실시간 피드 및 아파트 자산 관리",
    items: [
      {
        id: "app-local-feed",
        section: "RESIDENT",
        title: "투데이 로컬 피드",
        description: "우리 동네 실시간 소식, 소통 톡, 입주민 인증 커뮤니티",
        href: "/local",
        icon: "📍",
        badge: "실시간",
      },
      {
        id: "app-apt-audit",
        section: "RESIDENT",
        title: "아파트 자산 진단 및 공구 청원",
        description: "단지별 공용부 관리비 감사, 10인 청원 공동구매 및 자산 보고서",
        href: "/?tab=analysis",
        icon: "📊",
        badge: "자산 팩트",
      },
    ],
  },
  {
    id: "STORE",
    title: "🏪 소상공인 & 매장",
    subtitle: "스마트 매장 솔루션, 구인구직 및 로컬 비즈니스",
    items: [
      {
        id: "app-t-homepage",
        section: "STORE",
        title: "t.홈페이지 빌더",
        description: "모바일 원클릭 공식 매장 웹사이트, 카카오 채널 및 단말기 연동",
        href: "/biz/apt-sanggye14",
        icon: "🌐",
        badge: "멀티테넌트",
      },
      {
        id: "app-desk-recruitment",
        section: "STORE",
        title: "알바 ATS 구인 / 근로계약",
        description: "모바일 1초 표준근로계약(t.sign), 지오펜싱 50m 출결 및 3.3% 원천세",
        href: "/desk/recruitment",
        icon: "👥",
        badge: "t.sign/t.check",
      },
      {
        id: "app-partners-ads",
        section: "STORE",
        title: "비즈보드 광고 센터",
        description: "동네 주민 10,000명에게 즉시 알리는 하이퍼로컬 배너 광고",
        href: "/partners",
        icon: "📢",
        badge: "파트너스",
      },
    ],
  },
  {
    id: "SALES",
    title: "💼 전문 영업 & TM",
    subtitle: "현장 필드 세일즈 레이더 및 TM CRM 전문 시스템",
    items: [
      {
        id: "app-tnote-sales",
        section: "SALES",
        title: "t.note Sales (필드 세일즈 & TM CRM)",
        description: "GIS 가맹점 레이더, 수수료 누수 환급 진단, 밀착 TM 동선 관리",
        href: "/admin/radar",
        icon: "🛰️",
        badge: "M-FAD 레이더",
      },
      {
        id: "app-admin-crm",
        section: "SALES",
        title: "최고관리자 통합 CRM",
        description: "서포터즈 100점 배점 심사, 비즈홈 소유권 이전 및 광고 라이브 제어",
        href: "/admin/crm",
        icon: "🛡️",
        badge: "HQ 전용",
      },
      {
        id: "app-tsign-contract",
        section: "SALES",
        title: "t.sign 전자계약",
        description: "3개년 카드수수료 소급 청구 및 비대면 법적 효력 약정 체결",
        href: "/partners",
        icon: "✍️",
        badge: "1초 체결",
      },
    ],
  },
  {
    id: "PRODUCTIVITY",
    title: "⚡ 개인 생산성 & 수익",
    subtitle: "AI 비서, 음성 캡처 및 제휴 수익 파이프라인",
    items: [
      {
        id: "app-tnote-desk",
        section: "PRODUCTIVITY",
        title: "t.note 스마트 데스크",
        description: "AI 일정 비서, 음성 퀵 캡처, 구글 캘린더 양방향 실시간 동기화",
        href: "/desk",
        icon: "⚡",
        badge: "AI 워크OS",
      },
      {
        id: "app-linkpick-hub",
        section: "PRODUCTIVITY",
        title: "링크픽(LinkPick) 수익 허브",
        description: "모바일 1-Page 제휴 솔루션 추천, N차 수수료 자동 정산 허브",
        href: "/p/ambassador-01",
        icon: "🔗",
        badge: "수당 15%",
      },
      {
        id: "app-tnote-workspace",
        section: "PRODUCTIVITY",
        title: "t.note 통합 워크스페이스",
        description: "노트, 캘린더, 로컬 자산 및 협업 관리 전체 뷰포트",
        href: "/workspace",
        icon: "📋",
      },
    ],
  },
];

/** ============================================================
    [4. 스마트 마이 메뉴 허브 모달: SmartAppLauncherModal]
   ============================================================ */
interface SmartAppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartAppLauncherModal({ isOpen, onClose }: SmartAppLauncherModalProps) {
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return ["app-local-feed", "app-tnote-sales", "app-desk-recruitment", "app-tnote-desk"];
    }
    try {
      const saved = localStorage.getItem("today_pinned_apps");
      if (saved) return JSON.parse(saved);
    } catch {}
    return ["app-local-feed", "app-tnote-sales", "app-desk-recruitment", "app-tnote-desk"];
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
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl p-5 sm:p-7 space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* 모달 상단 헤더 */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl shadow-md">
              T.
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  스마트 마이 메뉴 앱 런처
                </h2>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  전사 허브
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                역할별 4대 핵심 서비스로 즉시 진입하고, [☆ 핀]을 눌러 상단 퀵 바에 등록하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4대 기능별 대형 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LAUNCHER_SECTIONS.map((sec) => (
            <div
              key={sec.id}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-baseline justify-between border-b border-slate-200/60 pb-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>{sec.title}</span>
                </h3>
                <span className="text-[10.5px] text-slate-400">{sec.subtitle}</span>
              </div>

              <div className="space-y-2">
                {sec.items.map((app) => {
                  const isPinned = pinnedAppIds.includes(app.id);
                  return (
                    <Link
                      key={app.id}
                      href={app.href}
                      onClick={onClose}
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
                      >
                        <Star className={`h-4 w-4 ${isPinned ? "fill-amber-400" : ""}`} />
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 모달 하단 풋터 안내 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Today Link Ecosystem · 하이퍼로컬 팩트 & 워크OS</span>
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
            <span className="text-[11px]">{app.title.split(" (")[0]}</span>
          </Link>
        ))}
      </div>

      <SmartAppLauncherModal isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} />
    </>
  );
}

export default UnifiedHomeReturnAnchor;
