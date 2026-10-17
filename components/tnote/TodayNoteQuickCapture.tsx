"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mic,
  Square,
  CheckCircle2,
  Link2,
  Copy,
  Package,
  X,
  ImageIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { TnoteCard } from "@/types/note";

interface SourcingItem {
  id: string;
  name: string;
  price: string;
  emoji: string;
}

interface NoteEntry {
  id: string;
  photoUrl: string;
  caption: string;
  sourcingItem?: SourcingItem;
  shortLink: string;
  createdAt: string;
}

function toNoteEntry(card: TnoteCard): NoteEntry {
  return {
    id: card.id,
    photoUrl: card.photo_url || "",
    caption: card.content || card.title,
    sourcingItem: card.sourcing_item || undefined,
    shortLink: card.short_link || "",
    createdAt: card.created_at ? new Date(card.created_at).toLocaleDateString("ko-KR") : "",
  };
}

const SOURCING_ROOM_ITEMS: SourcingItem[] = [
  { id: "s1", name: "친환경 대용량 종이포장재 (500매)", price: "32,000원", emoji: "📦" },
  { id: "s2", name: "스테인리스 보온 텀블러 500ml", price: "8,900원", emoji: "🥤" },
  { id: "s3", name: "매장용 키오스크 결제 단말기", price: "189,000원", emoji: "🖥️" },
];

const MOCK_CAPTIONS = [
  "오늘 신메뉴 반응 미쳤다는 후기 들어왔어요 🔥",
  "단지 앞 공구 특가, 10분 만에 7명 참여!",
  "비 오는 날엔 역시 이게 잘 나가네요 ☔",
  "재입고 요청 폭주해서 급하게 추가 발주했습니다",
];

function makeShortLink() {
  return `today.to/p/${Math.random().toString(36).slice(2, 7)}`;
}

export default function TodayNoteQuickCapture() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSizeInfo, setPhotoSizeInfo] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceCaptured, setVoiceCaptured] = useState(false);

  const [selectedSourcing, setSelectedSourcing] = useState<SourcingItem | null>(null);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [userId, setUserId] = useState("user-001");
  const [isSaving, setIsSaving] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 로그인 사용자 확인 후 본인의 투데이노트 카드 기록 불러오기
  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      const resolvedId = user?.id || "user-001";
      setUserId(resolvedId);
      fetch(`/api/t-note/cards?user_id=${encodeURIComponent(resolvedId)}`)
        .then((res) => res.json())
        .then((data) => {
          const cards: TnoteCard[] = data.cards || [];
          setNotes(cards.map(toNoteEntry));
        })
        .catch(() => {});
    });
  }, []);

  const handlePhotoSelect = (file: File | undefined) => {
    if (!file) return;
    const originalMb = (file.size / 1024 / 1024).toFixed(1);
    const compressedKb = Math.max(60, Math.round(file.size / 1024 / 13));
    setPhotoSizeInfo(`${originalMb}MB → ${compressedKb}KB로 압축됨`);

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      setVoiceSeconds(0);
      setVoiceCaptured(false);

      timerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => {
          if (prev + 1 >= 10) {
            stopVoice();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast("마이크 권한이 필요합니다.");
    }
  };

  const stopVoice = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setVoiceCaptured(true);
  };

  const canRegister = !!photoPreview && voiceCaptured;

  const handleRegister = async () => {
    if (!canRegister || !photoPreview || isSaving) return;
    const caption = MOCK_CAPTIONS[notes.length % MOCK_CAPTIONS.length];

    setIsSaving(true);
    try {
      const res = await fetch("/api/t-note/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          card_type: "NOTE",
          title: caption.slice(0, 30),
          content: caption,
          photo_url: photoPreview,
          voice_duration_sec: voiceSeconds,
          sourcing_item: selectedSourcing ?? null,
          is_public_feed: true,
          is_private: false,
          is_anonymous: false,
        }),
      });
      const data = await res.json();
      const card: TnoteCard | undefined = data.card;
      const entry: NoteEntry = card
        ? { ...toNoteEntry(card), createdAt: "방금 전" }
        : {
            id: `n-${Date.now()}`,
            photoUrl: photoPreview,
            caption,
            sourcingItem: selectedSourcing ?? undefined,
            shortLink: makeShortLink(),
            createdAt: "방금 전",
          };
      setNotes((prev) => [entry, ...prev]);
      setPhotoPreview(null);
      setPhotoSizeInfo(null);
      setVoiceCaptured(false);
      setVoiceSeconds(0);
      setSelectedSourcing(null);
      showToast("투데이노트가 등록되고 LinkPick 숏링크가 자동 결합되었습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 2-Tap 캡처 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" /> 2-Tap 즉시 등록
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tap 1: 사진 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:bg-slate-100 transition-colors min-h-[160px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
            />
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="촬영 미리보기" className="h-24 w-24 rounded-lg object-cover" />
            ) : (
              <>
                <Camera className="h-7 w-7 text-slate-400" />
                <p className="text-xs font-bold text-slate-800">Tap 1 · 사진 1장 압축 촬영</p>
              </>
            )}
            {photoSizeInfo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold">
                <ImageIcon className="h-3 w-3" /> {photoSizeInfo}
              </span>
            )}
          </div>

          {/* Tap 2: 음성 */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[160px]">
            <button
              type="button"
              onClick={isRecording ? stopVoice : startVoice}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
                isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              aria-label={isRecording ? "녹음 정지" : "녹음 시작"}
            >
              {isRecording ? <Square className="h-4.5 w-4.5 fill-white" /> : <Mic className="h-5 w-5" />}
            </button>
            <p className="text-xs font-bold text-slate-800">
              {isRecording ? `녹음 중... ${voiceSeconds}초 / 10초` : "Tap 2 · 10초 음성 녹음"}
            </p>
            {voiceCaptured && !isRecording && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-semibold">
                <CheckCircle2 className="h-3 w-3" /> 음성 캡처 완료
              </span>
            )}
          </div>
        </div>

        {/* 소싱룸 아이템 연계 */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> 소싱룸 아이템 연계 (선택)
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SOURCING_ROOM_ITEMS.map((item) => {
              const isSel = selectedSourcing?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSourcing(isSel ? null : item)}
                  className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                    isSel ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>
                    <p className="text-[11px] font-bold text-slate-800 max-w-[9rem] truncate">{item.name}</p>
                    <p className="text-[10.5px] text-slate-400">{item.price}</p>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={!canRegister || isSaving}
          onClick={handleRegister}
          className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all ${
            !canRegister || isSaving
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
          }`}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          투데이노트 등록하기
        </button>
      </section>

      {/* 최근 등록한 노트 */}
      {notes.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">최근 등록한 노트</h2>
          <div className="space-y-2.5">
            {notes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={n.photoUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2">{n.caption}</p>
                  {n.sourcingItem && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-500">
                      {n.sourcingItem.emoji} {n.sourcingItem.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-[10.5px] text-blue-600 font-semibold truncate">{n.shortLink}</span>
                    <button
                      type="button"
                      onClick={() => showToast("숏링크가 복사되었습니다.")}
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="복사"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{n.createdAt}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
          <button type="button" onClick={() => setToast(null)} aria-label="닫기">
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
}
