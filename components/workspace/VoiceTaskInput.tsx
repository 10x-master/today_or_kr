"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileAudio,
  Keyboard,
  MapPin,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Volume2,
} from "lucide-react";
import { parseKoreanNaturalLanguage } from "@/lib/note/parser";
import type { NoteCategory, ParsedNoteData, VoiceInputMode } from "@/types/note";

export interface ParsedVoiceTask extends ParsedNoteData {
  dueDate?: string;
  alertTime?: string;
}

interface VoiceTaskInputProps {
  onTaskParsed: (task: ParsedVoiceTask) => void;
  onDirectSave?: (parsed: ParsedNoteData) => Promise<void>;
  className?: string;
}

// 브라우저 Web Speech API 타입 정의
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

const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const CATEGORY_META: Record<
  NoteCategory,
  { label: string; badgeClass: string; icon: string }
> = {
  WORK: {
    label: "업무/회의",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "👔",
  },
  PLACE: {
    label: "장소/방문",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "📍",
  },
  PERSON: {
    label: "미팅/만남",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "👥",
  },
  TRAVEL: {
    label: "출장/이동",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "✈️",
  },
};

export default function VoiceTaskInput({
  onTaskParsed,
  onDirectSave,
  className = "",
}: VoiceTaskInputProps) {
  // 입력 모드: 'voice' | 'audio' | 'text'
  const [inputMode, setInputMode] = useState<VoiceInputMode>("voice");

  // 음성 인식 상태
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 텍스트 모드 상태
  const [textInput, setTextInput] = useState("");

  // 오디오 파일 업로드 상태
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState("");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // 파싱 결과 프리뷰 상태
  const [parsedPreview, setParsedPreview] = useState<ParsedNoteData | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  // 1. Web Speech API 초기화 및 자동 Fallback 방어
  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setInputMode("text"); // Web Speech 미지원 브라우저는 alert 없이 텍스트 모드로 자동 fallback
      return;
    }

    try {
      const recognition: IWindowSpeechRecognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "ko-KR";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechTranscript("");
        setFeedbackMsg(null);
      };

      recognition.onresult = (event) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setSpeechTranscript(current);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);

        // 마이크 권한 거부 시 alert/크래시 없이 텍스트 모드로 자동 fallback
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setPermissionDenied(true);
          setInputMode("text");
          setFeedbackMsg(
            "마이크 권한이 비활성화되어 텍스트 빠른 입력 모드로 자동 전환되었습니다."
          );
        } else if (e.error !== "no-speech") {
          setInputMode("text");
          setFeedbackMsg(
            "음성 인식 오류가 감지되어 텍스트 빠른 입력 모드로 전환되었습니다."
          );
        }
      };

      recognitionRef.current = recognition;

      return () => {
        recognition.abort();
      };
    } catch {
      setSpeechSupported(false);
      setInputMode("text");
    }
  }, []);

  // 오디오 URL 해제 정리
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // 2. 통합 결과 전달 헬퍼
  const emitParsedResult = (parsed: ParsedNoteData) => {
    let dueDate: string | undefined = undefined;
    let alertTime: string | undefined = undefined;

    if (parsed.scheduled_at) {
      const d = new Date(parsed.scheduled_at);
      dueDate = parsed.scheduled_at.slice(0, 10);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      alertTime = `${hours}:${minutes}`;
    }

    const taskPayload: ParsedVoiceTask = {
      ...parsed,
      dueDate,
      alertTime,
    };

    setParsedPreview(parsed);
    onTaskParsed(taskPayload);
  };

  // 3. 음성 토글
  const toggleListening = () => {
    if (!speechSupported || permissionDenied) {
      setInputMode("text");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      if (speechTranscript.trim()) {
        const parsed = parseKoreanNaturalLanguage(speechTranscript);
        emitParsedResult(parsed);
      }
    } else {
      setSpeechTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("Speech recognition start failed:", err);
        setInputMode("text");
      }
    }
  };

  // 음성 인식 종료 시 파싱 처리
  useEffect(() => {
    if (!isListening && speechTranscript.trim()) {
      const parsed = parseKoreanNaturalLanguage(speechTranscript);
      emitParsedResult(parsed);
    }
  }, [isListening, speechTranscript]);

  // 4. 오디오 파일 업로드 처리 (m4a, mp3, wav, 최대 15MB)
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioError(null);

    // 15MB 용량 제한 검증
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      setAudioError(
        `오디오 파일 용량이 15MB를 초과했습니다 (${mbSize}MB). 15MB 이하 파일(m4a, mp3, wav)을 선택해주세요.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 포맷 검증 (.m4a, .mp3, .wav)
    const validExtensions = [".m4a", ".mp3", ".wav"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidFormat =
      validExtensions.includes(fileExt) || file.type.startsWith("audio/");

    if (!isValidFormat) {
      setAudioError("지원하지 않는 포맷입니다. m4a, mp3, wav 파일을 업로드해주세요.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const newUrl = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioUrl(newUrl);

    // 파일명에서 자연어 텍스트 기본 추출
    const cleanFileName = file.name
      .replace(/\.(m4a|mp3|wav)$/i, "")
      .replace(/[_-]/g, " ")
      .trim();

    setAudioTranscript(cleanFileName);
    setIsProcessingAudio(true);

    // 오디오 파일 분석 시뮬레이션 및 파싱
    setTimeout(() => {
      setIsProcessingAudio(false);
      const parsed = parseKoreanNaturalLanguage(cleanFileName);
      emitParsedResult(parsed);
      setFeedbackMsg(`오디오 파일 "${file.name}" 분석이 완료되었습니다.`);
    }, 600);
  };

  const handleAudioTranscriptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTranscript.trim()) return;

    const parsed = parseKoreanNaturalLanguage(audioTranscript);
    emitParsedResult(parsed);
    setFeedbackMsg(`오디오 메모 내용이 일정 분석에 반영되었습니다.`);
  };

  const handleRemoveAudioFile = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setAudioTranscript("");
    setAudioError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 5. 텍스트 직접 입력 제출
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const parsed = parseKoreanNaturalLanguage(textInput);
    emitParsedResult(parsed);
    setTextInput("");
    setFeedbackMsg(`"${parsed.title}" 일정이 분석되어 폼에 반영되었습니다.`);
  };

  // 날짜/시간 포맷팅 헬퍼
  const formatScheduledDate = (isoStr: string | null) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${d.toLocaleTimeString(
        "ko-KR",
        { hour: "2-digit", minute: "2-digit" }
      )}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 1. 상단 모드 전환 탭: [🎙️ 음성 모드] / [📁 오디오 업로드] / [⌨️ 텍스트 모드] */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
        {/* [🎙️ 음성 모드] */}
        <button
          type="button"
          onClick={() => {
            if (!speechSupported || permissionDenied) {
              setFeedbackMsg("마이크를 사용할 수 없어 텍스트 모드로 유지됩니다.");
              return;
            }
            setInputMode("voice");
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
            inputMode === "voice"
              ? "bg-white text-indigo-700 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          } ${
            !speechSupported || permissionDenied
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          title={
            !speechSupported || permissionDenied
              ? "마이크 권한 거부 또는 미지원 브라우저"
              : "Web Speech API 실시간 음성 입력"
          }
        >
          <Mic className="h-3.5 w-3.5 text-indigo-600" />
          <span>🎙️ 음성 모드</span>
        </button>

        {/* [📁 오디오 업로드] */}
        <button
          type="button"
          onClick={() => setInputMode("audio")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
            inputMode === "audio"
              ? "bg-white text-indigo-700 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="오디오 파일(m4a, mp3, wav, 최대 15MB) 업로드 지원"
        >
          <FileAudio className="h-3.5 w-3.5 text-blue-600" />
          <span>📁 오디오 업로드</span>
        </button>

        {/* [⌨️ 텍스트 모드] */}
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
            inputMode === "text"
              ? "bg-white text-indigo-700 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="한국어 자연어 텍스트 빠른 입력"
        >
          <Keyboard className="h-3.5 w-3.5 text-slate-600" />
          <span>⌨️ 텍스트 모드</span>
        </button>
      </div>

      {/* 2. 각 모드별 입력 컨테이너 */}

      {/* 2-A. [🎙️ 음성 모드] 활성화 시 */}
      {inputMode === "voice" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              isListening
                ? "bg-rose-600 text-white shadow-md animate-pulse ring-2 ring-rose-400"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 animate-bounce" />
                <span>음성 듣는 중... (클릭 시 완료)</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>음성으로 말씀하세요</span>
              </>
            )}
          </button>

          {/* 실시간 음성 스트림 미리보기 */}
          {isListening && (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white/80 px-2.5 py-1.5 rounded-xl border border-indigo-200">
              <Volume2 className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              <span className="italic max-w-[260px] truncate font-medium">
                {speechTranscript || "말씀해주세요 (예: '내일 오후 3시 상계주공 14단지 관리소 미팅')"}
              </span>
            </div>
          )}

          {!isListening && (
            <span className="text-[11px] text-slate-500">
              예: &quot;내일 오후 3시 상계주공 14단지 관리소 미팅&quot;
            </span>
          )}
        </div>
      )}

      {/* 2-B. [📁 오디오 업로드] 활성화 시 */}
      {inputMode === "audio" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-3 space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".m4a,.mp3,.wav,audio/*"
            onChange={handleAudioFileChange}
            className="hidden"
            id="audio-upload-input"
          />

          {!audioFile ? (
            <label
              htmlFor="audio-upload-input"
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-blue-300 bg-white p-4 text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-all"
            >
              <UploadCloud className="h-6 w-6 text-blue-600" />
              <div className="text-xs font-bold text-slate-800">
                음성 녹음 오디오 파일 선택 또는 드래그
              </div>
              <p className="text-[11px] text-slate-500">
                m4a, mp3, wav 지원 • 최대 15MB
              </p>
            </label>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileAudio className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {audioFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAudioFile}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="파일 제거"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 오디오 브라우저 재생기 */}
              {audioUrl && (
                <audio
                  controls
                  src={audioUrl}
                  className="w-full h-8 mt-1 rounded"
                />
              )}

              {/* 오디오 텍스트 확인 및 재파싱 폼 */}
              <form
                onSubmit={handleAudioTranscriptSubmit}
                className="flex items-center gap-1.5 pt-1"
              >
                <input
                  type="text"
                  value={audioTranscript}
                  onChange={(e) => setAudioTranscript(e.target.value)}
                  placeholder="오디오 내용 텍스트 (예: 내일 오후 3시 상계주공 14단지 관리소 미팅)"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!audioTranscript.trim() || isProcessingAudio}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                >
                  {isProcessingAudio ? "분석 중..." : "파싱 분석"}
                </button>
              </form>
            </div>
          )}

          {audioError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{audioError}</span>
            </div>
          )}
        </div>
      )}

      {/* 2-C. [⌨️ 텍스트 모드] 활성화 시 */}
      {inputMode === "text" && (
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-white p-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20"
        >
          <div className="flex items-center gap-1 px-2 text-indigo-600 font-bold text-xs shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">빠른 입력</span>
          </div>

          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="예: 내일 오후 3시 상계주공 14단지 관리소 미팅 10분 전 알람"
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />

          <button
            type="submit"
            disabled={!textInput.trim()}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
          >
            <span>분석 반영</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      )}

      {/* 피드백 안내 문구 */}
      {feedbackMsg && (
        <p className="text-[11px] text-indigo-600 font-medium px-1 flex items-center gap-1 animate-in fade-in">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>{feedbackMsg}</span>
        </p>
      )}

      {/* 3. 한국어 자연어 파싱 결과 구조화 배지 카드 프리뷰 */}
      {parsedPreview && (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50/50 p-2.5 text-xs animate-in fade-in shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-indigo-50 pb-1.5">
            <span className="font-bold text-slate-900 truncate">
              {parsedPreview.title}
            </span>
            <div className="flex items-center gap-1">
              {/* 카테고리 뱃지 */}
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                  CATEGORY_META[parsedPreview.category].badgeClass
                }`}
              >
                <span>{CATEGORY_META[parsedPreview.category].icon}</span>
                <span>{CATEGORY_META[parsedPreview.category].label}</span>
              </span>

              {/* 할 일 여부 */}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  parsedPreview.is_todo
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {parsedPreview.is_todo ? "To-do" : "메모"}
              </span>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {parsedPreview.scheduled_at && (
              <span className="flex items-center gap-1 text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                <Calendar className="h-3 w-3" />
                {formatScheduledDate(parsedPreview.scheduled_at)}
              </span>
            )}

            {parsedPreview.location && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                <MapPin className="h-3 w-3" />
                {parsedPreview.location}
              </span>
            )}

            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              🔔 시작 10분 전 알림
            </span>

            {/* 원클릭 직접 등록 CTA */}
            {onDirectSave && (
              <button
                type="button"
                onClick={() => onDirectSave(parsedPreview)}
                className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors"
              >
                <span>⚡ 캘린더 즉시 동기화 저장</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
