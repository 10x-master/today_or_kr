"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  LayoutGrid,
  List,
  LogOut,
  MapPin,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser, signOutKakao } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";
import TodayCard from "@/components/home/TodayCard";
import TodayCardDetail from "@/components/home/TodayCardDetail";
import SponsoredCard from "@/components/home/SponsoredCard";
import LocalEventCard from "@/components/home/LocalEventCard";
import ResidentVerifyModal from "@/components/apt/ResidentVerifyModal";
import CafeCard from "@/components/places/CafeCard";
import HeroProductRolling from "@/components/home/HeroProductRolling";
import DistrictSearchBar from "@/components/home/DistrictSearchBar";
import AptAnalysisTab from "@/components/home/AptAnalysisTab";
import TodayNotesTab from "@/components/home/TodayNotesTab";
import PwaInstallBanner from "@/components/home/PwaInstallBanner";
import InstallAppButton from "@/components/common/InstallAppButton";
import MyPageTab from "@/components/mobile/tabs/MyPageTab";
import BottomTabBar, { type MobileTab } from "@/components/mobile/BottomTabBar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_REGIONS, DEFAULT_REGION, getRegionByDongName } from "@/lib/demoRegions";
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

export default function Home({ initialDong }: HomeProps = {}) {
  const router = useRouter();
  const initialRegion = initialDong ? getRegionByDongName(initialDong) : DEFAULT_REGION;
  const [region, setRegion] = useState<Region>(initialRegion);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TargetRole>("RESIDENT");
  const [selectedCategory, setSelectedCategory] = useState<OfficialNoticeCategory>("ALL");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [activeTab, setActiveTab] = useState<MobileTab>("feed");

  // 카카오 OAuth & Supabase Auth 사용자 상태
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

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

  const [notices, setNotices] = useState<LocalOfficialNotice[]>([]);
  const [heroProducts, setHeroProducts] = useState<PlatformProduct[]>([]);
  const [adCampaign, setAdCampaign] = useState<AdCampaign | null>(null);
  const [localEvents, setLocalEvents] = useState<LocalComplexEvent[]>(mockLocalComplexEvents);
  const [selectedEvent, setSelectedEvent] = useState<LocalComplexEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 및 북마크 상태
  const [selectedNotice, setSelectedNotice] = useState<LocalOfficialNotice | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedNotices, setBookmarkedNotices] = useState<LocalOfficialNotice[]>([]);

  // 로컬스토리지에서 북마크 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_notes_bookmarks");
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarkedIds(parsed.map((n: LocalOfficialNotice) => n.id));
        setBookmarkedNotices(parsed);
      }
    } catch {
      // 로컬스토리지 오류 무시
    }
  }, []);

  // 행정동별 추천 카페 필터링 (해당 동네 우선, 없으면 전체 지원)
  const cafesForRegion = mockCafePlaces.filter((c) => c.dong === region.dong);
  const displayedCafes: LocalCafePlace[] =
    cafesForRegion.length > 0 ? cafesForRegion : mockCafePlaces;

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

      // 1. 고시공고 조회
      if (supabase) {
        let query = supabase
          .from("local_official_notices")
          .select("*")
          .order("publish_date", { ascending: false });

        if (selectedCategory !== "ALL") {
          query = query.eq("category", selectedCategory);
        }

        const { data: noticeData, error: noticeErr } = await query;

        // 2. 광고 캠페인 조회
        const { data: adData } = await supabase
          .from("ad_campaigns")
          .select("*")
          .eq("is_active", true)
          .limit(1);

          if (!noticeErr && noticeData && noticeData.length > 0) {
          // 역할 필터링 적용 (target_roles가 있는 경우)
          const filtered = noticeData.filter((item: LocalOfficialNotice) => {
            if (!item.target_roles || item.target_roles.length === 0) return true;
            return (
              item.target_roles.includes("ALL") ||
              item.target_roles.includes(selectedRole)
            );
          });

          // 해당 행정동(또는 district_code)에 매칭되는 고시·소식 우선 필터링 렌더링
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

          // 3. 로컬 단지 제휴 이벤트 조회
          try {
            const res = await fetch(`/api/local-events?district_code=${region.code}`);
            if (res.ok) {
              const evtJson = await res.json();
              if (evtJson.events && evtJson.events.length > 0) {
                setLocalEvents(evtJson.events);
              }
            }
          } catch {}

          // 4. 취급제품 및 메인 롤링 제품 조회
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
      if (selectedCategory !== "ALL" && n.category !== selectedCategory) return false;
      if (n.target_roles && !n.target_roles.includes("ALL") && !n.target_roles.includes(selectedRole)) {
        return false;
      }
      return true;
    });

    // 해당 행정동 매칭 우선 정렬
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

    // 취급제품 목업 폴백 로드
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-1 flex-col bg-white">
      {/* 듀얼 PWA Web App Manifest 링크 (Today.) */}
      <link rel="manifest" href="/api/manifest/today" />

      {/* 1. 상단 메인 헤더: 위치 선택 + 역할 선택 칩 */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="px-4 pt-3 pb-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            {/* Today. 브랜드 타이틀 & 위치 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Today<span className="text-indigo-600">.</span>
              </span>

                {/* 위치 선택 드롭다운 (서울 노원구 상계동 고정 칩) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    {region.sido.includes("서울") ? "서울" : region.sido} {region.gugun} {region.dong}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                </button>

                {regionDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                      지역 선택
                    </p>
                    {DEMO_REGIONS.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => {
                          setRegion(r);
                          setRegionDropdownOpen(false);
                          router.push(`/${encodeURIComponent(r.dong)}`);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                          r.code === region.code
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>
                          {r.sido} {r.gugun} {r.dong}
                        </span>
                        {r.code === region.code && (
                          <span className="text-[10px] text-indigo-600 font-bold">선택됨</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 헤더 우측: [취급제품] + [📲 Today. 모바일 앱 등록] + [로그인 / 프로필] */}
            <div className="flex items-center gap-1.5">
              <Link
                href="/products"
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                title="공동주택 특판 취급제품 쇼룸"
              >
                <span>취급제품</span>
              </Link>
              <InstallAppButton appType="TODAY_MAIN" variant="header" />
              <a
                href="/workspace"
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                title="Today Note 업무일지 워크OS"
              >
                <span>Today Note</span>
              </a>

              {/* 카카오 1초 간편 로그인 / 프로필 아바타 & 팝오버 */}
              {currentUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-1 hover:border-slate-300 transition-all cursor-pointer focus:outline-hidden"
                    title="내 계정 정보"
                  >
                    {currentUser.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name || "사용자 프로필"}
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-amber-300"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                        {currentUser.full_name?.slice(0, 1) || "U"}
                      </div>
                    )}
                    <span className="hidden md:inline max-w-[70px] truncate text-xs font-bold text-slate-700 pr-1">
                      {currentUser.full_name || "입주민"}
                    </span>
                  </button>

                  {/* 사용자 프로필 팝오버 */}
                  {userPopoverOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5 mb-2">
                        {currentUser.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={currentUser.avatar_url}
                            alt={currentUser.full_name || "사용자 프로필"}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                            {currentUser.full_name?.slice(0, 1) || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {currentUser.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {currentUser.email || "카카오 연동 계정"}
                          </p>
                          <span className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
                            카카오 1초 인증 회원
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Link
                          href="/workspace"
                          onClick={() => setUserPopoverOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>📋 내 티노트 (t.note)</span>
                          <span className="text-[10px] text-indigo-600 font-bold">이동</span>
                        </Link>

                        <button
                          type="button"
                          onClick={async () => {
                            await signOutKakao();
                            setCurrentUser(null);
                            setUserPopoverOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <span>로그아웃</span>
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FEE500] hover:bg-[#FDD800] active:scale-95 px-2.5 py-1 text-xs font-bold text-[#191919] shadow-2xs transition-all cursor-pointer"
                  title="카카오 1초 간편 로그인"
                >
                  <span className="text-[11px]">💬</span>
                  <span>로그인</span>
                </button>
              )}
            </div>
          </div>

          {/* 행정동 검색창 및 인기 행정동 추천 칩 */}
          <DistrictSearchBar currentDong={region.dong} className="mt-2.5" />

          {/* 역할 선택 칩 ([👤 입주민], [👔 동대표], [🏢 관리소장], [🏠 동네주민]) */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-0.5">
              맞춤 시각:
            </span>
            {TARGET_ROLE_OPTIONS.map((item) => {
              const active = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setSelectedRole(item.role)}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 카테고리 칩 바(가로 스크롤) & 보기 방식 토글 */}
        {activeTab === "feed" && (
          <div className="border-t border-slate-100 px-4 py-2 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              {/* 가로 스크롤 카테고리 칩 바 */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {CATEGORY_CHIPS.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        active
                          ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 보기 방식 토글: [카드 요약보기] vs [리스트 전체보기] */}
              <div className="flex shrink-0 items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                    viewMode === "card"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  aria-label="카드 요약보기"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">카드 요약</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  aria-label="리스트 전체보기"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">리스트</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* PWA 설치 안내 배너 */}
      <PwaInstallBanner target="TODAY_MAIN" appName="Today" />

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 pb-16">
        {/* 탭 1: 동네 피드 */}
        {activeTab === "feed" && (
          <div className="px-4 py-4 sm:px-6">
            {/* 메인 최상단 취급제품 롤링 배너 */}
            <HeroProductRolling products={heroProducts} />

            {/* 상태 바 */}
            <div className="mb-3.5 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-800">{region.dong}</span>
                <span>{selectedCategory === "CAFE" ? "동네 카페 추천" : "공식 팩트 피드"}</span>
                <span className="font-bold text-indigo-600">
                  ({selectedCategory === "CAFE" ? displayedCafes.length : notices.length}건)
                </span>
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                새로고침
              </button>
            </div>

            {/* 카테고리가 동네카페(CAFE)인 경우 카페 피드 전용 렌더링 */}
            {selectedCategory === "CAFE" ? (
              <div className="space-y-4">
                {/* 동네카페 상단 안내 카드 */}
                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">☕</span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {region.dong} 입주민 추천 카페 & 단지 제휴 혜택
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    로스팅 스페셜티부터 베이커리 브런치, 스터디 미팅 라운지까지. 우리 아파트 입주민 혜택을 확인하고 t.note 모임 일정으로 원클릭 저장하세요.
                  </p>
                </div>

                {/* 카페 카드 그리드 / 리스트 */}
                <div
                  className={
                    viewMode === "card"
                      ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
                      : "space-y-3"
                  }
                >
                  {displayedCafes.map((cafe) => (
                    <CafeCard key={cafe.id} cafe={cafe} viewMode={viewMode} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="py-16 text-center text-xs text-slate-400">
                    공식 행정 고시 데이터를 불러오는 중...
                  </div>
                )}

                {!loading && notices.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-xs text-slate-400">
                    선택하신 조건에 해당하는 고시·공고 데이터가 없습니다.
                  </div>
                )}

                {/* 피드 렌더링 + 3+1 네이티브 스폰서드 카드 룰 + 4~5번째 단지 제휴 이벤트 카드 + 추천 카페 슬롯 */}
                {!loading && notices.length > 0 && (
                  <div className="space-y-4">
                    {notices.map((notice, index) => {
                      const isSecondItem = index === 1; // 2번째 아이템 뒤 (추천 카페 프리뷰)
                      const isThirdItem = index === 2; // 3번째 아이템 뒤
                      const isLastItemUnderThree = notices.length < 3 && index === notices.length - 1;
                      const isFourthItem = index === 3; // 4번째 아이템 뒤 (4~5번째 위치)
                      const isFallbackEventSlot = notices.length < 4 && index === notices.length - 1;

                      return (
                        <Fragment key={notice.id}>
                          <TodayCard
                            notice={notice}
                            onSelect={setSelectedNotice}
                            viewMode={viewMode}
                          />

                          {/* 2번째 아이템 뒤: 전체 피드 내 동네 카페 추천 하이라이트 */}
                          {isSecondItem && displayedCafes.length > 0 && (
                            <div className="my-2 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-3.5 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">☕</span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {region.dong} 추천 동네카페 & 입주민 할인
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCategory("CAFE")}
                                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 transition-colors"
                                >
                                  전체보기 ({displayedCafes.length}) →
                                </button>
                              </div>
                              <CafeCard
                                cafe={displayedCafes[0]}
                                viewMode="list"
                              />
                            </div>
                          )}

                          {/* 3번째 아이템 뒤에 스폰서드 카드 1건 자동 삽입 (3+1 룰) */}
                          {(isThirdItem || isLastItemUnderThree) && adCampaign && (
                            <SponsoredCard campaign={adCampaign} />
                          )}

                          {/* 고시 피드 중간(4~5번째)에 로컬 단지 이벤트 카드 배치 */}
                          {(isFourthItem || (isFallbackEventSlot && !isThirdItem)) && localEvents.length > 0 && (
                            <LocalEventCard
                              event={localEvents[0]}
                              onSelect={setSelectedEvent}
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
        )}

        {/* 탭 2: 아파트 분석 */}
        {activeTab === "analysis" && (
          <AptAnalysisTab
            districtCode={region.code}
            dongName={`${region.gugun} ${region.dong}`}
          />
        )}

        {/* 탭 3: 투데이 노트 */}
        {activeTab === "notes" && (
          <TodayNotesTab
            bookmarkedNotices={bookmarkedNotices}
            onSelect={setSelectedNotice}
            onRemoveBookmark={handleRemoveBookmark}
            onNavigateFeed={() => setActiveTab("feed")}
          />
        )}

        {/* 탭 4: 10X 마이페이지 */}
        {activeTab === "mypage" && <MyPageTab />}
      </main>

      {/* 바텀 시트 상세 모달 */}
      {selectedNotice && (
        <TodayCardDetail
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          isBookmarked={bookmarkedIds.includes(selectedNotice.id)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* 아파트링크 입주민 인증 이벤트 게이트 모달 */}
      {selectedEvent && (
        <ResidentVerifyModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
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

      {/* 하단 글로벌 탭 바: [동네 피드] | [아파트 분석] | [투데이 노트] | [10X 마이페이지] */}
      <BottomTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        notesCount={bookmarkedIds.length}
      />
    </div>
  );
}
