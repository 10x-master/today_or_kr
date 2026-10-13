"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  ListTodo,
  LogOut,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser, signOutKakao } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";
import PwaInstallBanner from "@/components/home/PwaInstallBanner";
import InstallAppButton from "@/components/common/InstallAppButton";
import VoiceTaskInput from "@/components/workspace/VoiceTaskInput";
import TodayCardDetail from "@/components/home/TodayCardDetail";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mockOfficialNotices, mockTodayNotes, mockWorkLogs } from "@/lib/db/mockSeed";
import type { LocalOfficialNotice, TodayNote, WorkLog } from "@/types/officialNotice";

type NoteViewMode = "personal" | "complex";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<NoteViewMode>("personal");
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAlertTime, setNewAlertTime] = useState("08:30");
  const [creating, setCreating] = useState(false);

  // 티노트/티단노트 (today_notes) 연동 상태
  const [todayNotes, setTodayNotes] = useState<TodayNote[]>(mockTodayNotes);
  const [allNotices, setAllNotices] = useState<LocalOfficialNotice[]>(mockOfficialNotices);
  const [selectedNotice, setSelectedNotice] = useState<LocalOfficialNotice | null>(null);

  // 구글 캘린더 OAuth 연동 상태
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // 카카오 OAuth & Supabase Auth 연동 상태
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

  // 관심 고시 스크랩 (today_notes) 로컬스토리지 연동
  const [savedNotes, setSavedNotes] = useState<LocalOfficialNotice[]>([]);

  // 단지(kapt_code) 티단노트 상태
  const [kaptCode, setKaptCode] = useState("A113501050");
  const [complexName, setComplexName] = useState("상계주공5단지");

  const personalLinkedNotes = todayNotes.filter((n) => !n.linked_kapt_code);
  const complexLinkedNotes = todayNotes.filter((n) => n.linked_kapt_code === kaptCode);

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data, error: err } = await supabase
          .from("work_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (!err && data && data.length > 0) {
          setLogs(data as WorkLog[]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to mock:", err);
    }

    setLogs(mockWorkLogs);
    setLoading(false);
  };

  const fetchTodayNotes = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data, error: err } = await supabase
          .from("today_notes")
          .select("*")
          .order("created_at", { ascending: false });

        if (!err && data && data.length > 0) {
          setTodayNotes(data as TodayNote[]);
          return;
        }
      }
    } catch (err) {
      console.warn("Supabase today_notes fetch error:", err);
    }

    try {
      const res = await fetch("/api/today-notes");
      if (res.ok) {
        const json = await res.json();
        if (json.notes && json.notes.length > 0) {
          setTodayNotes(json.notes);
          return;
        }
      }
    } catch (err) {
      console.warn("API today-notes fetch error:", err);
    }

    setTodayNotes(mockTodayNotes);
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/official-notices");
      if (res.ok) {
        const json = await res.json();
        if (json.notices && json.notices.length > 0) {
          setAllNotices(json.notices);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    fetchTodayNotes();
    fetchNotices();

    // today_notes 관심 고시 스크랩 불러오기
    try {
      const stored = localStorage.getItem("today_notes_bookmarks");
      if (stored) {
        setSavedNotes(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to load today_notes bookmarks:", err);
    }

    // 구글 캘린더 연동 콜백 감지 (?google_sync=success)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("google_sync") === "success") {
        setSyncToast(
          "구글 캘린더와 성공적으로 연결되었습니다. 이제 티노트 일정이 캘린더로 자동 동기화됩니다."
        );
        window.history.replaceState({}, "", "/workspace");
      }
    }

    // 구글 캘린더 연동 상태 체크
    const checkGoogleStatus = async () => {
      try {
        const res = await fetch("/api/auth/google/status?userId=user-001");
        if (res.ok) {
          const json = await res.json();
          setGoogleConnected(json.isConnected);
          setGoogleEmail(json.email || "");
        }
      } catch (err) {
        console.warn("Google status check error:", err);
      }
    };

    checkGoogleStatus();
  }, []);

  // 토스트 자동 닫기 (4초)
  useEffect(() => {
    if (syncToast) {
      const timer = setTimeout(() => {
        setSyncToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  // 구글 캘린더 연동 해제
  const handleDisconnectGoogle = async () => {
    if (!confirm(`구글 캘린더(${googleEmail}) 연동을 해제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/auth/google/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-001", action: "disconnect" }),
      });
      if (res.ok) {
        setGoogleConnected(false);
        setGoogleEmail("");
        setSyncToast("구글 캘린더 연동이 안전하게 해제되었습니다.");
      }
    } catch (err) {
      console.error("Google disconnect error:", err);
    }
  };

  const handleVoiceParsed = (task: {
    title: string;
    dueDate?: string;
    alertTime?: string;
  }) => {
    setNewTitle(task.title);
    if (task.dueDate) setNewDueDate(task.dueDate);
    if (task.alertTime) setNewAlertTime(task.alertTime);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    const newLogItem: WorkLog = {
      id: `work-${Date.now()}`,
      workspace_id: activeTab === "complex" ? kaptCode : "personal",
      title: newTitle.trim(),
      content_text: newContent.trim() || null,
      due_date: newDueDate || null,
      status: "TODO",
      is_alert_enabled: true,
      alert_time: newAlertTime || "08:30",
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data, error: err } = await supabase
          .from("work_logs")
          .insert({
            title: newLogItem.title,
            content_text: newLogItem.content_text,
            due_date: newLogItem.due_date,
            status: "TODO",
            is_alert_enabled: true,
            alert_time: newLogItem.alert_time,
          })
          .select()
          .single();

        if (!err && data) {
          setLogs((prev) => [data as WorkLog, ...prev]);
          setNewTitle("");
          setNewContent("");
          setNewDueDate("");
          setCreating(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Insert into Supabase failed, saving locally:", err);
    }

    setLogs((prev) => [newLogItem, ...prev]);

    // 일정이 지정된 경우 today_notes 및 구글 캘린더에 자동 실시간 동기화
    if (newDueDate) {
      try {
        const fullDateTime = newDueDate.includes("T")
          ? newDueDate
          : `${newDueDate}T${newAlertTime || "09:00"}:00`;

        const noteRes = await fetch("/api/today-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle.trim(),
            content: newContent.trim() || "",
            due_date: fullDateTime,
            note_type: "SCHEDULE",
            linked_kapt_code: activeTab === "complex" ? kaptCode : null,
            user_id: "user-001",
          }),
        });

        if (noteRes.ok) {
          const noteJson = await noteRes.json();
          if (noteJson.calendar_synced) {
            setSyncToast("📅 구글 캘린더에 일정이 실시간 동기화되었습니다!");
          }
          fetchTodayNotes();
        }
      } catch (calErr) {
        console.warn("Auto calendar sync on handleCreate:", calErr);
      }
    }

    setNewTitle("");
    setNewContent("");
    setNewDueDate("");
    setCreating(false);
  };

  const handleToggleStatus = async (log: WorkLog) => {
    const nextStatus = log.status === "DONE" ? "TODO" : "DONE";
    setLogs((prev) =>
      prev.map((item) =>
        item.id === log.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase
          .from("work_logs")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", log.id);
      }
    } catch (err) {
      console.warn("Update Supabase failed:", err);
    }
  };

  // 구글 캘린더 등록 링크 생성기
  const createGoogleCalendarUrl = (log: WorkLog) => {
    const title = encodeURIComponent(`[티노트] ${log.title}`);
    const details = encodeURIComponent(
      `${log.content_text || ""}\n\n티노트(t.note)에서 등록된 일정`
    );
    const dateStr = log.due_date ? log.due_date.replace(/-/g, "") : "";
    const dates = dateStr
      ? `${dateStr}T090000/${dateStr}T100000`
      : "";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const todoCount = logs.filter((l) => l.status === "TODO").length;
  const inProgressCount = logs.filter((l) => l.status === "IN_PROGRESS").length;
  const doneCount = logs.filter((l) => l.status === "DONE").length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl bg-slate-50 px-4 py-8 sm:px-6">
      {/* 듀얼 PWA Web App Manifest 링크 (t.note) */}
      <link rel="manifest" href="/api/manifest/note" />

      {/* 1. 상단 공식 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-xl font-bold text-slate-900">티노트</h1>
            <span className="text-xs font-semibold text-slate-500">(t.note)</span>
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              워크OS
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              Live
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            개인 스케줄 관리 및 아파트 단지 협업 공사·보조금 일정 공유
          </p>
        </div>

        {/* 우측 상단 액션 바: [📅 구글 캘린더 연동] + [📲 t.note 앱 등록] + Today. 홈 이동 */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {googleConnected ? (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-colors"
              title="구글 캘린더 연동 중 (클릭 시 연동 해제)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">구글 캘린더 동기화 중</span>
              <span className="text-[11px] font-medium text-emerald-700">({googleEmail})</span>
            </button>
          ) : (
            <a
              href="/api/auth/google?userId=user-001"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
              title="구글 캘린더 계정 연결하기"
            >
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              <span>📅 구글 캘린더 연결하기</span>
            </a>
          )}

          <InstallAppButton appType="TODAY_NOTE" variant="header" />
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 transition-colors"
          >
            Today. 홈
          </Link>

          {/* 카카오 1초 간편 로그인 / 프로필 표시 */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserPopoverOpen(!userPopoverOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                title="내 정보"
              >
                {currentUser.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || "프로필"}
                    className="h-4 w-4 rounded-full object-cover ring-1 ring-amber-300"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span className="max-w-[70px] truncate">{currentUser.full_name || "입주민"}</span>
              </button>

              {userPopoverOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="border-b border-slate-100 pb-2 mb-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentUser.email || "카카오 계정 연동"}
                    </p>
                    <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 border border-amber-200">
                      카카오 1초 인증
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOutKakao();
                      setCurrentUser(null);
                      setUserPopoverOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <span>로그아웃</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] active:scale-95 px-3 py-1.5 text-xs font-bold text-[#191919] shadow-2xs transition-all cursor-pointer"
              title="카카오 1초 간편 로그인"
            >
              <span>💬 1초 로그인</span>
            </button>
          )}
        </div>
      </div>

      {/* 실시간 알림 토스트 */}
      {syncToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* PWA 설치 배너: 티노트 (t.note) */}
      <div className="-mx-4 sm:-mx-6 mb-2">
        <PwaInstallBanner target="TODAY_NOTE" appName="티노트 (t.note)" />
      </div>

      {/* 비로그인 방문자 대상 소프트 게이트 안내 배너 */}
      {!currentUser && (
        <div className="mt-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FEE500] text-[#191919] shrink-0 font-bold text-base shadow-2xs">
                💬
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    카카오 1초 간편 로그인으로 내 일정을 안전하게 보관하세요
                  </h3>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    소프트 게이트
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  카카오 계정으로 로그인하시면 내 티노트 일정이 안전하게 클라우드 및 구글 캘린더에 영구 보관됩니다. 비로그인 상태에서도 모든 일정을 자유롭게 둘러보실 수 있습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] active:scale-95 px-4 py-2 text-xs font-bold text-[#191919] shadow-xs shrink-0 cursor-pointer transition-all"
            >
              <span>💬 1초 로그인하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. 상단 탭 스위처: [👤 내 티노트] vs [🏢 단지 티단노트] */}
      <div className="mt-4 flex rounded-2xl bg-slate-200/80 p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeTab === "personal"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4 text-indigo-600" />
          <span>👤 내 티노트 <span className="font-normal text-slate-400 text-[11px]">(t.note)</span></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("complex")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            activeTab === "complex"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="h-4 w-4 text-emerald-600" />
          <span>🏢 단지 티단노트 <span className="font-normal text-slate-400 text-[11px]">(t.단노트)</span></span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 뷰 1: [👤 내 티노트] (개인 스케줄, TODO, 스크랩 고시, 구글 캘린더 연동) */}
      {/* ========================================================================= */}
      {activeTab === "personal" && (
        <div className="space-y-6 mt-6">
          {/* 상단 통계 카드 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs text-slate-500">내 전체 업무</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{logs.length}건</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <p className="text-xs text-amber-700">대기 중 (TODO)</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{todoCount}건</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
              <p className="text-xs text-blue-700">진행 중</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{inProgressCount}건</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <p className="text-xs text-emerald-700">완료 보고</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{doneCount}건</p>
            </div>
          </div>

          {/* 새 업무 등록 폼 (음성 등록 VoiceTaskInput 연동) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Plus className="h-4 w-4 text-indigo-600" />
                새 개인 업무 등록
              </h2>

              {/* 음성 업무 입력 버튼 */}
              <VoiceTaskInput onTaskParsed={handleVoiceParsed} />
            </div>

            <form onSubmit={handleCreate} className="mt-3.5 space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="업무 제목을 입력하거나 마이크로 말씀하세요 (예: '내일 오후 3시 상계2구역 감정평가 현장 확인')"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500">
                    마감 예정일
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500">
                    아침 알림 시간
                  </label>
                  <input
                    type="time"
                    value={newAlertTime}
                    onChange={(e) => setNewAlertTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="세부 메모 및 확인 사항 (선택)"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Bell className="h-3.5 w-3.5 text-indigo-500" />
                  카카오톡 알림톡 및 브라우저 알림 연동
                </span>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? "등록 중..." : "티노트에 추가하기"}
                </button>
              </div>
            </form>
          </div>

          {/* 개인 할 일(TODO) 목록 */}
          <div>
            <div className="flex items-center justify-between pb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ListTodo className="h-4 w-4 text-slate-600" />
                내 업무일지 목록 ({logs.length})
              </h2>
              <button
                type="button"
                onClick={fetchLogs}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                새로고침
              </button>
            </div>

            {loading && (
              <div className="py-12 text-center text-xs text-slate-400">
                업무일지를 불러오는 중입니다...
              </div>
            )}

            {!loading && logs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-xs text-slate-400">
                등록된 업무가 없습니다. 상단에서 첫 업무를 등록해보세요.
              </div>
            )}

            {!loading && logs.length > 0 && (
              <div className="space-y-3">
                {logs.map((log) => {
                  const isDone = log.status === "DONE";

                  return (
                    <div
                      key={log.id}
                      className={`flex items-start justify-between rounded-xl border p-4 transition-all ${
                        isDone
                          ? "border-slate-200 bg-slate-100/70 opacity-75"
                          : "border-slate-200 bg-white shadow-2xs hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(log)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`}
                          aria-label="상태 변경"
                        >
                          {isDone && <CheckCircle2 className="h-4 w-4" />}
                        </button>

                        <div>
                          <h3
                            className={`text-sm font-semibold leading-snug ${
                              isDone
                                ? "line-through text-slate-400"
                                : "text-slate-900"
                            }`}
                          >
                            {log.title}
                          </h3>
                          {log.content_text && (
                            <p className="mt-1 text-xs text-slate-600">
                              {log.content_text}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            {log.due_date && (
                              <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                <Calendar className="h-3 w-3" />
                                {log.due_date}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              알림 {log.alert_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 구글 캘린더 연동 바로가기 */}
                        <a
                          href={createGoogleCalendarUrl(log)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          title="구글 캘린더에 일정 추가"
                        >
                          <Calendar className="h-3 w-3 text-blue-600" />
                          <span className="hidden sm:inline">구글 캘린더</span>
                          <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                        </a>

                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isDone
                              ? "bg-slate-200 text-slate-600"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {isDone ? "완료됨" : "진행예정"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 관심 고시 스크랩 섹션 (today_notes 연동) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Bookmark className="h-4 w-4 text-indigo-600" />
                  나의 티노트 고시 스크랩 보관함 ({personalLinkedNotes.length || savedNotes.length})
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  동네 피드에서 스크랩한 핵심 고시 팩트와 개인 일정 연동함
                </p>
              </div>
              <Link
                href="/"
                className="text-xs text-indigo-600 hover:underline"
              >
                피드에서 더 찾아보기 ↗
              </Link>
            </div>

            {personalLinkedNotes.length === 0 && savedNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                스크랩한 고시가 없습니다. 피드에서 &apos;티노트 (t.note)에 담기&apos;로 스크랩해보세요.
              </p>
            ) : (
              <div className="mt-3.5 space-y-3">
                {personalLinkedNotes.map((note) => {
                  const notice =
                    allNotices.find((n) => n.id === note.linked_notice_id) ||
                    savedNotes.find((n) => n.id === note.linked_notice_id);

                  return (
                    <div
                      key={note.id}
                      onClick={() => notice && setSelectedNotice(notice)}
                      className="cursor-pointer rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-indigo-50">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            📰 투데이 고시 연동
                          </span>
                          {notice && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                              {notice.issuing_agency}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 group-hover:underline">
                          원문 고시 상세 보기 ↗
                        </span>
                      </div>

                      <h4 className="mt-2 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                        {note.title}
                      </h4>

                      {/* 3줄 요약 블록 인라인 카드 렌더링 */}
                      <div className="mt-2.5 rounded-xl border border-indigo-100/70 bg-white/90 p-3 text-[11px] leading-relaxed text-slate-700 space-y-1">
                        {notice ? (
                          <>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-indigo-600 shrink-0">1.</span>
                              <span className="line-clamp-1">{notice.summary_1}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-blue-600 shrink-0">2.</span>
                              <span className="line-clamp-1">{notice.summary_2}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-emerald-600 shrink-0">3.</span>
                              <span className="line-clamp-1">{notice.summary_3}</span>
                            </div>
                          </>
                        ) : (
                          <p className="line-clamp-3 whitespace-pre-line text-slate-600">
                            {note.content}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>마감/게시: {note.due_date || "상시"}</span>
                        <span className="text-indigo-600 font-medium">탭하여 전체 열람</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 뷰 2: [🏢 단지 티단노트] (단지 kapt_code 단위 공유 업무일지, 공사/보조금 일정) */}
      {/* ========================================================================= */}
      {activeTab === "complex" && (
        <div className="space-y-6 mt-6">
          {/* 단지 정보 헤더 */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  단지
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    {complexName} <span className="text-xs font-semibold text-emerald-700">티단노트</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    국토교통부 공동주택 관리번호 (kapt_code): <span className="font-mono font-semibold">{kaptCode}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={kaptCode}
                  onChange={(e) => {
                    setKaptCode(e.target.value);
                    setComplexName(e.target.value === "A113501050" ? "상계주공5단지" : "상계2구역");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="A113501050">상계주공5단지 (A113501050)</option>
                  <option value="A113501020">상계2구역 조합 (정비구역)</option>
                </select>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed border-t border-emerald-100/80 pt-2.5">
              입주자대표회의, 관리사무소, 정비사업 조합 추진위가 함께 확인하는 공식 공사·행정 보조금 공유 보드입니다.
            </p>
          </div>

          {/* 단지 공사 & 행정 보조금 D-Day 브리핑 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Flame className="h-4 w-4 text-amber-500" />
              단지 직접 연관 공사 &amp; 보조금 D-Day 현황
            </h3>

            <div className="mt-3.5 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">
                    [재개발] 상계2구역 사업시행인가 후속 조합원 분양 신청
                  </span>
                  <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    D-30
                  </span>
                </div>
                <p className="mt-1 text-slate-700">
                  지하 3층~지상 25층 2,200세대 공급계획. 관리처분 총회 준비 및 감정평가 일정 안내 대기.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">
                    [교통망] 동북선 경전철 환승 연계 상계역 보행로 도로 확장 공사
                  </span>
                  <span className="rounded-md bg-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                    11월 착공
                  </span>
                </div>
                <p className="mt-1 text-slate-700">
                  국토교통부 고시 제2026-412호: 상계역 ~ 은행사거리 버스베이 정비 및 임시 버스전용차로 운영.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">
                    [구의회 조례] 노원구 20년 이상 노후 아파트 승강기 교체 보조금
                  </span>
                  <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    본회의 의결 대기
                  </span>
                </div>
                <p className="mt-1 text-slate-700">
                  단지별 입대의 보조금 지원 한도 상향 및 신청 자격 요건 완화안 심사 통과.
                </p>
              </div>
            </div>
          </div>

          {/* 단지 협업 공유 업무일지 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-emerald-600" />
              단지 협업팀 공유 업무일지
            </h3>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                    관리사무소
                  </span>
                  <h4 className="mt-1 font-semibold text-slate-900">
                    승강기 보조금 조례 의결 즉시 노원구청 신청 서류 구비 준비
                  </h4>
                  <p className="text-[11px] text-slate-500">담당: 관리소장 이영호</p>
                </div>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  진행 중
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                    동대표회의
                  </span>
                  <h4 className="mt-1 font-semibold text-slate-900">
                    단지 AI 실무 &amp; 디지털 제휴 설명회 15인 이상 참석 서명부 취합
                  </h4>
                  <p className="text-[11px] text-slate-500">담당: 501동 동대표 박성진</p>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  서명 완료
                </span>
              </div>
            </div>
          </div>

          {/* 단지 고시 연동 공유 보드 (today_notes 연동) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Bookmark className="h-4 w-4 text-emerald-600" />
                  단지 공유 고시·인프라 안건 ({complexLinkedNotes.length})
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {complexName} ({kaptCode}) 단지와 직접 연동된 행정 고시·공사 일정
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                {complexName} 공용 보드
              </span>
            </div>

            {complexLinkedNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                단지에 공유된 고시가 없습니다. 피드에서 &apos;단지 티단노트에 공유&apos;로 등록해보세요.
              </p>
            ) : (
              <div className="mt-3.5 space-y-3">
                {complexLinkedNotes.map((note) => {
                  const notice =
                    allNotices.find((n) => n.id === note.linked_notice_id) ||
                    savedNotes.find((n) => n.id === note.linked_notice_id);

                  return (
                    <div
                      key={note.id}
                      onClick={() => notice && setSelectedNotice(notice)}
                      className="cursor-pointer rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/50 p-4 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-emerald-50">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            📰 투데이 고시 연동
                          </span>
                          {notice && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                              {notice.issuing_agency}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:underline">
                          원문 고시 상세 보기 ↗
                        </span>
                      </div>

                      <h4 className="mt-2 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-950 transition-colors">
                        {note.title}
                      </h4>

                      {/* 3줄 요약 블록 인라인 카드 렌더링 */}
                      <div className="mt-2.5 rounded-xl border border-emerald-100/70 bg-white/90 p-3 text-[11px] leading-relaxed text-slate-700 space-y-1">
                        {notice ? (
                          <>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0">1.</span>
                              <span className="line-clamp-1">{notice.summary_1}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-blue-600 shrink-0">2.</span>
                              <span className="line-clamp-1">{notice.summary_2}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-slate-600 shrink-0">3.</span>
                              <span className="line-clamp-1">{notice.summary_3}</span>
                            </div>
                          </>
                        ) : (
                          <p className="line-clamp-3 whitespace-pre-line text-slate-600">
                            {note.content}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>기록일: {note.due_date || "상시"}</span>
                        <span className="text-emerald-700 font-medium">탭하여 전체 열람</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 고시 상세 보기 바텀시트 모달 (선택 시 팝업) */}
      {selectedNotice && (
        <TodayCardDetail
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
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
        nextPath="/workspace"
      />
    </div>
  );
}
