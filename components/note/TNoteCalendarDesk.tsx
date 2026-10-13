"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Hammer,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Tag,
  Wrench,
  X,
} from "lucide-react";
import QuickShareToolbar from "./QuickShareToolbar";

export interface TNoteCalendarDeskProps {
  userId?: string;
  userName?: string;
  dong?: string;
  className?: string;
}

// 캘린더 이벤트 규격
export interface CalendarEventItem {
  id: string;
  date: string; // "2026.10.16"
  day: number;
  time?: string;
  title: string;
  type: "CONSTRUCTION" | "POLICY_FUND" | "GROUP_BUY" | "CIVIC";
  typeLabel: string;
  badgeColor: string;
  dotColor: string;
  dDayText: string;
  location: string;
}

// OSMU 발행된 현장 기록
export interface TNoteTimelineRecord {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
  role: string;
  tag: string;
  syncBizHome: boolean;
  syncLinkPick: boolean;
  hasPhoto?: boolean;
}

const INITIAL_EVENTS: CalendarEventItem[] = [
  {
    id: "evt-16",
    date: "2026.10.16",
    day: 16,
    time: "14:00",
    title: "상계주공 14단지 승강기 제어반 현장 실사 및 CERA 정밀 진단",
    type: "CONSTRUCTION",
    typeLabel: "🔨 시공 실사",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    dotColor: "bg-blue-600",
    dDayText: "D-2",
    location: "상계주공 14단지 관리사무소",
  },
  {
    id: "evt-18",
    date: "2026.10.18",
    day: 18,
    time: "18:00",
    title: "소진공 스마트공방 기술보급 국비 3,600만원 4분기 신청 마감",
    type: "POLICY_FUND",
    typeLabel: "🏛️ 정책자금",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    dotColor: "bg-amber-600",
    dDayText: "D-4",
    location: "소상공인마당 ols.semas.or.kr",
  },
  {
    id: "evt-20",
    date: "2026.10.20",
    day: 20,
    time: "23:59",
    title: "탑소닉 초음파 세척 싱크볼 10인 공구 1차 마감 및 제조사 직발송",
    type: "GROUP_BUY",
    typeLabel: "🛍️ 단지 공구",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    dotColor: "bg-rose-600",
    dDayText: "D-6",
    location: "상계동 단지 직거래 룸",
  },
  {
    id: "evt-25",
    date: "2026.10.25",
    day: 25,
    time: "17:00",
    title: "노원구 노후 공동주택 보수 지자체 매칭 지원사업 (최대 3,000만원) 마감",
    type: "CIVIC",
    typeLabel: "🏢 지자체 공모",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotColor: "bg-emerald-600",
    dDayText: "D-11",
    location: "노원구청 주택과",
  },
];

const INITIAL_TIMELINE: TNoteTimelineRecord[] = [
  {
    id: "tnote-rec-01",
    date: "2026.10.14 11:20",
    title: "승강기 1~4호기 와이어로프 정기 비파괴검사 적합 판정 완료",
    content: "한국승강기안전공단 정밀안전점검 적합 완료. CERA 안전 지수 AAA 유지 및 K-apt 전자공시 바인딩.",
    author: "김민수",
    role: "공인 관리소장 / 엠버서더",
    tag: "시설 점검",
    syncBizHome: true,
    syncLinkPick: true,
    hasPhoto: true,
  },
  {
    id: "tnote-rec-02",
    date: "2026.10.11 16:40",
    title: "소상공인 스마트상점 기술보급 키오스크 도입 정산 완료",
    content: "중기부·소진공 현장 실사 감리 통과. 매장 자동 주문 및 테이블오더 연동 정상 작동 확인.",
    author: "김민수",
    role: "현장 파트너",
    tag: "정책자금",
    syncBizHome: true,
    syncLinkPick: false,
    hasPhoto: false,
  },
];

