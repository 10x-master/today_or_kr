"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  Mic,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import VoiceTaskInput, { type ParsedVoiceTask } from "@/components/workspace/VoiceTaskInput";
import ProviderSearchModal from "@/components/diary/ProviderSearchModal";
import DiaryEventDetailModal from "@/components/diary/DiaryEventDetailModal";
import CommunityTab from "@/components/diary/CommunityTab";
import TeacherEventFormModal from "@/components/diary/TeacherEventFormModal";
import EnhancedNoteCaptureModal from "@/components/tnote/EnhancedNoteCaptureModal";
import TSignRequestModal from "@/components/diary/TSignRequestModal";
import { toDateStr } from "@/lib/diary/dateUtils";
import { getLicenseBadgeInfo } from "@/lib/diary/licenseUtils";
import type { DiaryBrand, DiaryEvent, DiaryMember } from "@/types/diary";

const GRADE_OPTIONS = ["1학년", "2학년", "3학년"];

interface PersonalDiaryEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  source: "voice" | "manual";
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const MEDIA_BADGE: Record<DiaryEvent["media_type"], string | null> = {
  NONE: null,
  YOUTUBE: "▶",
  IMAGE: "🖼",
  VOICE: "🎙",
};

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** 연결된 t.홈페이지 슬러그 → 실제 경로 ("/"로 시작하면 절대경로 그대로, 아니면 /biz/<slug>) */
function resolveHomepageHref(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return slug.startsWith("/") ? slug : `/biz/${slug}`;
}

function TDiaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandSlug = searchParams.get("brand");
  const storageKey = `today_diary_events_${brandSlug || "default"}`;
  const [tab, setTab] = useState<"calendar" | "community">(
    searchParams.get("tab") === "community" ? "community" : "calendar"
  );

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));

  // ?brand=xxx 고정 브랜딩 모드
  const [brand, setBrand] = useState<DiaryBrand | null>(null);
  const [brandEvents, setBrandEvents] = useState<DiaryEvent[]>([]);
  const [brandLoading, setBrandLoading] = useState(!!brandSlug);

  // 폐쇄형 커뮤니티 멤버십 (선생님/학부모/학생)
  const [membership, setMembership] = useState<DiaryMember | null>(null);
  const [joinRole, setJoinRole] = useState<"PARENT" | "STUDENT" | "TEACHER">("PARENT");
  const [joinGrades, setJoinGrades] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  // 일반 포털 모드: 제공자 탐색/구독
  const [allProviders, setAllProviders] = useState<DiaryBrand[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [subscribedEvents, setSubscribedEvents] = useState<DiaryEvent[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 레이어 토글
  const [showPersonalLayer, setShowPersonalLayer] = useState(true);
  const [showSubscribedLayer, setShowSubscribedLayer] = useState(true);

  // 개인 일정
  const [personalEvents, setPersonalEvents] = useState<PersonalDiaryEvent[]>([]);
  const [manualTitle, setManualTitle] = useState("");

  // 상세 모달
  const [detailEvent, setDetailEvent] = useState<DiaryEvent | null>(null);

  // t.note / t.sign 통합 액션바 모달
  const [noteModalEventId, setNoteModalEventId] = useState<string | null>(null);
  const [signModalEvent, setSignModalEvent] = useState<DiaryEvent | null>(null);
  const [signRecipients, setSignRecipients] = useState<DiaryMember[]>([]);

  const [userId, setUserId] = useState("user-001");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // 브랜드 고정 모드: 브랜드 정보, 역할/학년 타깃 필터링된 일정, 내 멤버십 조회
  const fetchBrandData = () => {
    if (!brandSlug) {
      setBrand(null);
      setBrandEvents([]);
      setMembership(null);
      setBrandLoading(false);
      return;
    }
    setBrandLoading(true);
    fetch(`/api/t-diary?brand=${encodeURIComponent(brandSlug)}&userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setBrand(data.brand || null);
        setBrandEvents(data.events || []);
        setMembership(data.membership || null);
      })
      .catch(() => {
        setBrand(null);
        setBrandEvents([]);
        setMembership(null);
      })
      .finally(() => setBrandLoading(false));
  };

  useEffect(() => {
    fetchBrandData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug, userId]);

  // 일반 포털 모드: 전체 제공자 목록(탐색/구독 해석용) 조회
  useEffect(() => {
    if (brandSlug) return;
    fetch("/api/t-diary/providers")
      .then((res) => res.json())
      .then((data) => setAllProviders(data.providers || []))
      .catch(() => setAllProviders([]));
  }, [brandSlug]);

  // 구독 목록 로컬스토리지 복원
  useEffect(() => {
    if (brandSlug) return;
    try {
      const saved = localStorage.getItem("today_diary_subscriptions");
      setSubscribedIds(saved ? JSON.parse(saved) : []);
    } catch {
      setSubscribedIds([]);
    }
  }, [brandSlug]);

  // 구독 중인 제공자들의 공식 행사 일정 조회
  useEffect(() => {
    if (brandSlug || subscribedIds.length === 0) {
      setSubscribedEvents([]);
      return;
    }
    fetch(`/api/t-diary/events?diary_ids=${encodeURIComponent(subscribedIds.join(","))}`)
      .then((res) => res.json())
      .then((data) => setSubscribedEvents(data.events || []))
      .catch(() => setSubscribedEvents([]));
  }, [brandSlug, subscribedIds]);

  // 개인 일정 로컬스토리지 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setPersonalEvents(saved ? JSON.parse(saved) : []);
    } catch {
      setPersonalEvents([]);
    }
  }, [storageKey]);

  // 로그인 사용자 및 구글 캘린더 연동 상태 확인
  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      const uid = user?.id || "user-001";
      setUserId(uid);
      fetch(`/api/auth/google/status?userId=${encodeURIComponent(uid)}`)
        .then((res) => res.json())
        .then((data) => setGoogleConnected(!!data.isConnected))
        .catch(() => {});
    });

    if (searchParams.get("google_sync") === "success") {
      showToast("📅 구글 캘린더 연동이 완료되었습니다!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePersonalEvents = (next: PersonalDiaryEvent[]) => {
    setPersonalEvents(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const addPersonalEvent = (date: string, title: string, source: "voice" | "manual") => {
    const next = [...personalEvents, { id: `diary-personal-${Date.now()}`, date, title, source }];
    savePersonalEvents(next);
    setSelectedDate(date);

    if (googleConnected) {
      fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          summary: title,
          startDateTime: new Date(`${date}T09:00:00`).toISOString(),
        }),
      }).catch(() => {});
    }
  };

  const handleVoiceParsed = (task: ParsedVoiceTask) => {
    const date = task.dueDate || selectedDate;
    addPersonalEvent(date, task.title, "voice");
    showToast(`🎙️ "${task.title}" 일정이 ${date}에 등록되었습니다.`);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    addPersonalEvent(selectedDate, manualTitle.trim(), "manual");
    setManualTitle("");
    showToast(`✅ ${selectedDate}에 일정이 등록되었습니다.`);
  };

  const handleDeletePersonal = (id: string) => {
    savePersonalEvents(personalEvents.filter((e) => e.id !== id));
  };

  const handleToggleSubscribe = (p: DiaryBrand) => {
    const isSubscribed = subscribedIds.includes(p.id);
    const next = isSubscribed ? subscribedIds.filter((id) => id !== p.id) : [...subscribedIds, p.id];
    setSubscribedIds(next);
    try {
      localStorage.setItem("today_diary_subscriptions", JSON.stringify(next));
    } catch {}

    fetch("/api/t-diary/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, diary_id: p.id, action: isSubscribed ? "unsubscribe" : "subscribe" }),
    }).catch(() => {});

    showToast(isSubscribed ? `${p.brand_name} 구독을 해제했습니다.` : `📌 ${p.brand_name}을(를) 구독했습니다.`);
  };

  const handleToggleGoogleSync = () => {
    if (googleConnected) {
      fetch("/api/auth/google/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "disconnect" }),
      }).then(() => {
        setGoogleConnected(false);
        showToast("구글 캘린더 연동이 해제되었습니다.");
      });
      return;
    }

    setIsSyncing(true);
    const currentPath = `/t-diary${brandSlug ? `?brand=${encodeURIComponent(brandSlug)}` : ""}`;
    window.location.href = `/api/auth/google?userId=${encodeURIComponent(userId)}&redirect=${encodeURIComponent(currentPath)}`;
  };

  const handleSwitchTab = (next: "calendar" | "community") => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "community") params.set("tab", "community");
    else params.delete("tab");
    router.replace(`/t-diary?${params.toString()}`);
  };

  const toggleJoinGrade = (grade: string) => {
    setJoinGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  };

  const handleJoinSubmit = async () => {
    if (!brand) return;
    setIsJoining(true);
    try {
      const res = await fetch("/api/t-diary/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: brand.id,
          user_id: userId,
          role: joinRole,
          grade_tags: joinGrades.length ? joinGrades : ["ALL"],
        }),
      });
      const data = await res.json();
      if (data.member) {
        setMembership(data.member);
        showToast("가입 신청이 접수되었습니다. 선생님 승인을 기다려주세요.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const officialEvents = brandSlug ? brandEvents : showSubscribedLayer ? subscribedEvents : [];
  const visiblePersonalEvents = showPersonalLayer ? personalEvents : [];
  const isTeacherOrOwner = membership?.status === "APPROVED" && (membership.role === "TEACHER" || membership.role === "OWNER");
  const licenseInfo = brand ? getLicenseBadgeInfo(brand) : null;

  const handleOpenSign = async (evt: DiaryEvent) => {
    if (!brand) return;
    try {
      const res = await fetch(`/api/t-diary/members?diary_id=${encodeURIComponent(brand.id)}`);
      const data = await res.json();
      setSignRecipients(((data.members || []) as DiaryMember[]).filter((m) => m.status === "APPROVED"));
    } catch {
      setSignRecipients([]);
    }
    setSignModalEvent(evt);
  };

  const handleExportIcs = () => {
    const allEvents = [
      ...officialEvents.map((e) => ({ id: e.id, date: e.event_date, title: e.title, description: e.description || "" })),
      ...visiblePersonalEvents.map((e) => ({ id: e.id, date: e.date, title: e.title, description: "" })),
    ];

    const nowStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const vevents = allEvents
      .map(
        (e) => `BEGIN:VEVENT
UID:${e.id}@today.or.kr
DTSTAMP:${nowStamp}
DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}
SUMMARY:${escapeIcsText(e.title)}
DESCRIPTION:${escapeIcsText(e.description)}
END:VEVENT`
      )
      .join("\r\n");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Today.//t.diary//KO
METHOD:PUBLISH
${vevents}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand?.brand_name || "today"}-diary.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📆 iCal(.ics) 파일로 내보냈습니다.");
  };

  // 캘린더 그리드 계산
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const gridCells: Array<{ day: number; dateStr: string } | null> = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      dateStr: toDateStr(viewYear, viewMonth, i + 1),
    })),
  ];

  const eventsByDate = useMemo(() => {
    const map: Record<string, { official: DiaryEvent[]; personal: PersonalDiaryEvent[] }> = {};
    officialEvents.forEach((e) => {
      map[e.event_date] ??= { official: [], personal: [] };
      map[e.event_date].official.push(e);
    });
    visiblePersonalEvents.forEach((e) => {
      map[e.date] ??= { official: [], personal: [] };
      map[e.date].personal.push(e);
    });
    return map;
  }, [officialEvents, visiblePersonalEvents]);

  const providerNameByDiaryId = useMemo(() => {
    const map: Record<string, string> = {};
    allProviders.forEach((p) => {
      map[p.id] = p.brand_name;
    });
    if (brand) map[brand.id] = brand.brand_name;
    return map;
  }, [allProviders, brand]);

  const homepageHrefByDiaryId = useMemo(() => {
    const map: Record<string, string | null> = {};
    allProviders.forEach((p) => {
      map[p.id] = resolveHomepageHref(p.connected_homepage_slug);
    });
    if (brand) map[brand.id] = resolveHomepageHref(brand.connected_homepage_slug);
    return map;
  }, [allProviders, brand]);

  const selectedDayEvents = eventsByDate[selectedDate] || { official: [], personal: [] };
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const navigateMonth = (delta: number) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* 토스트 */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <UnifiedHomeReturnAnchor currentModule="t-diary" />
          {!brandSlug && (
            <div className="flex items-center gap-2">
              <Link
                href="/t-diary/apply"
                className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors underline underline-offset-2"
              >
                + 제공자 등록 신청
              </Link>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-blue-600" />
                제공자 탐색 / 구독
              </button>
            </div>
          )}
        </div>

        {/* 브랜드 헤더 (?brand=xxx 고정 브랜딩) */}
        {brandSlug && !brandLoading && brand && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.brand_name} className="h-11 w-11 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
                {brand.brand_name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black text-slate-900 truncate">
                {brand.brand_name} 2027 스마트 다이어리
              </h1>
              {brand.contact_info && (
                <p className="text-[11px] text-slate-400 truncate">{brand.contact_info}</p>
              )}
            </div>
            {resolveHomepageHref(brand.connected_homepage_slug) && (
              <a
                href={resolveHomepageHref(brand.connected_homepage_slug)!}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Home className="h-3 w-3 text-blue-600" />
                t.홈페이지
              </a>
            )}
          </div>
        )}

        {/* 라이선스 배지 / 갱신 배너 / 읽기전용 안내 */}
        {brandSlug && brand && licenseInfo && (licenseInfo.showRenewalBanner || licenseInfo.isReadOnly) && (
          <div
            className={`mt-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${
              licenseInfo.isReadOnly
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {licenseInfo.isReadOnly
              ? "⚠️ 라이선스가 만료되어 읽기 전용 모드입니다. 신규 일정·게시글 등록이 제한됩니다."
              : `🔔 라이선스 만료 D-${licenseInfo.daysLeft} — 갱신이 필요합니다.`}
          </div>
        )}

        {/* 캘린더 / 우리 반 커뮤니티 탭 전환 */}
        {brandSlug && brand && (
          <div className="mt-3 flex gap-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => handleSwitchTab("calendar")}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                tab === "calendar" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              캘린더
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("community")}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                tab === "community" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              우리 반 커뮤니티
            </button>
          </div>
        )}

        {/* 커뮤니티 가입 신청 패널 (미가입/승인대기 상태) */}
        {brandSlug && brand && !brandLoading && (!membership || membership.status === "PENDING") && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5">
            {membership?.status === "PENDING" ? (
              <p className="text-xs font-bold text-blue-700">
                가입 신청이 접수되었습니다. 선생님 승인을 기다리고 있어요. ({membership.role === "PARENT" ? "학부모" : membership.role === "STUDENT" ? "학생" : "선생님"} · {membership.grade_tags.join(", ")})
              </p>
            ) : (
              <>
                <p className="text-xs font-bold text-slate-900">우리 반 커뮤니티에 가입하시겠어요?</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  역할과 자녀 학년을 선택하면 선생님 승인 후 해당 학년의 알림장·행사만 모아볼 수 있어요.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(["PARENT", "STUDENT", "TEACHER"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setJoinRole(role)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                        joinRole === role ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {role === "PARENT" ? "학부모" : role === "STUDENT" ? "학생" : "선생님"}
                    </button>
                  ))}
                </div>
                {joinRole !== "TEACHER" && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {GRADE_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleJoinGrade(g)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                          joinGrades.includes(g) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleJoinSubmit}
                  disabled={isJoining || licenseInfo?.isReadOnly}
                  className="mt-2.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {licenseInfo?.isReadOnly ? "라이선스 만료로 가입 신청 불가" : "가입 신청하기"}
                </button>
              </>
            )}
          </div>
        )}

        {!brandSlug && (
          <div className="mt-4">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">t.다이어리 스마트 캘린더</h1>
            <p className="mt-0.5 text-xs text-slate-400">다양한 제공자의 공식 행사 일정을 구독하고 개인 일정과 통합 관리하세요</p>
          </div>
        )}

        {tab === "calendar" && (
        <>
        {/* 레이어 토글 (일반 포털 모드) */}
        {!brandSlug && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPersonalLayer((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                showPersonalLayer ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />내 개인 일정
            </button>
            <button
              type="button"
              onClick={() => setShowSubscribedLayer((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                showSubscribedLayer ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              구독한 공식 행사 ({subscribedIds.length})
            </button>
          </div>
        )}

        {/* 구글 캘린더 연동 / iCal 내보내기 */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleGoogleSync}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              googleConnected
                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{googleConnected ? "구글 캘린더 연동됨" : "구글 캘린더 연동"}</span>
          </button>
          <button
            type="button"
            onClick={handleExportIcs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>iCal(.ics) 내보내기</span>
          </button>
          {isTeacherOrOwner && !licenseInfo?.isReadOnly && (
            <button
              type="button"
              onClick={() => setIsEventFormOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>일정 등록</span>
            </button>
          )}
        </div>

        {/* 월간 캘린더 */}
        <div className="mt-5 rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="이전 달">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button type="button" onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" aria-label="다음 달">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {gridCells.map((cell, idx) => {
              if (!cell) return <div key={`blank-${idx}`} />;
              const dayData = eventsByDate[cell.dateStr];
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const mediaBadges = Array.from(
                new Set((dayData?.official || []).map((e) => MEDIA_BADGE[e.media_type]).filter((b): b is string => !!b))
              );
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-colors cursor-pointer ${
                    isSelected ? "bg-slate-900 text-white font-bold" : isToday ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{cell.day}</span>
                  <span className="flex gap-0.5 h-1">
                    {dayData?.official.length ? <span className="h-1 w-1 rounded-full bg-amber-400" /> : null}
                    {dayData?.personal.length ? <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} /> : null}
                  </span>
                  {mediaBadges.length > 0 && (
                    <span className="flex gap-0.5 text-[8px] leading-none">
                      {mediaBadges.map((b) => (
                        <span key={b}>{b}</span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜 상세 일정 */}
        <div className="mt-5 space-y-2">
          <h2 className="text-xs font-bold text-slate-400">{selectedDate} 일정</h2>

          {selectedDayEvents.official.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setDetailEvent(e)}
              className="w-full text-left rounded-xl border border-amber-100 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>공식 행사 일정</span>
                {MEDIA_BADGE[e.media_type] && <span className="ml-auto text-xs">{MEDIA_BADGE[e.media_type]}</span>}
              </div>
              <p className="mt-1 text-xs font-bold text-slate-900">{e.title}</p>
              {e.description && <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{e.description}</p>}
            </button>
          ))}

          {selectedDayEvents.personal.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-800 truncate">{e.title}</span>
                {e.source === "voice" && <Mic className="h-3 w-3 text-slate-300 shrink-0" />}
              </div>
              <button type="button" onClick={() => handleDeletePersonal(e.id)} className="p-1 text-slate-300 hover:text-rose-600 cursor-pointer shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {!selectedDayEvents.official.length && !selectedDayEvents.personal.length && (
            <p className="text-[11px] text-slate-300">등록된 일정이 없습니다.</p>
          )}

          {/* 수동 일정 추가 */}
          <form onSubmit={handleManualAdd} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20">
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder={`${selectedDate}에 일정 추가`}
              className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!manualTitle.trim()}
              className="flex items-center gap-1 rounded-lg bg-slate-900 disabled:opacity-30 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>추가</span>
            </button>
          </form>
        </div>

        {/* 음성 메모 (t.note) */}
        <div className="mt-5 rounded-2xl border border-slate-100 p-4">
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Mic className="h-3.5 w-3.5 text-blue-600" />
            음성 메모로 바로 일정 등록 (t.note)
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            말씀하신 내용이 자동으로 분석되어 캘린더 날짜에 텍스트로 등록됩니다.
          </p>
          <VoiceTaskInput onTaskParsed={handleVoiceParsed} className="mt-3" />
        </div>
        </>
        )}

        {/* 우리 반 커뮤니티 탭 */}
        {tab === "community" && brand && (
          <CommunityTab
            diaryId={brand.id}
            userId={userId}
            membership={membership}
            isReadOnly={!!licenseInfo?.isReadOnly}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* 제공자 탐색/구독 모달 */}
      <ProviderSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subscribedIds={subscribedIds}
        onToggleSubscribe={handleToggleSubscribe}
      />

      {/* 일정 상세 모달 (t.note / t.sign 통합 액션바 포함) */}
      {detailEvent && (
        <DiaryEventDetailModal
          event={detailEvent}
          providerName={providerNameByDiaryId[detailEvent.diary_id]}
          canManage={isTeacherOrOwner}
          homepageHref={homepageHrefByDiaryId[detailEvent.diary_id] || null}
          onClose={() => setDetailEvent(null)}
          onOpenNote={() => setNoteModalEventId(detailEvent.id)}
          onOpenSign={() => handleOpenSign(detailEvent)}
        />
      )}

      {/* 선생님/운영자 전용: 공개 대상 지정 일정 등록 모달 */}
      {isEventFormOpen && brand && (
        <TeacherEventFormModal
          diaryId={brand.id}
          defaultDate={selectedDate}
          onClose={() => setIsEventFormOpen(false)}
          onCreated={fetchBrandData}
        />
      )}

      {/* [🎙 t.note] 일정 바인딩 멀티미디어 기록 모달 */}
      {noteModalEventId && (
        <EnhancedNoteCaptureModal
          isOpen
          diaryEventId={noteModalEventId}
          userId={userId}
          onClose={() => setNoteModalEventId(null)}
          onSaved={() => showToast("📝 t.note 기록이 저장되었습니다.")}
        />
      )}

      {/* [✍️ t.sign] 전자계약/동의서 카카오톡 발송 모달 */}
      {signModalEvent && (
        <TSignRequestModal
          eventId={signModalEvent.id}
          eventTitle={signModalEvent.title}
          members={signRecipients}
          onClose={() => setSignModalEvent(null)}
          onSent={() => {
            fetchBrandData();
            showToast("✍️ 전자서명 요청이 발송되었습니다.");
          }}
        />
      )}
    </div>
  );
}

export default function TDiaryPage() {
  return (
    <Suspense fallback={null}>
      <TDiaryPageContent />
    </Suspense>
  );
}
