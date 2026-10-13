"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Hammer,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  QrCode,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";

interface TNoteCalendarDeskProps {
  userId?: string;
  userName?: string;
  dong?: string;
  className?: string;
}

interface CalendarEventItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  type: "CONSTRUCTION" | "POLICY_FUND" | "GROUP_BUY" | "CIVIC";
  typeLabel: string;
  typeColor: string;
  dDayText: string;
  location: string;
}

const MOCK_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: "evt-1",
    date: "2026.10.16",
    time: "14:00",
    title: "상계주공 14단지 승강기 제어반 현장 실사 및 CERA 정밀 진단",
    type: "CONSTRUCTION",
    typeLabel: "🔨 시공 실사",
    typeColor: "bg-blue-50 text-blue-800 border-blue-200",
    dDayText: "D-2",
    location: "상계주공 14단지 관리사무소",
  },
  {
    id: "evt-2",
    date: "2026.10.18",
    time: "18:00",
    title: "소진공 스마트공방 기술보급 국비 3,600만원 4분기 신청 마감",
    type: "POLICY_FUND",
    typeLabel: "🏛️ 정책자금",
    typeColor: "bg-amber-50 text-amber-900 border-amber-200",
    dDayText: "D-4",
    location: "소상공인마당 ols.semas.or.kr",
  },
  {
    id: "evt-3",
    date: "2026.10.20",
    time: "23:59",
    title: "탑소닉 초음파 세척 싱크볼 10인 공구 1차 마감 및 제조사 직발송",
    type: "GROUP_BUY",
    typeLabel: "🛍️ 단지 공구",
    typeColor: "bg-rose-50 text-rose-800 border-rose-200",
    dDayText: "D-6",
    location: "상계동 단지 직거래 룸",
  },
  {
    id: "evt-4",
    date: "2026.10.25",
    time: "17:00",
    title: "노원구 노후 공동주택 보수 지자체 매칭 지원사업 (최대 3,000만원) 마감",
    type: "CIVIC",
    typeLabel: "🏢 지자체 공모",
    typeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dDayText: "D-11",
    location: "노원구청 주택과",
  },
];