export default function TNoteCalendarDesk({
  userId = "ambassador-01",
  userName = "김민수 엠버서더",
  dong = "상계동",
  className = "",
}: TNoteCalendarDeskProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("2026.10.16");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(16);

  // OSMU 2-Tap 현장 기록 작성 폼 상태
  const [isWriteFormOpen, setIsWriteFormOpen] = useState(false);
  const [recordTitle, setRecordTitle] = useState("");
  const [recordContent, setRecordContent] = useState("");
  const [recordTag, setRecordTag] = useState("시공 점검");
  const [hasPhotoAttached, setHasPhotoAttached] = useState(true);

  // OSMU 원클릭 동기화 스위치
  const [syncBizHome, setSyncBizHome] = useState(true);
  const [syncLinkPick, setSyncLinkPick] = useState(true);

  // 타임라인 상태
  const [timeline, setTimeline] = useState<TNoteTimelineRecord[]>(INITIAL_TIMELINE);

  // 로컬스토리지 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_tnote_records");
      if (saved) {
        setTimeline(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 구글 캘린더 iCal 동기화
  const handleSyncGoogleCalendar = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast("📅 구글 캘린더 / iCal (시공·정책자금·공구 D-Day) 실시간 동기화 완료!");
    }, 700);
  };

  // 날짜 클릭 시 해당 일자 선택 및 2-Tap 작성 폼 자동 오픈 연계
  const handleSelectDate = (day: number) => {
    const formatted = `2026.10.${day.toString().padStart(2, "0")}`;
    setSelectedDayNumber(day);
    setSelectedDate(formatted);
    setIsWriteFormOpen(true);

    const matchingEvt = INITIAL_EVENTS.find((e) => e.day === day);
    if (matchingEvt) {
      setRecordTitle(`[현장 기록] ${matchingEvt.title}`);
      setRecordTag(matchingEvt.typeLabel.replace(/^[^\s]+\s/, ""));
    } else {
      setRecordTitle(`${formatted} 현장 업무 및 공구 진행 일지`);
    }
  };

  // OSMU 2-Tap 현장 기록 발행
  const handlePublishRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTitle.trim()) {
      showToast("현장 기록 제목을 입력해주세요.");
      return;
    }

    const newRecord: TNoteTimelineRecord = {
      id: `tnote-${Date.now()}`,
      date: `${selectedDate} ${new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })}`,
      title: recordTitle.trim(),
      content: recordContent.trim() || "현장 안전 점검 및 공구 배송 공정이 정상 이행되었습니다.",
      author: userName,
      role: "공인 엠버서더 / 파트너",
      tag: recordTag,
      syncBizHome,
      syncLinkPick,
      hasPhoto: hasPhotoAttached,
    };

    const nextTimeline = [newRecord, ...timeline];
    setTimeline(nextTimeline);

    try {
      localStorage.setItem("today_tnote_records", JSON.stringify(nextTimeline));
      window.dispatchEvent(new CustomEvent("today_tnote_published", { detail: newRecord }));
    } catch {}

    setRecordTitle("");
    setRecordContent("");
    setIsWriteFormOpen(false);

    const syncTargets: string[] = [];
    if (syncBizHome) syncTargets.push("비즈홈 공식 홈페이지");
    if (syncLinkPick) syncTargets.push("LinkPick 추천샵");
    const syncText = syncTargets.length > 0 ? ` [${syncTargets.join(" + ")}]` : "";

    showToast(`✅ [${newRecord.title}] 현장 기록이${syncText}에 원클릭 발행되었습니다!`);
  };

  // 2026년 10월 (31일) 캘린더 생성기
  const daysInMonth = 31;
  const startDayOfWeek = 4; // 2026년 10월 1일은 목요일 (0:일, 1:월, 2:화, 3:수, 4:목)

  return (
    <div className={`space-y-4 ${className} text-slate-900 font-sans`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* [1. 1초 LinkPick 초고속 배포 툴바 (독립 컴포넌트 탑재)]         */}
      {/* ============================================================== */}
      <QuickShareToolbar
        userId={userId}
        userName={userName}
        customUrl={`https://linkpick.co.kr/@${userId.replace(/^@/, "")}`}
      />

      {/* ============================================================== */}
      {/* [2. 구글 캘린더 / iCal 연동 뷰 & 이번 달 주요 마커 시각화]       */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs shadow-2xs">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                  t.note 스마트 데스크 & 구글 캘린더 연동 뷰
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Google Calendar · iCal 연동
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                날짜 클릭 시 해당 일자의 t.note 현장 기록 작성 및 타임라인에 즉시 연결됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSyncGoogleCalendar}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Google Calendar 실시간 동기화"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-amber-600" : "text-slate-500"}`} />
              <span>캘린더 동기화</span>
            </button>
          </div>
        </div>

        {/* 캘린더 상단 월 네비게이션 & 주요 마커 범례 */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">2026년 10월</span>
            <span className="text-[11px] text-slate-400">({dong} 스마트 현장 캘린더)</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>시공 실사</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>정책자금</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span>단지 공구 D-Day</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>지자체 공모</span>
            </span>
          </div>
        </div>

        {/* 월간 캘린더 그리드 (일 ~ 토) */}
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400 border-b border-slate-100 bg-white py-2">
            <div className="text-red-500">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-blue-500">토</div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100">
            {/* 이전 달 빈 칸 */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-16 bg-white/40 p-1.5" />
            ))}

            {/* 1일 ~ 31일 일자 렌더링 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026.10.${day.toString().padStart(2, "0")}`;
              const dayOfWeek = (startDayOfWeek + i) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const isSelected = selectedDayNumber === day;

              const eventsOnDay = INITIAL_EVENTS.filter((e) => e.day === day);
              const hasEvents = eventsOnDay.length > 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`min-h-16 p-1.5 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-amber-50/90 ring-2 ring-amber-500/80 z-10"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : isSunday
                          ? "text-red-500"
                          : isSaturday
                          ? "text-blue-500"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>

                    {/* 이벤트 마커 도트 */}
                    {hasEvents && (
                      <span className="flex gap-0.5">
                        {eventsOnDay.map((e) => (
                          <span
                            key={e.id}
                            className={`h-1.5 w-1.5 rounded-full ${e.dotColor}`}
                            title={e.title}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* 마커 뱃지 라벨 */}
                  <div className="space-y-0.5 mt-1">
                    {eventsOnDay.map((e) => (
                      <div
                        key={e.id}
                        className={`text-[9px] truncate px-1 py-0.2 rounded font-medium border ${e.badgeColor}`}
                      >
                        {e.dDayText} {e.typeLabel.split(" ")[1]}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택 일자 세부 이벤트 카드 바인딩 */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">선택 일자: {selectedDate}</span>
              <span className="text-[11px] text-slate-500">
                (관련 이벤트 {INITIAL_EVENTS.filter((e) => e.day === selectedDayNumber).length}건)
              </span>
            </div>
            {INITIAL_EVENTS.find((e) => e.day === selectedDayNumber) ? (
              <p className="text-[11px] text-slate-700 font-normal">
                📌 {INITIAL_EVENTS.find((e) => e.day === selectedDayNumber)?.title}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 font-normal">
                등록된 공식 마감 일정이 없습니다. 클릭하여 현장 기록을 바로 작성하세요.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsWriteFormOpen((prev) => !prev)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>{isWriteFormOpen ? "작성 폼 닫기" : "현장 기록 2-Tap 작성"}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* [3. 2-Tap 현장 기록 작성 폼 & OSMU 원클릭 발행 스위치]           */}
      {/* ============================================================== */}
      {isWriteFormOpen && (
        <form
          onSubmit={handlePublishRecord}
          className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-xs shadow-2xs">
                ✍️
              </span>
              <div>
                <h4 className="text-xs font-medium text-slate-900 tracking-tight">
                  2-Tap 현장 기록 작성 & OSMU 원클릭 발행
                </h4>
                <p className="text-[10px] text-slate-400 font-normal">
                  기준 일자: {selectedDate} · 작성자: {userName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWriteFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 제목 및 분류 태그 */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                기록 제목
              </label>
              <input
                type="text"
                required
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                placeholder="예: 승강기 1~4호기 와이어로프 정기 검사 현장 기록"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                분류 태그
              </label>
              <select
                value={recordTag}
                onChange={(e) => setRecordTag(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="시설 점검">시설 점검</option>
                <option value="시공 실사">시공 실사</option>
                <option value="정책자금">정책자금</option>
                <option value="단지 공구">단지 공구</option>
                <option value="입대의 협의">입대의 협의</option>
              </select>
            </div>
          </div>

          {/* 본문 내용 */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              현장 업무 요약 및 메모
            </label>
            <textarea
              rows={3}
              value={recordContent}
              onChange={(e) => setRecordContent(e.target.value)}
              placeholder="현장 실사 완료 내용, 자재 규격, 또는 공구 참여 안내 사항을 입력하세요."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 leading-relaxed"
            />
          </div>

          {/* 사진 첨부 시뮬레이션 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <span className="text-[11px] text-slate-700">현장 인증 사진 1장 첨부 (elevator_cera.jpg)</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={hasPhotoAttached}
                onChange={(e) => setHasPhotoAttached(e.target.checked)}
                className="rounded text-slate-900 focus:ring-0"
              />
              <span>사진 포함</span>
            </label>
          </div>

          {/* 🌟 OSMU 원클릭 발행 스위치 (비즈홈 & LinkPick 동기화) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-xs font-medium text-amber-950">
                  OSMU 원클릭 동시 발행 스위치
                </span>
              </div>
              <span className="text-[10px] text-amber-800 font-normal">
                1회 작성으로 2대 허브 자동 배포
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {/* 스위치 1: 비즈홈 공식 홈페이지 노출 */}
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-amber-200/90 cursor-pointer hover:bg-amber-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={syncBizHome}
                  onChange={(e) => setSyncBizHome(e.target.checked)}
                  className="rounded h-4 w-4 text-slate-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-medium text-slate-900">비즈홈 공식 홈페이지 노출</p>
                  <p className="text-[10px] text-slate-500">t.note 현장 타임라인 피드 자동 동기화</p>
                </div>
              </label>

              {/* 스위치 2: LinkPick 추천샵 노출 */}
              <label className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-amber-200/90 cursor-pointer hover:bg-amber-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={syncLinkPick}
                  onChange={(e) => setSyncLinkPick(e.target.checked)}
                  className="rounded h-4 w-4 text-slate-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-medium text-slate-900">LinkPick 추천샵 노출</p>
                  <p className="text-[10px] text-slate-500">모바일 인포크링크 허브 공지 배너 동기화</p>
                </div>
              </label>
            </div>
          </div>

          {/* 발행 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsWriteFormOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-normal transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Send className="h-3.5 w-3.5 text-amber-400" />
              <span>🚀 2-Tap 현장 기록 원클릭 발행</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* [4. t.note 실시간 현장 기록 타임라인 피드]                       */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-medium text-slate-900 tracking-tight">
              t.note 현장 기록 타임라인 피드 ({timeline.length}건)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            비즈홈 & LinkPick 실시간 바인딩
          </span>
        </div>

        <div className="space-y-3">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden"
            >
              <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-900" />
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{item.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 text-[10px]">
                      {item.tag}
                    </span>
                    {item.hasPhoto && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] border border-indigo-100">
                        📷 사진 첨부
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>

                <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                  {item.content}
                </p>

                {/* OSMU 동기화 상태 뱃지 */}
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100/60 text-slate-400">
                  <span>작성자: {item.author} ({item.role})</span>
                  <div className="flex items-center gap-1.5">
                    {item.syncBizHome && (
                      <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> 비즈홈 동기화
                      </span>
                    )}
                    {item.syncLinkPick && (
                      <span className="text-amber-700 font-medium flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> LinkPick 허브 노출
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
