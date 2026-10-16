"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { DiaryBookmark } from "@/types/diary";

// 브라우저 Web Speech API 타입 정의 (components/workspace/VoiceTaskInput.tsx와 동일 패턴)
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: Array<Array<{ transcript: string; confidence: number }>>;
      }) => void)
    | null;
}

interface LocalImage {
  id: string;
  previewUrl: string;
  isPersisted: boolean; // true면 실제 image_urls에 포함되는 URL, false면 세션 로컬 미리보기(blob)
  url: string;
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EnhancedNoteCaptureModal({
  isOpen,
  onClose,
  diaryEventId,
  userId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  diaryEventId?: string;
  userId: string;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState(toDateInputValue(new Date()));
  const [isImportant, setIsImportant] = useState(false);

  // 음성 녹음 상태
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [audioSeconds, setAudioSeconds] = useState(0);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 다중 사진
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 웹링크 스크랩
  const [linkInput, setLinkInput] = useState("");
  const [bookmarks, setBookmarks] = useState<DiaryBookmark[]>([]);
  const [isScrapingLink, setIsScrapingLink] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Web Speech API 초기화
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition: IWindowSpeechRecognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setInterimText(current);
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText((prevInterim) => {
        if (prevInterim.trim()) {
          setAccumulatedText((prev) => (prev ? `${prev} ${prevInterim}` : prevInterim));
        }
        return "";
      });
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech") {
        console.warn("Speech recognition error:", e.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
    };
  }, [isOpen]);

  // 녹음 경과 시간 타이머
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => setAudioSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  if (!isOpen) return null;