export default function TNoteCalendarDesk({
  userId = "ambassador-01",
  userName = "김민수 엠버서더",
  dong = "상계동",
  className = "",
}: TNoteCalendarDeskProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<CalendarEventItem[]>(MOCK_CALENDAR_EVENTS);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const myLinkPickUrl = `https://today.or.kr/p/${userId}`;
  const displayShortUrl = `linkpick.co.kr/@${userId}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1) [🔗 링크 복사]
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(myLinkPickUrl);
      showToast("내 LinkPick 고유 주소가 복사되었습니다!");
    }
  };

  // 2) [💬 카카오톡 공유]
  const handleKakaoShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(
        myLinkPickUrl
      )}&text=${encodeURIComponent(`[공식 프로필] ${userName}의 단지 공구 및 포트폴리오를 확인하세요!`)}`;
      window.open(shareUrl, "_blank", "width=500,height=600");
      showToast("카카오톡 공유 창이 열렸습니다.");
    }
  };

  // 3) [📋 영업용 문자 복사]
  const handleCopySalesSms = () => {
    if (typeof window !== "undefined") {
      const smsText = `[공식 프로필] ${userName}의 단지 직거래 공구 및 시공 포트폴리오 안내\n👉 ${myLinkPickUrl}\n(상계주공 14단지 승강기 교체 견적 및 특판 상담 가능)`;
      navigator.clipboard.writeText(smsText);
      showToast("영업용 표준 문자 문구가 클립보드에 복사되었습니다!");
    }
  };

  // 구글 캘린더 동기화 트리거
  const handleSyncGoogleCalendar = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast("구글 캘린더(시공/정책자금/공구) 동기화가 완료되었습니다.");
    }, 800);
  };

  const filteredEvents =
    selectedFilter === "ALL" ? events : events.filter((e) => e.type === selectedFilter);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. t.note 상단 고정: 내 LinkPick 초고속 1초 배포 툴바           */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-medium text-sm shadow-xs shrink-0">
              ⚡
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                  내 LinkPick 초고속 1초 배포 툴바
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-normal">
                  모바일 허브 연동
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {displayShortUrl}
              </p>
            </div>
          </div>

          {/* 인포크링크 미리보기 바로가기 */}
          <Link
            href={`/p/${userId}`}
            target="_blank"
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200 transition-colors flex items-center gap-1"
          >
            <span>허브 열기</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
        </div>

        {/* 원클릭 4대 배포 버튼 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1) [🔗 링크 복사] */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-normal border border-slate-100 transition-all cursor-pointer active:scale-98"
          >
            <Copy className="h-3.5 w-3.5 text-amber-600" />
            <span>🔗 링크 복사</span>
          </button>

          {/* 2) [📱 QR코드] */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-normal border border-slate-100 transition-all cursor-pointer active:scale-98"
          >
            <QrCode className="h-3.5 w-3.5 text-indigo-600" />
            <span>📱 QR코드</span>
          </button>

          {/* 3) [💬 카카오톡 공유] */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEE500]/70 hover:bg-[#FEE500] text-[#191919] text-xs font-normal transition-all cursor-pointer active:scale-98 shadow-2xs"
          >
            <MessageSquare className="h-3.5 w-3.5 fill-current" />
            <span>💬 카카오톡</span>
          </button>

          {/* 4) [📋 영업용 문자 복사] */}
          <button
            type="button"
            onClick={handleCopySalesSms}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal transition-all cursor-pointer active:scale-98"
          >
            <Send className="h-3.5 w-3.5 text-amber-400" />
            <span>📋 영업문자 복사</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 구글 캘린더 연동: 시공 일정, 정책자금 마감일, 단지 공구 D-Day */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-medium text-slate-900 tracking-tight">
              통합 스마트 캘린더 데스크
            </h3>
            <span className="text-[10px] text-slate-400 font-normal">
              (시공 · 정책자금 · 단지 공구)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSyncGoogleCalendar}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-normal border border-slate-200 transition-colors cursor-pointer"
              title="구글 캘린더 실시간 동기화"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-amber-600" : ""}`} />
              <span>동기화</span>
            </button>
          </div>
        </div>

        {/* 필터 칩 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: "ALL", label: "전체 일정" },
            { id: "CONSTRUCTION", label: "🔨 시공 실사" },
            { id: "POLICY_FUND", label: "🏛️ 정책자금" },
            { id: "GROUP_BUY", label: "🛍️ 단지 공구" },
            { id: "CIVIC", label: "🏢 지자체 공모" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedFilter(chip.id)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                selectedFilter === chip.id
                  ? "bg-slate-900 text-white font-medium"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 font-normal"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* 캘린더 이벤트 리스트 */}
        <div className="space-y-2 pt-1">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${evt.typeColor}`}
                  >
                    {evt.typeLabel}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {evt.date} {evt.time}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-medium">
                    {evt.dDayText}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-slate-900 leading-snug">
                  {evt.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-normal">
                  📍 {evt.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  showToast(`📅 [${evt.title}] 일정이 구글 캘린더에 저장되었습니다.`);
                }}
                className="shrink-0 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-normal transition-colors"
              >
                캘린더 추가
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QR코드 팝업 모달 */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-2xl bg-white border border-slate-100 shadow-2xl p-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h4 className="text-sm font-medium text-slate-900">{userName} LinkPick</h4>
              <p className="text-xs text-slate-400 font-normal">
                현장 영업 및 명함 인쇄용 고해상도 QR
              </p>
            </div>

            <div className="mx-auto w-40 h-40 rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center shadow-inner">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-slate-900 rounded-lg">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      i % 2 === 0 || i % 3 === 0 ? "bg-white" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono">{displayShortUrl}</p>

            <button
              type="button"
              onClick={() => {
                handleCopyLink();
                setIsQrModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              링크 복사 후 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
