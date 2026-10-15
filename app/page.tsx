"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Coffee,
  Crown,
  Eye,
  LogOut,
  MapPin,
  Mic,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser, signOutKakao } from "@/lib/auth/kakaoAuth";
import type { AuthProfile, UserDongPin } from "@/types/auth";
import ResidentVerifyModal from "@/components/apt/ResidentVerifyModal";
import HeroProductRolling from "@/components/home/HeroProductRolling";
import AptAnalysisTab from "@/components/home/AptAnalysisTab";
import TodayNotesTab from "@/components/home/TodayNotesTab";
import PwaInstallBanner from "@/components/home/PwaInstallBanner";
import MyPageTab from "@/components/mobile/tabs/MyPageTab";

// 모바일 퍼스트 당근마켓 스타일 신규 레이아웃 컴포넌트
import MobileTopBar from "@/components/layout/MobileTopBar";
import MobileBottomNav, { type NavTab } from "@/components/layout/MobileBottomNav";
import DongPinSheet from "@/components/layout/DongPinSheet";
import GlobalDongSearchSheet from "@/components/layout/GlobalDongSearchSheet";
import CategoryBottomSheet from "@/components/layout/CategoryBottomSheet";
import CompactFeedItem from "@/components/feed/CompactFeedItem";
import FeedDetailSheet from "@/components/feed/FeedDetailSheet";

// 신규 엠버서더 쇼츠, 아파트 B2B 컨설팅, 회원사 소싱 룸, 이용약관, 음성 캡처 모달
import AmbassadorShortsSection from "@/components/portal/AmbassadorShortsSection";
import AptConsultingSection from "@/components/portal/AptConsultingSection";
import CleanTrustScoreCard from "@/components/portal/CleanTrustScoreCard";
import MemberSourcingSection from "@/components/portal/MemberSourcingSection";
import PortalLiveDesk from "@/components/portal/PortalLiveDesk";
import TermsModal from "@/components/auth/TermsModal";
import QuickVoiceCaptureModal from "@/components/note/QuickVoiceCaptureModal";
import PersonaRoleSelector from "@/components/portal/PersonaRoleSelector";
import GovPolicyFundWidget from "@/components/portal/GovPolicyFundWidget";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import {
  FastPinnedAppsBar,
  SmartAppLauncherModal,
  WORK_TAB_LABEL,
  personaToRoleGroup,
} from "@/components/Navigation";
import QuickMenuGrid from "@/components/home/QuickMenuGrid";
import type { UserPersona } from "@/types/persona";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_REGION, getRegionByDongName } from "@/lib/demoRegions";
import {
  addDongPin,
  getUserDongPins,
  isSuperAdmin,
} from "@/lib/dong/pinManager";
import {
  mockOfficialNotices,
  mockAdCampaigns,
  mockLocalComplexEvents,
  mockCafePlaces,
  mockLocalPosts,
} from "@/lib/db/mockSeed";
import type { LocalCafePlace, Region } from "@/types/local";
import type {
  AdCampaign,
  LocalComplexEvent,
  LocalOfficialNotice,
  OfficialNoticeCategory,
  TargetRole,
  PlatformProduct,
} from "@/types/officialNotice";
import { TARGET_ROLE_OPTIONS } from "@/types/officialNotice";

const CATEGORY_CHIPS: Array<{ id: OfficialNoticeCategory; label: string; icon: string }> = [
  { id: "ALL", label: "전체", icon: "✨" },
  { id: "CAFE", label: "동네카페", icon: "☕" },
  { id: "REDEVELOP", label: "재개발·실거래", icon: "🏢" },
  { id: "INFRA", label: "국토부·교통", icon: "🏗️" },
  { id: "EDU", label: "단지 AI교육 공모", icon: "🎓" },
  { id: "COUNCIL", label: "의회·행정", icon: "🏛️" },
  { id: "FESTIVAL", label: "축제·행사", icon: "🎪" },
  { id: "SUBSIDY", label: "지원금", icon: "💡" },
];

/** 카카오 비즈보드형 와이드 롤링 배너 캠페인 목록 (h-64px) */
const BIZBOARD_CAMPAIGNS = [
  {
    id: "biz-1",
    tag: "비즈보드",
    badge: "입주민 10% 할인",
    title: "☕ [노원 로스터리 상계점] 단지 입주민 인증 시 전 메뉴 10% 즉시 할인",
    sub: "상계역 도보 3분 · 스페셜티 원두 당일 로스팅 카페",
    cta: "쿠폰받기 ↗",
    url: "/partners",
  },
  {
    id: "biz-2",
    tag: "단지제휴",
    badge: "지자체 정책자금",
    title: "🏢 2026 소상공인·자영업자 저금리 특례보증 무료 진단 신청 접수",
    sub: "최대 1억원 한도 · 지자체 이차보전 금리 우대 즉시 확인",
    cta: "무료진단 ↗",
    url: "/partners",
  },
  {
    id: "biz-3",
    tag: "특판공구",
    badge: "산지직송 25% OFF",
    title: "🐟 [여수 돌산 어판장] 당일 조업 우럭·반건조 생선 산지 직송 공구",
    sub: "수협 위판 직배송 · 아파트 입주민 한정 무료배송 혜택",
    cta: "공구참여 ↗",
    url: "/partners",
  },
];

export interface HomeProps {
  initialDong?: string;
}

export type MainViewTab = "home" | "feed" | "notes" | "analysis" | "mypage";