  const handleStartOrResume = () => {
    setHasStarted(true);
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
    }
  };

  const handlePause = () => {
    recognitionRef.current?.stop();
  };

  const handleRedo = () => {
    recognitionRef.current?.abort();
    setAccumulatedText("");
    setInterimText("");
    setAudioSeconds(0);
    setHasStarted(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const next = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      previewUrl: URL.createObjectURL(file),
      isPersisted: false,
      url: "",
    }));
    setImages((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        id: `img-url-${Date.now()}`,
        previewUrl: imageUrlInput.trim(),
        isPersisted: true,
        url: imageUrlInput.trim(),
      },
    ]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleScrapeLink = async () => {
    if (!linkInput.trim()) return;
    setIsScrapingLink(true);
    try {
      const res = await fetch("/api/t-note/scrape-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkInput.trim() }),
      });
      const data = await res.json();
      if (data.bookmark) {
        setBookmarks((prev) => [...prev, data.bookmark]);
        setLinkInput("");
      }
    } catch (err) {
      console.warn("Link scrape request failed:", err);
    } finally {
      setIsScrapingLink(false);
    }
  };

  const handleRemoveBookmark = (url: string) => {
    setBookmarks((prev) => prev.filter((b) => b.url !== url));
  };

  const handleSubmit = async () => {
    const persistedImageUrls = images.filter((img) => img.isPersisted).map((img) => img.url);
    const noteTitle = title.trim() || accumulatedText.slice(0, 30) || "새 t.노트 기록";

    if (!accumulatedText.trim() && persistedImageUrls.length === 0 && bookmarks.length === 0) {
      setFeedbackMsg("음성 기록, 사진, 웹링크 중 최소 하나는 추가해주세요.");
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/today-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle,
          content: accumulatedText,
          note_type: "MEMO",
          due_date: recordDate,
          record_date: recordDate,
          user_id: userId,
          diary_event_id: diaryEventId || null,
          image_urls: persistedImageUrls,
          bookmark_urls: bookmarks,
          audio_duration: audioSeconds,
          is_important: isImportant,
          reminder_days_before: 7,
          target_alert_date: isImportant ? new Date(`${recordDate}T09:00:00`).toISOString() : null,
        }),
      });
      onSaved?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="flex items-center gap-1.5 pr-6 text-sm font-black text-slate-900">
          <Mic className="h-4 w-4 text-blue-600" />
          t.노트 기록 {diaryEventId ? "(일정에 바인딩됨)" : ""}
        </h3>

        {/* 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (비워두면 음성 내용 일부로 자동 생성)"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
        />

        {/* 날짜 피커 (소급 기록/수정) */}
        <div className="mt-2.5 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
          />
          <span className="text-[10px] text-slate-400">기록 날짜 (과거 날짜로 소급 작성 가능)</span>
        </div>

        {/* 중요 알림 토글 — D-7부터 메인 알림 큐 최상단 선제 노출 */}
        <label className="mt-2.5 flex cursor-pointer items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
          <input
            type="checkbox"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
            className="h-4 w-4 accent-amber-500 cursor-pointer"
          />
          <Star className={`h-3.5 w-3.5 shrink-0 ${isImportant ? "text-amber-500 fill-amber-400" : "text-slate-300"}`} />
          <span className="text-xs font-bold text-slate-700">⭐ 일주일 전부터 중요 알림</span>
        </label>
        {isImportant && (
          <p className="mt-1 pl-1 text-[10px] text-amber-600">
            기록 날짜({recordDate}) 기준 D-7부터 메인 알림 큐 최상단에 선제 노출됩니다.
          </p>
        )}

        {/* 음성 녹음 컨트롤러 */}
        <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-3">
          {!speechSupported ? (
            <p className="text-[11px] text-slate-400">이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 직접 입력해주세요.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {!hasStarted && (
                <button
                  type="button"
                  onClick={handleStartOrResume}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Mic className="h-3.5 w-3.5" />
                  녹음 시작
                </button>
              )}
              {hasStarted && isListening && (
                <button
                  type="button"
                  onClick={handlePause}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer animate-pulse"
                >
                  <Pause className="h-3.5 w-3.5" />
                  일시정지
                </button>
              )}
              {hasStarted && !isListening && (
                <>
                  <button
                    type="button"
                    onClick={handleStartOrResume}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    이어 녹음
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    다시하기
                  </button>
                </>
              )}
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-mono font-bold text-indigo-700">
                <Square className="h-2.5 w-2.5 fill-indigo-600 text-indigo-600" />
                {formatDuration(audioSeconds)}
              </span>
            </div>
          )}

          {(accumulatedText || interimText) && (
            <p className="mt-2.5 rounded-xl bg-white p-2.5 text-xs text-slate-700 leading-relaxed">
              {accumulatedText}
              {interimText && <span className="text-slate-400 italic"> {interimText}</span>}
            </p>
          )}
        </div>

        {/* 다중 사진 */}
        <div className="mt-3 rounded-2xl border border-slate-100 p-3">
          <p className="text-[11px] font-bold text-slate-500">다중 사진</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" id="multi-image-input" />
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="첨부 사진" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white cursor-pointer"
                  aria-label="사진 제거"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            <label
              htmlFor="multi-image-input"
              className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-50"
            >
              <Plus className="h-5 w-5" />
            </label>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="저장 가능한 이미지 URL 추가"
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white cursor-pointer"
            >
              추가
            </button>
          </div>
          <p className="mt-1 text-[10px] text-slate-300">
            ※ 파일 선택은 미리보기 전용이며, 저장되는 사진은 이미지 URL로 추가한 항목입니다.
          </p>
        </div>

        {/* 웹링크 스크랩 & 아카이빙 */}
        <div className="mt-3 rounded-2xl border border-slate-100 p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Link2 className="h-3 w-3" />
            웹사이트 링크 스크랩
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="기억할 웹페이지 URL"
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleScrapeLink}
              disabled={isScrapingLink || !linkInput.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-40 cursor-pointer"
            >
              {isScrapingLink ? <Loader2 className="h-3 w-3 animate-spin" /> : "가져오기"}
            </button>
          </div>
          <div className="mt-2 space-y-1.5">
            {bookmarks.map((b) => (
              <div key={b.url} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2">
                {b.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image} alt={b.title} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Link2 className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-800">{b.title}</p>
                  {b.description && <p className="truncate text-[10px] text-slate-400">{b.description}</p>}
                </div>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-300 hover:text-blue-600">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button type="button" onClick={() => handleRemoveBookmark(b.url)} className="shrink-0 text-slate-300 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {feedbackMsg && <p className="mt-2 text-[11px] font-bold text-rose-500">{feedbackMsg}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          t.노트 기록 저장
        </button>
      </div>
    </div>
  );
}
