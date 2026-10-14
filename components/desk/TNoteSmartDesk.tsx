"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Square,
  Link2,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Share2,
  Volume2,
  Coins,
  Users,
  Briefcase,
  Clock,
  Pin,
  X,
  Send,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Smartphone,
  Play,
  Pause,
} from "lucide-react";
import type {
  TNoteCard,
  TNoteCardType,
  LinkPickDeskItem,
  DeskApplicantWidgetData,
} from "@/types/desk";
import {
  MOCK_TNOTE_CARDS,
  MOCK_LINKPICK_DESK_ITEMS,
  MOCK_APPLICANT_WIDGET,
} from "@/lib/deskSeed";

interface TNoteSmartDeskProps {
  userId?: string;
  userName?: string;
  className?: string;
}

export default function TNoteSmartDesk({
  userId = "ambassador-01",
  userName = "김민수 엠버서더",
  className = "",
}: TNoteSmartDeskProps) {
  // 1. 카드 데이터 상태
  const [cards, setCards] = useState<TNoteCard[]>(MOCK_TNOTE_CARDS);
  const [linkpickItems, setLinkpickItems] = useState<LinkPickDeskItem[]>(MOCK_LINKPICK_DESK_ITEMS);
  const [applicantWidget] = useState<DeskApplicantWidgetData>(MOCK_APPLICANT_WIDGET);

  // 2. 텔레메트리 상태
  const [geofenceLocation, setGeofenceLocation] = useState<string>("판교역 반경 50m");
  const [isGeofenceActive, setIsGeofenceActive] = useState<boolean>(true);

  // 3. 퀵 입력 바 상태
  const [quickInputType, setQuickInputType] = useState<TNoteCardType | "LINKPICK">("NOTE");
  const [quickTitle, setQuickTitle] = useState<string>("");
  const [quickContent, setQuickContent] = useState<string>("");
  const [quickAddress, setQuickAddress] = useState<string>("");
  const [quickLinkUrl, setQuickLinkUrl] = useState<string>("");
  const [quickLinkPrice, setQuickLinkPrice] = useState<string>("");

  // 음성 STT 상태
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const speechRecognitionRef = useRef<any>(null);

  // 4. 모달 & 토스트 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [contractModalTarget, setContractModalTarget] = useState<TNoteCard | null>(null);
  const [applicantModalOpen, setApplicantModalOpen] = useState<boolean>(false);

  // 오디오 재생 시뮬레이션
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // 로컬 스토리지 동기화
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedCards = localStorage.getItem("today_tnote_cards");
      if (savedCards) setCards(JSON.parse(savedCards));
      const savedLinkpick = localStorage.getItem("today_linkpick_desk_items");
      if (savedLinkpick) setLinkpickItems(JSON.parse(savedLinkpick));
    } catch {}
  }, []);

  const saveCards = (next: TNoteCard[]) => {
    setCards(next);
    try {
      localStorage.setItem("today_tnote_cards", JSON.stringify(next));
    } catch {}
  };

  const saveLinkpick = (next: LinkPickDeskItem[]) => {
    setLinkpickItems(next);
    try {
      localStorage.setItem("today_linkpick_desk_items", JSON.stringify(next));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 음성 녹음 타이머
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Web Speech API STT 토글
  const handleToggleVoiceRecording = () => {
    if (typeof window === "undefined") return;

    if (isRecording) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      showToast("🎙️ 음성 녹음이 종료되었습니다. 텍스트 변환이 완료되었습니다.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // 브라우저가 지원하지 않을 때 시뮬레이션 폴백
      setIsRecording(true);
      setQuickInputType("VOICE");
      showToast("🎙️ 음성 인식을 시작합니다 (브라우저 마이크 시뮬레이션)");
      setTimeout(() => {
        setVoiceTranscript(
          "정자동 화로구이 대표님과 3개년 카드수수료 소급 환급 485만원 약정서 서명 완료. 다음주 월요일 전산 접수 진행."
        );
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setQuickInputType("VOICE");
        showToast("🎙️ 마이크가 켜졌습니다. 말씀하시면 실시간 텍스트로 변환됩니다.");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        if (!quickTitle) {
          setQuickTitle(transcript.slice(0, 25) + "...");
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // 퀵 카드 생성 핸들러
  const handleCreateQuickCard = (e: React.FormEvent) => {
    e.preventDefault();

    if (quickInputType === "LINKPICK") {
      if (!quickTitle.trim() || !quickLinkUrl.trim()) {
        alert("링크픽 상품명과 URL을 입력해주세요.");
        return;
      }
      const newItem: LinkPickDeskItem = {
        id: `lp-${Date.now()}`,
        title: quickTitle.trim(),
        subtitle: "티홈페이지 실시간 공개 제휴 상품",
        item_type: "COUPANG",
        original_url: quickLinkUrl.trim(),
        affiliate_url: quickLinkUrl.trim(),
        coupang_sub_id: `ref-${userId}_desk_${Date.now().toString().slice(-4)}`,
        thumbnail_url:
          "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80",
        display_price: Number(quickLinkPrice) || 19900,
        price_mode: "SHOW_PRICE",
        click_count: 0,
        conversion_count: 0,
        total_commission: 0,
        is_active: true,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLinkpick([newItem, ...linkpickItems]);
      showToast(`🔗 [${newItem.title}] 링크픽 카드가 티홈페이지에 즉시 공개 연동되었습니다!`);
    } else {
      if (!quickTitle.trim() && !voiceTranscript && !quickContent.trim()) {
        alert("내용을 입력해주세요.");
        return;
      }

      const newCard: TNoteCard = {
        id: `card-${Date.now()}`,
        card_type: quickInputType,
        title: quickTitle.trim() || (quickInputType === "VOICE" ? "음성 메모 녹음" : "새로운 메모"),
        content:
          quickContent.trim() ||
          (quickInputType === "VOICE"
            ? voiceTranscript || "음성 녹음 내용이 저장되었습니다."
            : ""),
        voice_audio_url: quickInputType === "VOICE" ? "https://today.or.kr/audio/sample.mp3" : null,
        voice_duration_sec: quickInputType === "VOICE" ? recordingSeconds || 15 : null,
        voice_transcript: quickInputType === "VOICE" ? voiceTranscript : null,
        location_address: quickInputType === "LOCATION" ? quickAddress || "목적지 주소" : null,
        geofence_radius_meters: 50,
        todo_items:
          quickInputType === "TODO"
            ? [
                { id: "td-new-1", text: quickContent || "새 업무 항목", completed: false },
              ]
            : undefined,
        color: "#FFFFFF",
        is_pinned: false,
        is_archived: false,
        order_index: 0,
        tags: [quickInputType],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveCards([newCard, ...cards]);
      showToast(`📝 [${newCard.title}] 카드가 대시보드에 추가되었습니다.`);
    }

    // 폼 리셋
    setQuickTitle("");
    setQuickContent("");
    setQuickAddress("");
    setQuickLinkUrl("");
    setQuickLinkPrice("");
    setVoiceTranscript("");
    setIsRecording(false);
  };

  // 링크픽 공개 토글 스위치 (티홈페이지 실시간 노출 제어)
  const handleToggleLinkActive = (itemId: string) => {
    const updated = linkpickItems.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.is_active;
        showToast(
          nextState
            ? `🟢 [${item.title}] 티홈페이지 공개 노출이 켜졌습니다.`
            : `⚪ [${item.title}] 티홈페이지 공개 노출이 일시 중단되었습니다.`
        );
        return { ...item, is_active: nextState };
      }
      return item;
    });
    saveLinkpick(updated);
  };

  // 체크리스트 항목 토글
  const handleToggleTodo = (cardId: string, todoId: string) => {
    const updated = cards.map((c) => {
      if (c.id === cardId && c.todo_items) {
        const updatedTodos = c.todo_items.map((t) =>
          t.id === todoId ? { ...t, completed: !t.completed } : t
        );
        return { ...c, todo_items: updatedTodos };
      }
      return c;
    });
    saveCards(updated);
  };

  // 체크리스트 항목 추가
  const handleAddTodoItem = (cardId: string, text: string) => {
    if (!text.trim()) return;
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        const items = c.todo_items || [];
        return {
          ...c,
          todo_items: [...items, { id: `td-${Date.now()}`, text: text.trim(), completed: false }],
        };
      }
      return c;
    });
    saveCards(updated);
  };

  // 카드 핀 토글
  const handleTogglePin = (cardId: string) => {
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, is_pinned: !c.is_pinned } : c
    );
    saveCards(updated);
  };

  // 카드 삭제
  const handleDeleteCard = (cardId: string) => {
    if (!confirm("정말 이 카드를 삭제하시겠습니까?")) return;
    saveCards(cards.filter((c) => c.id !== cardId));
    showToast("🗑️ 카드가 삭제되었습니다.");
  };

  // 위치 도착 웹푸시 시뮬레이션
  const handleSimulateArrival = (card: TNoteCard) => {
    showToast(
      `🔔 [t.check 도착 알림] '${card.title}' 반경 50m 지오펜스 안착! M-FAD 사전 실사 브리핑 리포트를 확인하세요.`
    );
  };

  // 음성 재생 시뮬레이션 토글
  const handleToggleAudioPlay = (cardId: string) => {
    if (playingAudioId === cardId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(cardId);
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  };

  // 링크픽 전체 통계
  const linkpickStats = {
    totalCommission: linkpickItems.reduce((acc, i) => acc + i.total_commission, 0),
    totalClicks: linkpickItems.reduce((acc, i) => acc + i.click_count, 0),
    totalConversions: linkpickItems.reduce((acc, i) => acc + i.conversion_count, 0),
    activeCount: linkpickItems.filter((i) => i.is_active).length,
  };

  return (
    <div className={`space-y-4 font-sans text-slate-900 ${className}`}>
      {/* 상단 알림 토스트 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 실시간 상태 표시줄 (Telemetry Bar)]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-200/90 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* 좌측: M-FAD 수수료 안심 모니터링 가동 중 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs text-slate-900">
                  M-FAD 수수료 안심 모니터링 가동 중
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  법정 우대율 0.5% 정상 적용 중
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                8개 카드사 전산 승인 차감액 정합성 24시간 실시간 교차 검증 활성
              </p>
            </div>
          </div>

          {/* 우측: 지오펜싱 위치 뱃지 (t.check 안심 구역) */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-xs">
              <span className="text-slate-500">지오펜싱: </span>
              <span className="font-semibold text-slate-900">{geofenceLocation}</span>
              <span className="ml-1 text-[10.5px] text-emerald-700 font-medium">
                (t.check 안심 구역)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next =
                  geofenceLocation.includes("판교") ? "상계역 반경 50m" : "판교역 반경 50m";
                setGeofenceLocation(next);
                showToast(`📍 t.check 지오펜스 기준 위치가 [${next}]으로 변경되었습니다.`);
              }}
              className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer ml-1"
            >
              전환
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          [2. 상단 플로팅 퀵 입력 바 (Google Keep 스타일)]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 shadow-sm space-y-3">
        {/* 모드 선택 탭 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setQuickInputType("NOTE")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                quickInputType === "NOTE"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>일반 메모</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickInputType("VOICE")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                quickInputType === "VOICE"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>음성 STT 메모</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickInputType("LOCATION")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                quickInputType === "LOCATION"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>위치 알림 (50m)</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickInputType("TODO")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                quickInputType === "TODO"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>체크리스트</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickInputType("LINKPICK")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                quickInputType === "LINKPICK"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>링크픽 간편 추가</span>
            </button>
          </div>

          {/* 마이크 즉시 원클릭 토글 버튼 */}
          <button
            type="button"
            onClick={handleToggleVoiceRecording}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
            }`}
            title="실시간 브라우저 Web Speech 음성 인식 시작"
          >
            {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-rose-600" />}
            <span>{isRecording ? `녹음 중 (${recordingSeconds}초)` : "음성 녹음"}</span>
          </button>
        </div>

        {/* 폼 입력창 */}
        <form onSubmit={handleCreateQuickCard} className="space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={
                quickInputType === "LINKPICK"
                  ? "링크픽 제휴 상품명 (예: 다우니 실내건조 4L 대용량)"
                  : quickInputType === "LOCATION"
                  ? "목적지 카드 제목 (예: 판교 에이펙스 피트니스 현장 도착)"
                  : quickInputType === "VOICE"
                  ? "음성 메모 제목 (예: 정자동 화로구이 대표님 미팅)"
                  : "메모 제목을 입력하세요..."
              }
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            />

            {quickInputType === "LINKPICK" && (
              <input
                type="text"
                placeholder="노출 가격 (예: 18900)"
                value={quickLinkPrice}
                onChange={(e) => setQuickLinkPrice(e.target.value)}
                className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
              />
            )}
          </div>

          {/* 타입별 추가 입력 필드 */}
          {quickInputType === "LINKPICK" ? (
            <input
              type="url"
              required
              placeholder="쿠팡 파트너스 또는 제휴 상품 URL (https://link.coupang.com/...)"
              value={quickLinkUrl}
              onChange={(e) => setQuickLinkUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
            />
          ) : quickInputType === "LOCATION" ? (
            <input
              type="text"
              required
              placeholder="목적지 도로명 주소 (예: 경기도 성남시 분당구 판교역로 146)"
              value={quickAddress}
              onChange={(e) => setQuickAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            />
          ) : quickInputType === "VOICE" ? (
            <div className="space-y-1.5">
              <textarea
                rows={2}
                placeholder="음성 변환 텍스트가 실시간 표시됩니다 (직접 수정 가능)..."
                value={voiceTranscript || quickContent}
                onChange={(e) => {
                  setVoiceTranscript(e.target.value);
                  setQuickContent(e.target.value);
                }}
                className="w-full rounded-xl border border-rose-200 bg-rose-50/30 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
              />
              {isRecording && (
                <div className="flex items-center gap-2 text-[11px] text-rose-600 font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span>실시간 음성 인식 중... 마이크에 또박또박 말씀해주세요.</span>
                </div>
              )}
            </div>
          ) : (
            <textarea
              rows={2}
              placeholder="메모 상세 내용이나 체크리스트 항목을 입력하세요..."
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
            />
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-normal">
              * 생성된 카드는 Google Keep 카드 덱과 티홈페이지에 자동 실시간 반영됩니다.
            </span>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{quickInputType === "LINKPICK" ? "링크픽 공개 발행" : "카드 추가"}</span>
            </button>
          </div>
        </form>
      </section>

      {/* ============================================================
          [3. 모듈형 메이슨리 그리드 카드 구성]
         ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
        {/* ==========================================================
            [위젯 1: 티홈페이지 알바 지원자 미니 위젯]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                <Users className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-bold text-xs text-slate-900">
                티홈페이지 알바 지원자
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold">
              신규 {applicantWidget.new_applicants_count}건
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500 text-[11px]">진행 중 채용 공고</span>
              <span className="font-semibold text-slate-900 font-mono">
                {applicantWidget.active_postings_count}개
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-900">
                  {applicantWidget.recent_applicant_name} 지원자
                </span>
                <span className="text-[10px] text-slate-400">
                  {applicantWidget.received_time_text}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-600 truncate">
                {applicantWidget.recent_role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setApplicantModalOpen(true)}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <span>구직 지원자 ATS 심사 관리</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ==========================================================
            [위젯 2: 링크픽(LinkPick) 수익화 관리 카드]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs">
                <ShoppingBag className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900">
                  링크픽(LinkPick) 수익화 허브
                </h3>
                <span className="text-[10.5px] text-slate-400">
                  티홈페이지 실시간 공개 On/Off 토글
                </span>
              </div>
            </div>

            {/* 수익 요약 통계 뱃지 */}
            <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400">예상 수익: </span>
                <span className="font-bold text-rose-600 font-mono">
                  ₩{linkpickStats.totalCommission.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">클릭: </span>
                <span className="font-bold text-slate-900 font-mono">
                  {linkpickStats.totalClicks}회
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">공개: </span>
                <span className="font-bold text-emerald-700 font-mono">
                  {linkpickStats.activeCount}개
                </span>
              </div>
            </div>
          </div>

          {/* 링크픽 상품 목록 및 실시간 토글 스위치 */}
          <div className="space-y-2">
            {linkpickItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail_url || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate max-w-xs">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5 font-mono">
                      <span>₩{(item.display_price || 0).toLocaleString()}원</span>
                      <span>•</span>
                      <span>클릭 {item.click_count}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">
                        +{item.total_commission.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* is_active 즉시 토글 스위치 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10.5px] font-bold ${
                      item.is_active ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {item.is_active ? "티홈 공개" : "비공개"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleLinkActive(item.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.is_active ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        item.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>* 모바일 PWA 기기에서 주민들이 상품을 담을 때마다 내 SubID로 영구 적립됩니다.</span>
            <Link
              href={`/p/${userId}`}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>내 LinkPick 모바일 허브 가기</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ==========================================================
            [카드 3~N: Google Keep 스타일 모듈형 카드 덱]
           ========================================================== */}
        {cards.map((card) => {
          const isVoice = card.card_type === "VOICE";
          const isLocation = card.card_type === "LOCATION";
          const isTodo = card.card_type === "TODO";

          return (
            <div
              key={card.id}
              className={`rounded-2xl border p-4 shadow-xs space-y-3 transition-all relative group bg-white ${
                card.is_pinned ? "border-amber-300 shadow-sm ring-1 ring-amber-100" : "border-slate-200"
              }`}
            >
              {/* 상단 카드 헤더: 타입 뱃지 & 액션 */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">
                    {isVoice && "🎙️"}
                    {isLocation && "📍"}
                    {isTodo && "✅"}
                    {!isVoice && !isLocation && !isTodo && "📝"}
                  </span>
                  <span className="font-bold text-[11.5px] text-slate-900 truncate max-w-[180px]">
                    {card.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(card.id)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      card.is_pinned
                        ? "text-amber-500 bg-amber-50"
                        : "text-slate-300 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                    title={card.is_pinned ? "상단 고정 해제" : "상단 고정"}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="카드 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 본문 콘텐츠 */}
              <div className="space-y-2 text-xs">
                {/* 1) 음성 메모 카드 특화: 오디오 파형 & 재생 */}
                {isVoice && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleAudioPlay(card.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          {playingAudioId === card.id ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          <span>{playingAudioId === card.id ? "재생 중..." : "녹음 듣기"}</span>
                        </button>
                        <span className="text-[10px] text-rose-700 font-mono font-bold">
                          {card.voice_duration_sec || 24}초 녹음
                        </span>
                      </div>

                      {/* 오디오 파형 시각화 */}
                      <div className="flex items-center gap-1 h-5 px-1">
                        {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50, 70, 90, 40].map(
                          (height, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${height}%` }}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                playingAudioId === card.id
                                  ? "bg-rose-600 animate-pulse"
                                  : "bg-rose-300"
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>

                    {/* AI 텍스트 변환 요약본 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed space-y-1">
                      <span className="font-bold text-slate-900 text-[10.5px]">
                        AI STT 텍스트 변환:
                      </span>
                      <p>{card.voice_transcript || card.content}</p>
                    </div>

                    {/* 액션 버튼: [t.sign 계약서 변환] */}
                    <button
                      type="button"
                      onClick={() => setContractModalTarget(card)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>t.sign 계약서 변환 (전자계약 초안)</span>
                    </button>
                  </div>
                )}

                {/* 2) 위치 기반 알림 카드 특화 */}
                {isLocation && (
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        <span>{card.location_address}</span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 text-[10px] font-semibold">
                        📍 목적지 반경 50m 지오펜스 도착 알림 활성
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      {card.content}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleSimulateArrival(card)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      <span>📍 현장 도착 시뮬레이션 (푸시 발송)</span>
                    </button>
                  </div>
                )}

                {/* 3) 체크리스트 카드 특화 */}
                {isTodo && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      {card.todo_items?.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleTodo(card.id, item.id)}
                          className="flex items-start gap-2 cursor-pointer group text-[11.5px]"
                        >
                          {item.completed ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              item.completed
                                ? "line-through text-slate-400"
                                : "text-slate-800 font-medium"
                            }
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 할 일 즉시 추가 인풋 */}
                    <input
                      type="text"
                      placeholder="+ 항목 추가 후 엔터..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTodoItem(card.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                )}

                {/* 4) 일반 메모 카드 */}
                {!isVoice && !isLocation && !isTodo && (
                  <p className="text-[11.5px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {card.content}
                  </p>
                )}
              </div>

              {/* 하단 태그 */}
              {card.tags && card.tags.length > 0 && (
                <div className="flex items-center gap-1 pt-2 border-t border-slate-100 flex-wrap">
                  {card.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============================================================
          [모달 1: t.sign 전자계약서 초안 변환 팝업]
         ============================================================ */}
      {contractModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto text-xs">
            <button
              type="button"
              onClick={() => setContractModalTarget(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
                📜
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  t.sign 카드수수료 환급 소명 전자계약서 초안
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  음성 메모 AI 변환 데이터 기반 계약 조건 자동 매핑
                </p>
              </div>
            </div>

            {/* 계약 내용 프리뷰 박스 */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <span>[계약명]: M-FAD 가맹점 과오납 수수료 회수 및 소명 위임 약정서</span>
                <span className="text-emerald-700">SHA-256 서명 인장</span>
              </div>
              <p>
                <strong>위임인(가맹점주):</strong> {contractModalTarget.title.replace("미팅", "")} 귀하
              </p>
              <p>
                <strong>수임인:</strong> Today Link M-FAD 공인 권익수호 센터 (전담위원: {userName})
              </p>
              <p>
                <strong>소명 요지:</strong> {contractModalTarget.content}
              </p>
              <p>
                <strong>환급 입금 원칙:</strong> 카드사에서 가맹점 대표님 명의 사업자 통장으로 직접 무통장 환급 입금
              </p>
              <p>
                <strong>착수금:</strong> 0원 (환급 성공 완료 시에만 사후 규정 수수료 정산)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContractModalTarget(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(
                    `📲 가맹점 대표님 카카오톡으로 t.sign 비대면 전자서명 약정서 링크가 발송되었습니다!`
                  );
                  setContractModalTarget(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="h-3.5 w-3.5 text-amber-400" />
                <span>카카오톡 비대면 서명 링크 발송</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 2: 티홈페이지 구직 지원자 ATS 심사 팝업]
         ============================================================ */}
      {applicantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto text-xs">
            <button
              type="button"
              onClick={() => setApplicantModalOpen(false)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                <Users className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  티홈페이지 구직자 지원 현황 (ATS 파이프라인)
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  신규 접수 4건 / 면접 진행 1건
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { name: "김지민", phone: "010-3849-1123", role: "홀서빙 파트타임", time: "15분 전", status: "APPLIED" },
                { name: "박건우", phone: "010-8812-9012", role: "주방 보조 (시급 12,000원)", time: "1시간 전", status: "INTERVIEW" },
                { name: "이수진", phone: "010-4491-0192", role: "주말 마감 바리스타", time: "어제", status: "APPLIED" },
              ].map((app, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">{app.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{app.phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{app.role} ({app.time})</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => showToast(`📞 [${app.name} 지원자]에게 면접 안내 문자를 발송했습니다.`)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition-colors"
                    >
                      면접 제안
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`✅ [${app.name} 지원자] 채용이 확정되어 t.check 명부에 등록되었습니다.`)}
                      className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800 transition-colors"
                    >
                      채용 확정
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setApplicantModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