export default function Home({ initialDong }: HomeProps = {}) {
  const router = useRouter();
  const initialRegion = initialDong ? getRegionByDongName(initialDong) : DEFAULT_REGION;
  const [region, setRegion] = useState<Region>(initialRegion);

  // 탭 및 필터 상태
  const [activeTab, setActiveTab] = useState<MainViewTab>("home");
  const [selectedRole, setSelectedRole] = useState<TargetRole>("RESIDENT");
  const [selectedCategory, setSelectedCategory] = useState<OfficialNoticeCategory>("ALL");

  // 시트 및 모달 상태 (동네 핀 관리 및 전역 검색)
  const [isDongPinSheetOpen, setIsDongPinSheetOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 약관 모달 및 음성 퀵 캡처 모달
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isQuickVoiceCaptureOpen, setIsQuickVoiceCaptureOpen] = useState(false);

  // 비즈보드 롤링 인덱스 & 사이드바 퀵 메모
  const [bizBoardIndex, setBizBoardIndex] = useState(0);
  const [quickMemoText, setQuickMemoText] = useState("");
  const [quickMemoSavedToast, setQuickMemoSavedToast] = useState(false);

  // 6대 역할별 페르소나 및 우측 스테이지 뷰 상태
  const [currentPersona, setCurrentPersona] = useState<UserPersona>("RESTAURANT");
  const [rightStageView, setRightStageView] = useState<"POLICY_RADAR" | "APT_CONSULTING">("POLICY_RADAR");

  // 페르소나 로컬스토리지 동기화 및 이벤트 리스너
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_user_persona") as UserPersona | null;
      if (saved) {
        setCurrentPersona(saved);
        if (saved === "APT_MANAGER") {
          setRightStageView("APT_CONSULTING");
        }
      }
    } catch {}

    const handlePersonaChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserPersona>;
      if (customEvent.detail) {
        setCurrentPersona(customEvent.detail);
        if (customEvent.detail === "APT_MANAGER") {
          setRightStageView("APT_CONSULTING");
        } else {
          setRightStageView("POLICY_RADAR");
        }
      }
    };

    window.addEventListener("today_persona_changed", handlePersonaChange);
    return () => window.removeEventListener("today_persona_changed", handlePersonaChange);
  }, []);

  // 동네 핀 상태
  const [userPins, setUserPins] = useState<UserDongPin[]>([]);

  // 카카오 OAuth & Supabase Auth 사용자 상태
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAppLauncherModalOpen, setIsAppLauncherModalOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  // 상세 보기 시트 대상
  const [detailNotice, setDetailNotice] = useState<LocalOfficialNotice | null>(null);
  const [detailCafe, setDetailCafe] = useState<LocalCafePlace | null>(null);
  const [detailEvent, setDetailEvent] = useState<LocalComplexEvent | null>(null);

  // 북마크 상태
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedNotices, setBookmarkedNotices] = useState<LocalOfficialNotice[]>([]);

  // 데이터 상태
  const [notices, setNotices] = useState<LocalOfficialNotice[]>([]);
  const [heroProducts, setHeroProducts] = useState<PlatformProduct[]>([]);
  const [adCampaign, setAdCampaign] = useState<AdCampaign | null>(null);
  const [localEvents, setLocalEvents] = useState<LocalComplexEvent[]>(mockLocalComplexEvents);
  const [selectedEventForVerify, setSelectedEventForVerify] = useState<LocalComplexEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // 피드백 토스트
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const superAdmin = isSuperAdmin(currentUser);
  // 역할 그룹(주민/사장님/실무/관리) — 하단 '업무' 탭 라벨과 퀵메뉴 기본 구성에 사용
  const roleGroup = personaToRoleGroup(currentPersona, superAdmin);

  // 카카오 비즈보드 배너 자동 롤링 (4.5초)
  useEffect(() => {
    const timer = setInterval(() => {
      setBizBoardIndex((prev) => (prev + 1) % BIZBOARD_CAMPAIGNS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // 동네 핀 동기화
  const syncPins = () => {
    const pins = getUserDongPins(currentUser?.id || "guest");
    setUserPins(pins);
  };

  useEffect(() => {
    syncPins();
    const handlePinsChange = () => syncPins();
    window.addEventListener("today_pins_changed", handlePinsChange);
    return () => window.removeEventListener("today_pins_changed", handlePinsChange);
  }, [currentUser]);

  // 사용자 로그인 상태 동기화
  useEffect(() => {
    const syncUser = async () => {
      const user = await getCurrentAuthUser();
      setCurrentUser(user);
    };
    syncUser();

    const handleAuthChange = () => {
      syncUser();
    };
    window.addEventListener("today_auth_changed", handleAuthChange);

    const supabase = getSupabaseBrowserClient();
    let sub: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async () => {
        syncUser();
      });
      sub = data.subscription;
    }

    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };
    window.addEventListener("today_open_login_modal", handleOpenLoginModal);

    const handleOpenTermsModal = () => {
      setIsTermsModalOpen(true);
    };
    window.addEventListener("today_open_terms_modal", handleOpenTermsModal);

    const handleOpenAppLauncher = () => {
      setIsAppLauncherModalOpen(true);
    };
    window.addEventListener("today_open_app_launcher", handleOpenAppLauncher);

    return () => {
      window.removeEventListener("today_auth_changed", handleAuthChange);
      window.removeEventListener("today_open_login_modal", handleOpenLoginModal);
      window.removeEventListener("today_open_terms_modal", handleOpenTermsModal);
      window.removeEventListener("today_open_app_launcher", handleOpenAppLauncher);
      sub?.unsubscribe();
    };
  }, []);

  // initialDong 변경 시 region 동기화
  useEffect(() => {
    if (initialDong) {
      setRegion(getRegionByDongName(initialDong));
    }
  }, [initialDong]);

  // 로컬스토리지에서 북마크 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_notes_bookmarks");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarkedIds(parsed.map((n: LocalOfficialNotice) => n.id));
        setBookmarkedNotices(parsed);
      }
    } catch {}
  }, []);

  // 행정동별 추천 카페 필터링
  const cafesForRegion = mockCafePlaces.filter((c) => c.dong === region.dong);
  const displayedCafes: LocalCafePlace[] =
    cafesForRegion.length > 0 ? cafesForRegion : mockCafePlaces;

  // 현재 방문 동네 핀 추가 핸들러
  const handleAddCurrentDongPin = () => {
    const res = addDongPin(region.dong, currentUser);
    setFeedbackToast(res.message);
    syncPins();
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // 북마크 토글 헬퍼
  const handleToggleBookmark = (notice: LocalOfficialNotice) => {
    setBookmarkedNotices((prev) => {
      const exists = prev.some((n) => n.id === notice.id);
      let updated: LocalOfficialNotice[];
      if (exists) {
        updated = prev.filter((n) => n.id !== notice.id);
      } else {
        updated = [notice, ...prev];
      }
      try {
        localStorage.setItem("today_notes_bookmarks", JSON.stringify(updated));
      } catch {}
      setBookmarkedIds(updated.map((n) => n.id));
      return updated;
    });
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarkedNotices((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem("today_notes_bookmarks", JSON.stringify(updated));
      } catch {}
      setBookmarkedIds(updated.map((n) => n.id));
      return updated;
    });
  };

  // Supabase 실시간 데이터 fetch
  const fetchData = async () => {
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (supabase) {
        let query = supabase
          .from("local_official_notices")
          .select("*")
          .order("publish_date", { ascending: false });

        if (selectedCategory !== "ALL" && selectedCategory !== "CAFE") {
          query = query.eq("category", selectedCategory);
        }

        const { data: noticeData, error: noticeErr } = await query;

        const { data: adData } = await supabase
          .from("ad_campaigns")
          .select("*")
          .eq("is_active", true)
          .limit(1);

        if (!noticeErr && noticeData && noticeData.length > 0) {
          const filtered = noticeData.filter((item: LocalOfficialNotice) => {
            if (!item.target_roles || item.target_roles.length === 0) return true;
            return (
              item.target_roles.includes("ALL") ||
              item.target_roles.includes(selectedRole)
            );
          });

          const sorted = [...filtered].sort((a, b) => {
            const aMatch =
              (a.district_code === region.code ? 4 : 0) +
              (a.district_code.slice(0, 5) === region.code.slice(0, 5) ? 1 : 0) +
              (a.impact_zone?.includes(region.dong) || a.title.includes(region.dong) ? 2 : 0);
            const bMatch =
              (b.district_code === region.code ? 4 : 0) +
              (b.district_code.slice(0, 5) === region.code.slice(0, 5) ? 1 : 0) +
              (b.impact_zone?.includes(region.dong) || b.title.includes(region.dong) ? 2 : 0);
            return bMatch - aMatch;
          });

          setNotices(sorted as LocalOfficialNotice[]);
          if (adData && adData.length > 0) {
            setAdCampaign(adData[0] as AdCampaign);
          } else {
            setAdCampaign(mockAdCampaigns[0]);
          }

          try {
            const res = await fetch(`/api/local-events?district_code=${region.code}`);
            if (res.ok) {
              const evtJson = await res.json();
              if (evtJson.events && evtJson.events.length > 0) {
                setLocalEvents(evtJson.events);
              }
            }
          } catch {}

          try {
            const { data: prodData } = await supabase
              .from("platform_products")
              .select("*")
              .eq("is_public", true)
              .eq("is_hero_rolling", true)
              .order("rolling_order", { ascending: true });
            if (prodData && prodData.length > 0) {
              setHeroProducts(prodData as PlatformProduct[]);
            } else {
              const pRes = await fetch("/api/platform-products?hero_only=true");
              if (pRes.ok) {
                const pJson = await pRes.json();
                setHeroProducts(pJson.products || []);
              }
            }
          } catch {}

          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to mock:", err);
    }

    // 폴백 데이터 정렬
    let fallback = mockOfficialNotices.filter((n) => {
      if (selectedCategory !== "ALL" && selectedCategory !== "CAFE" && n.category !== selectedCategory) {
        return false;
      }
      if (n.target_roles && !n.target_roles.includes("ALL") && !n.target_roles.includes(selectedRole)) {
        return false;
      }
      return true;
    });

    fallback.sort((a, b) => {
      const aMatch =
        (a.district_code === region.code ? 4 : 0) +
        (a.district_code.slice(0, 5) === region.code.slice(0, 5) ? 1 : 0) +
        (a.impact_zone?.includes(region.dong) || a.title.includes(region.dong) ? 2 : 0);
      const bMatch =
        (b.district_code === region.code ? 4 : 0) +
        (b.district_code.slice(0, 5) === region.code.slice(0, 5) ? 1 : 0) +
        (b.impact_zone?.includes(region.dong) || b.title.includes(region.dong) ? 2 : 0);
      return bMatch - aMatch;
    });

    setNotices(fallback);
    setAdCampaign(mockAdCampaigns[0]);
    setLocalEvents(mockLocalComplexEvents);

    fetch("/api/platform-products?hero_only=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setHeroProducts(data.products);
      })
      .catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [region.dong, region.code, selectedCategory, selectedRole]);

  // 바텀 네비게이션 탭 전환 핸들러 (5대 탭: 오늘, 동네, 혜택, 업무, MY)
  const handleNavChange = (tab: NavTab) => {
    if (tab === "today" || tab === "neighbors" || tab === "home") {
      setActiveTab("home");
      setSelectedCategory("ALL");
    } else if (tab === "town" || tab === "talk" || tab === "feed") {
      setActiveTab("feed");
    } else if (tab === "benefits" || tab === "notes") {
      setActiveTab("notes");
    } else if (tab === "work") {
      router.push("/workspace");
    } else if (tab === "my") {
      setIsAppLauncherModalOpen(true);
    } else if (tab === "more" || tab === "menu") {
      setIsCategorySheetOpen(true);
    }
  };

  const isCurrentDongPinned = userPins.some((p) => p.dong_name === region.dong);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-amber-500/20 selection:text-amber-950">
      {/* 듀얼 PWA Web App Manifest 링크 (Today.) */}
      <link rel="manifest" href="/api/manifest/today" />

      {/* PC 대화면 3열 포털 컨테이너 (lg:grid-cols-12) */}
      <div className="mx-auto w-full max-w-md lg:max-w-7xl xl:max-w-[1440px] lg:px-4 lg:py-3">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* ============================================================== */}
          {/* Col 1~2 (좌측 260px): 로고, 내 동네 핀(2~5곳 전환), 카테고리 트리, CRM 바로가기 */}
          {/* ============================================================== */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-2 flex-col gap-3 h-auto">
            {/* 로고 & 슬로건 */}
            <div className="border-b border-slate-100 pb-2.5 space-y-1">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-lg">
                  T.
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
                    Today<span className="text-amber-500">.</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-normal">
                    하이퍼로컬 팩트 & 워크OS
                  </p>
                </div>
              </Link>
            </div>

            {/* 내 동네 핀 (2~5곳 전환) */}
            <div className="border-b border-slate-100 pb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-slate-900">내 동네 핀</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDongPinSheetOpen(true)}
                  className="text-[10px] font-normal text-amber-600 hover:underline cursor-pointer"
                >
                  핀 관리 ({userPins.length || 2}/5)
                </button>
              </div>

              <div className="space-y-1">
                {(userPins.length > 0
                  ? userPins
                  : [
                      { id: "p1", user_id: "u1", dong_name: "상계동", pin_type: "VERIFIED" as const, is_primary: true },
                      { id: "p2", user_id: "u1", dong_name: "중계동", pin_type: "VERIFIED" as const, is_primary: false },
                      { id: "p3", user_id: "u1", dong_name: "돌산읍", pin_type: "BONUS" as const, is_primary: false },
                    ]
                ).map((p) => {
                  const isCurrent = p.dong_name === region.dong;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRegion(getRegionByDongName(p.dong_name))}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>📍 {p.dong_name}</span>
                        {isCurrent && (
                          <span className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-medium text-slate-950">
                            현재
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {p.pin_type === "VERIFIED" ? "인증" : "보너스"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsGlobalSearchOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span>전국 동네 검색 워프</span>
              </button>
            </div>

            {/* 카테고리 트리 */}
            <div className="border-b border-slate-100 pb-2.5 space-y-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-medium text-slate-900">카테고리 분류</span>
                <span className="text-[10px] font-normal text-slate-400">8대 분야</span>
              </div>

              <div className="space-y-0.5">
                {CATEGORY_CHIPS.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (activeTab !== "home" && activeTab !== "feed") {
                          setActiveTab("home");
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-amber-50 text-amber-900 font-medium"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* [👑 최고관리자 CRM 바로가기] */}
            <Link
              href="/admin/crm"
              className="flex items-center justify-between rounded-xl bg-slate-900 hover:bg-slate-800 p-2.5 text-white transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium tracking-tight leading-none text-white">
                    최고관리자 통합 CRM
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                    전국 핀 & 파트너스 승인
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>

            {/* 부가 네비게이션 링크 */}
            <div className="border-b border-slate-100 pb-2.5 space-y-0.5 text-xs">
              <Link
                href="/partners"
                className="flex items-center justify-between rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50 font-normal transition-colors"
              >
                <span>🤝 비즈보드 파트너스</span>
                <span className="text-[10px] text-amber-600 font-medium">광고</span>
              </Link>
              <Link
                href="/workspace"
                className="flex items-center justify-between rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50 font-normal transition-colors"
              >
                <span>📋 t.note 워크스페이스</span>
                <span className="text-[10px] text-slate-400">바로가기</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-slate-400 hover:text-slate-600 font-normal text-[11px] transition-colors cursor-pointer text-left"
              >
                <span>이용약관 및 법적 면책</span>
                <span className="text-[10px] text-slate-400">안내</span>
              </button>
            </div>
          </aside>

          {/* ============================================================== */}
          {/* Col 3~9 (중앙 메인 스테이지): 카카오 비즈보드, 4분할 포털 보드, 엠버서더 쇼츠, 고밀도 피드 */}
          {/* ============================================================== */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7 bg-white relative pb-20 lg:pb-8 border-x border-slate-100 overflow-x-hidden min-h-screen lg:min-h-0">
            {/* 모바일 상단 네비게이션바 (MobileTopBar: 모바일에서만 노출, PC는 좌우측 사이드바 활용) */}
            <div className="lg:hidden">
              <MobileTopBar
                dongName={region.dong}
                onOpenDongSelector={() => setIsDongPinSheetOpen(true)}
                onToggleSearch={() => setIsGlobalSearchOpen(true)}
                onOpenNotifications={() => setIsNotificationOpen(true)}
                onOpenProfile={() => {
                  if (currentUser) {
                    setUserPopoverOpen((prev) => !prev);
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                currentUser={currentUser}
                unreadCount={2}
                isSearchActive={isGlobalSearchOpen}
              />
            </div>

            {/* PC 헤더 바 (lg 이상에서 동네 및 팩트 요약 표시) */}
            <div className="hidden lg:flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">
                  📍
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-blue-600">
                    {region.sido} {region.gugun} {region.dong}
                  </h2>
                  <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10.5px] font-bold text-blue-700">
                    실시간 팩트 피드
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 상단 GNB 빠른 실행 핀 바 */}
                <FastPinnedAppsBar className="hidden xl:flex mr-1.5" />

                <button
                  type="button"
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors cursor-pointer border border-slate-100"
                >
                  <Search className="h-3 w-3 text-slate-400" />
                  <span>동네 검색</span>
                </button>
                <button
                  type="button"
                  onClick={fetchData}
                  className="flex items-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors cursor-pointer border border-slate-100"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-blue-600" : ""}`} />
                  <span>새로고침</span>
                </button>

                {/* 🌟 구글 스타일 통합 계정 드롭다운 (PC 모드) */}
                <UserAccountDropdown
                  currentUser={currentUser}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                  onOpenTerms={() => setIsTermsModalOpen(true)}
                  align="right"
                />
              </div>
            </div>

            {/* 실시간 알림 팝오버 (🔔 아이콘 터치 시) */}
            {isNotificationOpen && (
              <div className="absolute right-3 top-14 mt-1 w-72 rounded-xl border border-slate-100 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium text-slate-900">
                      {region.dong} 실시간 소식
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="rounded-lg bg-amber-50/70 p-2">
                    <p className="font-medium text-amber-950">
                      🔔 상계주공5단지 재개발 소식
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-normal">
                      정밀안전진단 통과 고시가 등록되었습니다.
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-medium text-slate-900">
                      ☕ 노원 로스터리 상계점 혜택
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-normal">
                      단지 입주민 음료 10% 현장 할인 혜택이 적용 중입니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 피드백 알림 배너 */}
            {feedbackToast && (
              <div className="mx-4 my-2 flex items-center justify-between rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm animate-in slide-in-from-top-2 z-40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{feedbackToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackToast(null)}
                  className="text-white/80 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {/* 둘러보기(읽기 전용) 모드 배너 */}
            {!isCurrentDongPinned && !superAdmin && (
              <div className="flex items-center justify-between bg-amber-50/90 px-4 py-1.5 text-xs border-b border-amber-200/80 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-amber-950 font-medium">
                  <Eye className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>'{region.dong}' 둘러보기 모드</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCurrentDongPin}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  <Plus className="h-3 w-3 text-amber-400" />
                  <span>내 핀에 추가</span>
                </button>
              </div>
            )}

            {/* 최고관리자 활성화 배너 */}
            {superAdmin && (
              <div className="flex items-center justify-between bg-amber-100/90 px-4 py-1.5 text-[11px] font-medium text-amber-950 border-b border-amber-300">
                <div className="flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                  <span>최고관리자 모드: {region.dong} 전역 제어</span>
                </div>
                <Link href="/products" className="text-amber-800 underline text-[10px]">
                  취급제품 관리 →
                </Link>
              </div>
            )}

            {/* PWA 설치 안내 인라인 배너 */}
            <PwaInstallBanner target="TODAY_MAIN" appName="Today" />

            {/* 1. 카카오 비즈보드형 와이드 롤링 배너 (h-14 / 56px) */}
            <div className="px-3 pt-2 pb-1">
              <div className="relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-between px-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 rounded bg-slate-950 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                    {BIZBOARD_CAMPAIGNS[bizBoardIndex].tag}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-[13px] font-medium text-slate-950 truncate tracking-tight">
                      {BIZBOARD_CAMPAIGNS[bizBoardIndex].title}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-amber-950/80 font-normal truncate">
                      {BIZBOARD_CAMPAIGNS[bizBoardIndex].sub}
                    </p>
                  </div>
                </div>
                <Link
                  href={BIZBOARD_CAMPAIGNS[bizBoardIndex].url}
                  className="shrink-0 ml-2 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  {BIZBOARD_CAMPAIGNS[bizBoardIndex].cta}
                </Link>
              </div>
            </div>

            {/* 2순위: 6대 역할별 다이내믹 페르소나 셀렉터 */}
            <div className="px-3 pt-1 pb-1">
              <PersonaRoleSelector
                activePersona={currentPersona}
                onSelectPersona={(persona) => {
                  setCurrentPersona(persona);
                  if (persona === "APT_MANAGER") {
                    setRightStageView("APT_CONSULTING");
                  } else {
                    setRightStageView("POLICY_RADAR");
                  }
                }}
              />
            </div>

            {/* 3순위: 상단 2열 스테이지 (좌측: CleanTrustScoreCard / 우측: GovPolicyFundWidget or AptConsultingSection) */}
            <div className="p-2 sm:p-2.5 bg-slate-50/40 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-stretch">
                {/* 좌측: CleanTrustScoreCard (공동주택 안심 케어 & 자산 수호 진단 게이지) */}
                <CleanTrustScoreCard
                  currentDong={region.dong}
                  initialApartmentName="상계주공 14단지"
                />

                {/* 우측: 페르소나 연동 정책자금 레이더 or 아파트 B2B 컨설팅 */}
                <div className="flex flex-col h-full space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRightStageView("POLICY_RADAR")}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                          rightStageView === "POLICY_RADAR"
                            ? "bg-slate-900 text-white font-medium"
                            : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                        }`}
                      >
                        <span>🏛️ 중기부·소진공 정책자금</span>
                        {currentPersona !== "APT_MANAGER" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightStageView("APT_CONSULTING")}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                          rightStageView === "APT_CONSULTING"
                            ? "bg-slate-900 text-white font-medium"
                            : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                        }`}
                      >
                        <span>🏢 아파트 B2B 컨설팅</span>
                        {currentPersona === "APT_MANAGER" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {currentPersona === "APT_MANAGER" ? "관리소장 집중 모드" : "맞춤 지원사업 연동"}
                    </span>
                  </div>

                  {rightStageView === "POLICY_RADAR" ? (
                    <GovPolicyFundWidget persona={currentPersona} />
                  ) : (
                    <AptConsultingSection initialApartmentName="상계주공 14단지" />
                  )}
                </div>
              </div>
            </div>

            {/* 2. 📦 회원사 아이템 소싱 룸 (제조 공급 ➔ 엠버서더 중개) */}
            <MemberSourcingSection />

            {/* 3. 4분할 포털 보드: 📢 공지·고시 / 🏢 아파트입찰·민원 / 🗣️ 블라인드고민 / 🛍️ 특판·공구 */}
            <div className="p-2.5 sm:p-3 bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-900 text-[10px] text-amber-400 font-medium">
                    4P
                  </span>
                  <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                    {region.dong} 4분할 포털 라이브 데스크
                  </h3>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  실시간 자동 집계
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1) 📢 공지·고시 */}
                <div className="rounded-xl bg-white p-2.5 space-y-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">📢</span>
                      <span className="text-xs font-medium text-slate-900">공지·고시</span>
                    </div>
                    <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-medium text-amber-900">
                      {notices.length}건
                    </span>
                  </div>
                  <div className="space-y-1">
                    {notices.slice(0, 2).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setDetailNotice(n);
                          setDetailCafe(null);
                          setDetailEvent(null);
                        }}
                        className="flex w-full items-start justify-between gap-2 text-left group cursor-pointer"
                      >
                        <p className="text-[11px] font-normal text-slate-700 group-hover:text-amber-600 line-clamp-1 transition-colors">
                          • {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                          {n.publish_date.slice(5)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2) 🏢 아파트입찰·민원 */}
                <div className="rounded-xl bg-white p-2.5 space-y-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🏢</span>
                      <span className="text-xs font-medium text-slate-900">아파트입찰·민원</span>
                    </div>
                    <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-medium text-indigo-900">
                      단지 팩트
                    </span>
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (localEvents.length > 0) {
                          setDetailEvent(localEvents[0]);
                          setDetailNotice(null);
                          setDetailCafe(null);
                        }
                      }}
                      className="flex w-full items-start justify-between gap-2 text-left group cursor-pointer"
                    >
                      <p className="text-[11px] font-normal text-slate-700 group-hover:text-indigo-600 line-clamp-1 transition-colors">
                        • [상계주공5단지] 안전진단 통과 및 유지보수 입찰
                      </p>
                      <span className="text-[10px] text-indigo-600 font-medium shrink-0">D-7</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (localEvents.length > 1) {
                          setDetailEvent(localEvents[1]);
                          setDetailNotice(null);
                          setDetailCafe(null);
                        }
                      }}
                      className="flex w-full items-start justify-between gap-2 text-left group cursor-pointer"
                    >
                      <p className="text-[11px] font-normal text-slate-700 group-hover:text-indigo-600 line-clamp-1 transition-colors">
                        • [상계2구역] 감정평가 및 세무사 무료 상담 데스크
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-normal">마감임박</span>
                    </button>
                  </div>
                </div>

                {/* 3) 🗣️ 블라인드고민 */}
                <div className="rounded-xl bg-white p-2.5 space-y-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🗣️</span>
                      <span className="text-xs font-medium text-slate-900">블라인드고민</span>
                    </div>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-medium text-emerald-900">
                      익명 톡
                    </span>
                  </div>
                  <div className="space-y-1">
                    {mockLocalPosts.slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between gap-2 text-left"
                      >
                        <p className="text-[11px] font-normal text-slate-700 line-clamp-1">
                          • {post.title}
                        </p>
                        <span className="text-[10px] text-emerald-600 font-medium shrink-0">
                          {post.commentCount}댓글
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4) 🛍️ 특판·공구 */}
                <div className="rounded-xl bg-white p-2.5 space-y-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🛍️</span>
                      <span className="text-xs font-medium text-slate-900">특판·공구</span>
                    </div>
                    <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-medium text-rose-900">
                      단지특가
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Link
                      href="/partners"
                      className="flex w-full items-start justify-between gap-2 text-left group"
                    >
                      <p className="text-[11px] font-normal text-slate-700 group-hover:text-rose-600 line-clamp-1 transition-colors">
                        • [여수 돌산 어판장] 당일 조업 우럭·반건조 생선 25% OFF
                      </p>
                      <span className="text-[10px] text-rose-600 font-medium shrink-0">공구중</span>
                    </Link>
                    <Link
                      href="/products"
                      className="flex w-full items-start justify-between gap-2 text-left group"
                    >
                      <p className="text-[11px] font-normal text-slate-700 group-hover:text-rose-600 line-clamp-1 transition-colors">
                        • [탑소닉] 하이엔드 초음파 세척 싱크볼 B2B 특판 공급
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-normal">제휴</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 🎬 투데이 엠버서더 쇼츠 갤러리 섹션 */}
            <AmbassadorShortsSection />

            {/* 5. 🏢 아파트 공고 4대 라이브 데스크 (관리주체 직발행 / 주민 청원 10인 승인제 / 파트너스) */}
            <div className="px-3 pt-1 pb-1">
              <PortalLiveDesk
                apartmentName={`${region.dong} 아파트 단지`}
                isManager={selectedRole === "MANAGER" || superAdmin}
              />
            </div>

            {/* 메인 뷰포트 컨텐츠 */}
            <main className="flex-1 w-full">
              {/* ============================================================== */}
              {/* 탭 1 & 2: 홈 (home) 또는 동네소식 (feed)                       */}
              {/* ============================================================== */}
              {(activeTab === "home" || activeTab === "feed") && (
                <div>
                  {/* 홈: 빠른 메뉴 (최근 사용 → 핀 → 역할 기본 순 자동 정렬) */}
                  {activeTab === "home" && (
                    <QuickMenuGrid
                      roleGroup={roleGroup}
                      onOpenHomeTab={(tab) => setActiveTab(tab)}
                      onOpenAllServices={() => setIsAppLauncherModalOpen(true)}
                    />
                  )}
                  {/* 역할 선택 칩: [👤 입주민], [👔 동대표], [🏢 관리소장], [🏠 동네주민] */}
                  <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 bg-white">
                    <span className="text-[10px] font-normal text-slate-400 shrink-0">
                      맞춤시각:
                    </span>
                    {TARGET_ROLE_OPTIONS.map((item) => {
                      const active = selectedRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => setSelectedRole(item.role)}
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 상단 카테고리 칩 바 */}
                  <div className="sticky top-0 lg:top-10 z-30 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/95 backdrop-blur-md px-3 py-1.5 border-b border-slate-100">
                    {CATEGORY_CHIPS.map((cat) => {
                      const active = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            if (activeTab === "home" && cat.id !== "ALL") {
                              setActiveTab("feed");
                            }
                          }}
                          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? "bg-amber-500 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 상태 요약 바 */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/40 border-b border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      <span className="font-medium text-slate-800">{region.dong}</span>
                      <span>
                        {selectedCategory === "CAFE" ? "동네 카페" : "실시간 팩트 소식"}
                      </span>
                      <span className="font-medium text-amber-600">
                        ({selectedCategory === "CAFE" ? displayedCafes.length : notices.length}건)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={fetchData}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
                      <span>새로고침</span>
                    </button>
                  </div>

                  {/* 콘텐츠 초경량 슬림 리스트 뷰 (CompactFeedItem) */}
                  <div className="divide-y divide-slate-100">
                    {/* 1. 카테고리가 카페(CAFE)인 경우 */}
                    {selectedCategory === "CAFE" ? (
                      <div>
                        {displayedCafes.map((cafe) => (
                          <CompactFeedItem
                            key={cafe.id}
                            cafe={cafe}
                            onClick={() => {
                              setDetailCafe(cafe);
                              setDetailNotice(null);
                              setDetailEvent(null);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        {loading && (
                          <div className="py-16 text-center text-xs text-slate-400">
                            공식 행정 고시 데이터를 불러오는 중...
                          </div>
                        )}

                        {!loading && notices.length === 0 && (
                          <div className="py-16 text-center text-xs text-slate-400">
                            선택하신 조건에 해당하는 고시·소식이 없습니다.
                          </div>
                        )}

                        {!loading && notices.length > 0 && (
                          <div>
                            {notices.map((notice, index) => {
                              const isSecond = index === 1; // 2번째 항목 뒤 카페 추천
                              const isFourth = index === 3; // 4번째 항목 뒤 단지 이벤트

                              return (
                                <Fragment key={notice.id}>
                                  <CompactFeedItem
                                    notice={notice}
                                    isBookmarked={bookmarkedIds.includes(notice.id)}
                                    onClick={() => {
                                      setDetailNotice(notice);
                                      setDetailCafe(null);
                                      setDetailEvent(null);
                                    }}
                                  />

                                  {/* 2번째 항목 뒤: 동네 카페 추천 인라인 슬림 행 */}
                                  {isSecond && displayedCafes.length > 0 && (
                                    <CompactFeedItem
                                      cafe={displayedCafes[0]}
                                      onClick={() => {
                                        setDetailCafe(displayedCafes[0]);
                                        setDetailNotice(null);
                                        setDetailEvent(null);
                                      }}
                                    />
                                  )}

                                  {/* 4번째 항목 뒤: 단지 제휴 이벤트 인라인 슬림 행 */}
                                  {isFourth && localEvents.length > 0 && (
                                    <CompactFeedItem
                                      event={localEvents[0]}
                                      onClick={() => {
                                        setDetailEvent(localEvents[0]);
                                        setDetailNotice(null);
                                        setDetailCafe(null);
                                      }}
                                    />
                                  )}
                                </Fragment>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 탭 3: 투데이 노트 (notes)                                      */}
              {/* ============================================================== */}
              {activeTab === "notes" && (
                <TodayNotesTab
                  bookmarkedNotices={bookmarkedNotices}
                  onSelect={(notice) => {
                    setDetailNotice(notice);
                    setDetailCafe(null);
                    setDetailEvent(null);
                  }}
                  onRemoveBookmark={handleRemoveBookmark}
                  onNavigateFeed={() => setActiveTab("feed")}
                  apartmentName={`${region.dong} 아파트 단지`}
                />
              )}

              {/* ============================================================== */}
              {/* 탭 4: 아파트 분석 (analysis)                                   */}
              {/* ============================================================== */}
              {activeTab === "analysis" && (
                <AptAnalysisTab
                  districtCode={region.code}
                  dongName={`${region.gugun} ${region.dong}`}
                />
              )}

              {/* ============================================================== */}
              {/* 탭 5: 10X 마이페이지 (mypage)                                  */}
              {/* ============================================================== */}
              {activeTab === "mypage" && <MyPageTab />}
            </main>
          </div>

          {/* ============================================================== */}
          {/* Col 10~12 (우측 360px): 프로필/핀, t.note 퀵 등록, 링크픽 세일즈 */}
          {/* ============================================================== */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col gap-3 h-auto">
            {/* 1. 👤 프로필 및 스마트 마이 메뉴 위젯 */}
            <div className="border-b border-slate-100 pb-3 space-y-2.5">
              {currentUser ? (
                /* 로그인 사용자: 미니멀 사용자 프로필 요약 카드 */
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    {currentUser.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name || "프로필"}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-blue-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-xs">
                        {currentUser.full_name?.slice(0, 1) || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.full_name || "회원"}
                        </p>
                        {superAdmin && (
                          <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 truncate font-normal">
                        {currentUser.email || "카카오 간편인증 회원"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.2 text-[9.5px] font-bold text-blue-700">
                          {superAdmin
                            ? "👑 최고관리자"
                            : currentUser.role === "STORE_OWNER"
                            ? "🏪 매장 파트너"
                            : "인증 회원"}
                        </span>
                        {userPins.length > 0 && (
                          <span className="text-[10px] font-normal text-slate-500">
                            동네 핀 {userPins.length}곳
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 스마트 마이 메뉴 허브 열기 버튼 */}
                  <button
                    type="button"
                    onClick={() => setIsAppLauncherModalOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>스마트 마이 메뉴</span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-100 group-hover:translate-x-0.5 transition-transform">
                      열기 →
                    </span>
                  </button>

                  {/* 프로필 빠른 액션 버튼들 */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 py-1.5 text-[11px] font-normal text-slate-700 transition-colors cursor-pointer border border-slate-100"
                    >
                      <Scale className="h-3 w-3 text-slate-500" />
                      <span>약관·면책</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutKakao();
                        setCurrentUser(null);
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 py-1.5 text-[11px] font-normal text-rose-700 transition-colors cursor-pointer border border-rose-100"
                    >
                      <LogOut className="h-3 w-3 text-rose-500" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 비로그인 방문자: 깔끔한 바로가기 및 간편 로그인 안내 위젯 */
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white font-black text-[10px]">
                        T.
                      </div>
                      <span className="text-xs font-bold text-slate-900">Today Link 포털</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      로그인하시면 관심 동네 등록 및 실시간 팩트 피드를 편리하게 이용하실 수 있습니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-500 py-2 text-xs font-bold text-slate-900 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>💬 간편 로그인</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAppLauncherModalOpen(true)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      <span>마이 메뉴</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-[10.5px] text-slate-400 hover:text-slate-600 transition-colors underline cursor-pointer"
                    >
                      [서비스 약관 및 면책조항]
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. 🎙️ t.note 빠른 등록기 (구글 캘린더 오늘 일정 위젯 연동) */}
            <div className="border-b border-slate-100 pb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-medium text-xs">
                    🎙️
                  </span>
                  <span className="text-xs font-medium text-slate-900">t.note 퀵 등록 & 일정</span>
                </div>
                <Link
                  href="/workspace"
                  className="text-[10px] font-normal text-indigo-600 hover:underline"
                >
                  전체보기 →
                </Link>
              </div>

              {/* 퀵 입력 폼 */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={quickMemoText}
                    onChange={(e) => setQuickMemoText(e.target.value)}
                    placeholder="내일 오후 3시 관리소 미팅..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-2.5 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quickMemoText.trim()) {
                        setQuickMemoSavedToast(true);
                        setQuickMemoText("");
                        setTimeout(() => setQuickMemoSavedToast(false), 2500);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsQuickVoiceCaptureOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 p-0.5 cursor-pointer"
                    title="음성 퀵 캡처"
                  >
                    <Mic className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsQuickVoiceCaptureOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>2-Tap 음성 캡처</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (quickMemoText.trim()) {
                        setQuickMemoSavedToast(true);
                        setQuickMemoText("");
                        setTimeout(() => setQuickMemoSavedToast(false), 2500);
                      }
                    }}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    저장
                  </button>
                </div>

                {quickMemoSavedToast && (
                  <div className="rounded-lg bg-emerald-50 p-1.5 text-[10px] font-medium text-emerald-800 animate-in fade-in">
                    ✓ 일정이 t.note 및 구글 캘린더에 저장되었습니다.
                  </div>
                )}
              </div>

              {/* 구글 캘린더 오늘 일정 위젯 */}
              <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-normal">
                  <span className="flex items-center gap-1 text-slate-800 font-medium">
                    📅 구글 캘린더 오늘 일정 (3)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-normal">● 실시간 연동</span>
                </div>

                <div className="space-y-1">
                  <div className="rounded-lg bg-slate-50/80 p-2 space-y-0.5 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-900">
                        상계주공 14단지 관리소 미팅
                      </span>
                      <span className="rounded bg-indigo-50 px-1 py-0.2 text-[9px] font-normal text-indigo-700">
                        14:00
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">단지 AI 실무 교육 일정 사전 협의</p>
                  </div>

                  <div className="rounded-lg bg-slate-50/80 p-2 space-y-0.5 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-900">
                        노원구청 청년 AI 실무 공모 미팅
                      </span>
                      <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-normal text-emerald-700">
                        16:30
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">공모 제안서 및 동네 고시 연계</p>
                  </div>

                  <div className="rounded-lg bg-slate-50/80 p-2 space-y-0.5 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-900">
                        노원 로스터리 상계점 혜택 시음
                      </span>
                      <span className="rounded bg-amber-50 px-1 py-0.2 text-[9px] font-normal text-amber-700">
                        19:00
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">입주민 10% 상생 할인 매장 방문</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 🔗 링크픽(LinkPick) 세일즈 현황 위젯 및 파트너스 간편 광고 신청 배너 */}
            <div className="border-b border-slate-100 pb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-medium text-xs">
                    🔗
                  </span>
                  <span className="text-xs font-medium text-slate-900">링크픽 세일즈 현황</span>
                </div>
                <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-normal text-amber-900">
                  서포터즈 1기
                </span>
              </div>

              {/* 세일즈 수치 요약 */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-2.5">
                <div>
                  <p className="text-[10px] font-normal text-slate-400">오늘 누적 수익</p>
                  <p className="text-sm font-medium text-slate-900">₩42,500</p>
                </div>
                <div>
                  <p className="text-[10px] font-normal text-slate-400">2주차 누적 정산</p>
                  <p className="text-sm font-medium text-emerald-600">₩1,284,000</p>
                </div>
              </div>

              {/* 인기 제휴 상품 블록 */}
              <div className="rounded-lg bg-slate-50/60 p-2 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 truncate">
                    🐟 여수 돌산 반건조 생선 직송
                  </span>
                  <span className="rounded bg-rose-50 px-1 py-0.2 text-[9px] font-medium text-rose-600">
                    수당 15%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">클릭 154건 · 판매 28건 달성</p>
              </div>

              {/* 파트너스 간편 광고 신청 배너 */}
              <Link
                href="/partners"
                className="block rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 p-2.5 text-slate-950 hover:brightness-105 transition-all text-left"
              >
                <div className="flex items-center justify-between text-[10px] font-medium text-amber-950/80 mb-0.5">
                  <span>📢 로컬 비즈니스 부스트</span>
                  <span className="rounded bg-slate-950 px-1.5 py-0.2 text-amber-400 font-medium">
                    광고 신청
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-900 leading-tight">
                  우리 매장 소식을 동네 주민 10,000명에게 즉시 알리세요
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-950">
                  <span>파트너스 간편 광고 신청하기</span>
                  <span>→</span>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* 2. 동네 핀 관리 바텀시트 (DongPinSheet) */}
      <DongPinSheet
        isOpen={isDongPinSheetOpen}
        onClose={() => setIsDongPinSheetOpen(false)}
        currentUser={currentUser}
        currentDong={region.dong}
        onSelectDong={(selectedDong) => {
          setRegion(getRegionByDongName(selectedDong));
        }}
        onOpenSearch={() => {
          setIsDongPinSheetOpen(false);
          setIsGlobalSearchOpen(true);
        }}
      />

      {/* 3. 최고관리자 전역 검색 & 일반 사용자 검색/둘러보기 시트 (GlobalDongSearchSheet) */}
      <GlobalDongSearchSheet
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        currentUser={currentUser}
        onSelectDong={(selectedDong) => {
          setRegion(getRegionByDongName(selectedDong));
        }}
      />

      {/* 4. 전체 카테고리 그리드 바텀시트 (CategoryBottomSheet) */}
      <CategoryBottomSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onOpenResidentVerify={() => {
          if (localEvents.length > 0) {
            setSelectedEventForVerify(localEvents[0]);
          }
        }}
        onNavigateTab={(tab) => {
          if (tab === "home") handleNavChange("home");
          else if (tab === "feed") handleNavChange("feed");
          else if (tab === "notes") handleNavChange("notes");
          else if (tab === "analysis") setActiveTab("analysis");
        }}
      />

      {/* 5. 부드러운 상세보기 바텀시트 (FeedDetailSheet) */}
      <FeedDetailSheet
        notice={detailNotice}
        cafe={detailCafe}
        event={detailEvent}
        isOpen={!!(detailNotice || detailCafe || detailEvent)}
        onClose={() => {
          setDetailNotice(null);
          setDetailCafe(null);
          setDetailEvent(null);
        }}
        isBookmarked={detailNotice ? bookmarkedIds.includes(detailNotice.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onOpenResidentVerifyModal={(evt) => setSelectedEventForVerify(evt)}
      />

      {/* 아파트 단지 입주민 인증 이벤트 게이트 모달 */}
      {selectedEventForVerify && (
        <ResidentVerifyModal
          event={selectedEventForVerify}
          isOpen={!!selectedEventForVerify}
          onClose={() => setSelectedEventForVerify(null)}
        />
      )}

      {/* 카카오 1초 간편 로그인 모달 */}
      <KakaoLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
        nextPath="/"
      />

      {/* 6. 회원가입 이용약관 및 초상권 면책 동의 모달 */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* 7. 2-Tap 티노트 빠른 음성 캡처 모달 */}
      <QuickVoiceCaptureModal
        isOpen={isQuickVoiceCaptureOpen}
        onClose={() => setIsQuickVoiceCaptureOpen(false)}
        userId={currentUser?.id || "user-001"}
      />

      {/* 8. 하단 5대 고정 탭 바텀 네비게이션 ([오늘] [동네] [혜택] [업무] [MY]) - 모바일 전용 */}
      <MobileBottomNav
        activeTab={
          isAppLauncherModalOpen
            ? "my"
            : activeTab === "feed"
            ? "town"
            : activeTab === "notes"
            ? "benefits"
            : "today"
        }
        onChangeTab={handleNavChange}
        onOpenCategorySheet={() => setIsCategorySheetOpen(true)}
        notesCount={bookmarkedIds.length}
        unreadTalkCount={2}
        workLabel={WORK_TAB_LABEL[roleGroup]}
      />

      {/* 9. 전사 통합 스마트 마이 메뉴 앱 런처 허브 모달 */}
      <SmartAppLauncherModal
        isOpen={isAppLauncherModalOpen}
        onClose={() => setIsAppLauncherModalOpen(false)}
      />
    </div>
  );
}
