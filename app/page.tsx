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
  Plus,
  RefreshCw,
  Search,
  Sparkles,
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

  // 동네 핀 상태
  const [userPins, setUserPins] = useState<UserDongPin[]>([]);

  // 카카오 OAuth & Supabase Auth 사용자 상태
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

    return () => {
      window.removeEventListener("today_auth_changed", handleAuthChange);
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

  // 바텀 네비게이션 탭 전환 핸들러
  const handleNavChange = (tab: NavTab) => {
    if (tab === "home") {
      setActiveTab("home");
      setSelectedCategory("ALL");
    } else if (tab === "feed") {
      setActiveTab("feed");
    } else if (tab === "notes") {
      setActiveTab("notes");
    }
  };

  const isCurrentDongPinned = userPins.some((p) => p.dong_name === region.dong);

  return (
    /* 모바일 앱 컨테이너 고정: max-w-md mx-auto min-h-screen bg-white relative pb-20 shadow-xl overflow-x-hidden border-x border-slate-200/50 */
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-white pb-20 shadow-xl overflow-x-hidden border-x border-slate-200/60">
      {/* 듀얼 PWA Web App Manifest 링크 (Today.) */}
      <link rel="manifest" href="/api/manifest/today" />

      {/* 1. 미니멀 상단 네비게이션바 (MobileTopBar: [내 동네 ▾], 🔍, 🔔, 👤) */}
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

      {/* 사용자 프로필 팝오버 (프로필 아이콘 클릭 시) */}
      {userPopoverOpen && currentUser && (
        <div className="absolute right-3 top-14 mt-1 w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5 mb-2.5">
            {currentUser.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || "프로필"}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-300"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900">
                {currentUser.full_name?.slice(0, 1) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-black text-slate-900 truncate">
                  {currentUser.full_name}
                </p>
                {superAdmin && (
                  <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.email || "카카오 간편인증 계정"}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-200">
                  {superAdmin ? "👑 최고관리자" : "인증 입주민"}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  핀 {userPins.length}개
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("mypage");
                setUserPopoverOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>👤 10X 마이페이지</span>
              <span className="text-[10px] text-slate-400">보기 →</span>
            </button>
            <Link
              href="/workspace"
              onClick={() => setUserPopoverOpen(false)}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>📋 내 티노트 (t.note)</span>
              <span className="text-[10px] text-amber-600 font-bold">이동 →</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOutKakao();
                setCurrentUser(null);
                setUserPopoverOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <span>로그아웃</span>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 실시간 알림 팝오버 (🔔 아이콘 터치 시) */}
      {isNotificationOpen && (
        <div className="absolute right-3 top-14 mt-1 w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-black text-slate-900">
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
          <div className="space-y-2 text-xs">
            <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-100">
              <p className="font-bold text-amber-950">
                🔔 상계주공5단지 재개발 소식
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                정밀안전진단 통과 고시가 등록되었습니다.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="font-bold text-slate-900">
                ☕ 노원 로스터리 상계점 혜택
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                단지 입주민 음료 10% 현장 할인 혜택이 적용 중입니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 알림 배너 */}
      {feedbackToast && (
        <div className="mx-4 my-2 flex items-center justify-between rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2 z-40">
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

      {/* 둘러보기(읽기 전용) 모드 배너 (내 핀 목록에 없는 동네를 탐색 중일 때) */}
      {!isCurrentDongPinned && !superAdmin && (
        <div className="flex items-center justify-between bg-amber-50/90 px-4 py-2 text-xs border-b border-amber-200/80 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-amber-950 font-bold">
            <Eye className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>'{region.dong}' 둘러보기 모드</span>
          </div>
          <button
            type="button"
            onClick={handleAddCurrentDongPin}
            className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="h-3 w-3 text-amber-400" />
            <span>내 핀에 추가</span>
          </button>
        </div>
      )}

      {/* 최고관리자 활성화 배너 */}
      {superAdmin && (
        <div className="flex items-center justify-between bg-amber-100/90 px-4 py-1.5 text-[11px] font-bold text-amber-950 border-b border-amber-300">
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

      {/* 메인 뷰포트 컨텐츠 */}
      <main className="flex-1 w-full">
        {/* ============================================================== */}
        {/* 탭 1 & 2: 홈 (home) 또는 동네소식 (feed)                       */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "feed") && (
          <div>
            {/* 홈 탭인 경우 상단 미니 롤링 배너 */}
            {activeTab === "home" && (
              <div className="px-4 pt-3 pb-1">
                <HeroProductRolling products={heroProducts} />
              </div>
            )}

            {/* 역할 선택 칩: [👤 입주민], [👔 동대표], [🏢 관리소장], [🏠 동네주민] */}
            <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 bg-white">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                맞춤시각:
              </span>
              {TARGET_ROLE_OPTIONS.map((item) => {
                const active = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 동네소식(feed) 탭이거나 사용자가 카테고리를 눌렀을 때 상단 카테고리 칩 바 */}
            <div className="sticky top-14 z-30 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/95 backdrop-blur-md px-4 py-2 border-b border-slate-100">
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
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      active
                        ? "bg-amber-500 text-white shadow-2xs ring-1 ring-amber-500"
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
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50/60 border-b border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span className="font-bold text-slate-800">{region.dong}</span>
                <span>
                  {selectedCategory === "CAFE" ? "동네 카페" : "실시간 팩트 소식"}
                </span>
                <span className="font-black text-amber-600">
                  ({selectedCategory === "CAFE" ? displayedCafes.length : notices.length}건)
                </span>
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
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

      {/* 6. 하단 네이티브 바텀 네비게이션 ([🏠홈] [💬동네소식] [📅t.note] [📁전체메뉴]) */}
      <MobileBottomNav
        activeTab={
          activeTab === "home"
            ? "home"
            : activeTab === "feed"
            ? "feed"
            : activeTab === "notes"
            ? "notes"
            : "home"
        }
        onChangeTab={handleNavChange}
        onOpenCategorySheet={() => setIsCategorySheetOpen(true)}
        notesCount={bookmarkedIds.length}
      />
    </div>
  );
}
