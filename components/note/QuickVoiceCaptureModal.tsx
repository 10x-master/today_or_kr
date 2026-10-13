"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Camera,
  X,
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle2,
  Trash2,
  Volume2,
} from "lucide-react";
import { parseKoreanNaturalLanguage } from "@/lib/note/parser";
import { saveNoteWithCalendarSync } from "@/lib/calendar/googleSync";
import type { ParsedNoteData } from "@/types/note";
import type { TodayNote } from "@/types/officialNotice";

interface QuickVoiceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  kaptCode?: string | null;
  onSuccess?: (note: TodayNote) => void;
}

// 500KB 이하 클라이언트 사이드 HTML5 Canvas 이미지 압축 헬퍼
function compressImageUnder500KB(
  file: File
): Promise<{ dataUrl: string; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDimension = 1280;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        const maxBytes = 500 * 1024; // 500KB

        while (dataUrl.length * 0.75 > maxBytes && quality > 0.25) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
        resolve({ dataUrl, sizeKB });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Web Speech API 인터페이스
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

export default function QuickVoiceCaptureModal({
  isOpen,
  onClose,
  userId = "user-001",
  kaptCode,
  onSuccess,
}: QuickVoiceCaptureModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 첨부 사진 (500KB 압축)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeKB, setPhotoSizeKB] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // 파싱 결과 및 저장 진행 상태
  const [parsedData, setParsedData] = useState<ParsedNoteData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  // 1. Web Speech API 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition: IWindowSpeechRecognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "ko-KR";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        const parsed = parseKoreanNaturalLanguage(current);
        setParsedData(parsed);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn("Quick voice capture recognition error:", e.error);
        setIsListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setPermissionDenied(true);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }
  }, []);

  // 모달 열릴 때 자동 음성 인식 시작 (1-Tap 빠른 시작)
  useEffect(() => {
    if (isOpen && speechSupported && !permissionDenied) {
      setTranscript("");
      setParsedData(null);
      setPhotoDataUrl(null);
      setPhotoSizeKB(null);
      setToastMsg(null);
      try {
        recognitionRef.current?.start();
      } catch {
        // already started or fallback
      }
    }
  }, [isOpen, speechSupported, permissionDenied]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("Speech start failed:", err);
      }
    }
  };

  // 2. 사진 촬영/첨부 및 500KB Canvas 자동 압축
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const { dataUrl, sizeKB } = await compressImageUnder500KB(file);
      setPhotoDataUrl(dataUrl);
      setPhotoSizeKB(sizeKB);
      setToastMsg(`사진이 ${sizeKB}KB로 최적화 압축되었습니다.`);
    } catch (err) {
      console.warn("Photo compression failed:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  // 3. 2-Tap 최종 저장 (구글 캘린더 10분 전 알림 + Supabase 동기화)
  const handleSaveNote = async () => {
    if (!transcript.trim()) return;

    setIsSaving(true);
    try {
      const parsed = parsedData || parseKoreanNaturalLanguage(transcript);
      const res = await saveNoteWithCalendarSync({
        userId,
        parsed,
        content: photoDataUrl ? `[현장 사진 첨부 (${photoSizeKB}KB)] ${transcript}` : transcript,
        kaptCode,
      });

      onSuccess?.(res.note);
      setToastMsg(
        res.sync_status === "SYNCED"
          ? "구글 캘린더(10분 전 알림)와 t.note에 등록 완료!"
          : "t.note에 안전하게 저장되었습니다!"
      );

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2-Tap 티노트 퀵 캡처
              </h2>
              <p className="text-[11px] text-slate-400">
                음성 STT + 500KB 사진 압축 즉시 동기화
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 음성 인식 버튼 & 실시간 파형 피드백 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 text-center">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white ring-8 ring-rose-100 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
              }`}
            >
              {isListening ? (
                <MicOff className="h-8 w-8 animate-bounce" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>

            <p className="mt-3 text-xs font-bold text-slate-800">
              {isListening
                ? "🎙️ 음성을 듣고 있습니다... (탭하여 완료)"
                : "마이크 버튼을 탭하여 말씀하세요"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              예: &quot;내일 오후 3시 상계주공 14단지 관리소 미팅&quot;
            </p>
          </div>

          {/* 인식된 텍스트 확인 및 직접 편집 */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              음성 변환 텍스트
            </label>
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setParsedData(parseKoreanNaturalLanguage(e.target.value));
              }}
              placeholder="말씀하시거나 직접 텍스트를 입력하세요"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* 사진 500KB 자동 압축 첨부 영역 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-600">
                현장 사진 첨부 (Canvas 500KB 자동 압축)
              </span>
              {photoSizeKB && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  ✓ {photoSizeKB} KB 압축 완료
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
              id="camera-capture-input"
            />

            {!photoDataUrl ? (
              <label
                htmlFor="camera-capture-input"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors"
              >
                <Camera className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">
                  {isCompressing ? "500KB 압축 중..." : "카메라 촬영 또는 앨범 첨부"}
                </span>
              </label>
            ) : (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoDataUrl}
                  alt="압축된 현장 사진"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setPhotoSizeKB(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-rose-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 파싱 결과 미리보기 배지 */}
          {parsedData && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-1.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 truncate">
                  {parsedData.title}
                </span>
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {parsedData.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                {parsedData.scheduled_at && (
                  <span className="flex items-center gap-1 font-semibold text-indigo-700">
                    <Calendar className="h-3 w-3" />
                    {new Date(parsedData.scheduled_at).toLocaleString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {parsedData.location && (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <MapPin className="h-3 w-3" />
                    {parsedData.location}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  🔔 시작 10분 전 알림 기본 활성화
                </span>
              </div>
            </div>
          )}

          {toastMsg && (
            <p className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{toastMsg}</span>
            </p>
          )}

          {/* 2번째 Tap: 즉시 저장 및 캘린더 동기화 CTA */}
          <button
            type="button"
            disabled={!transcript.trim() || isSaving}
            onClick={handleSaveNote}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] disabled:opacity-40 py-3.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{isSaving ? "동기화 저장 중..." : "⚡ 2-Tap 캘린더 및 t.note 즉시 등록"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
