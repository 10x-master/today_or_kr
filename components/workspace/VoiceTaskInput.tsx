"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";

interface ParsedVoiceTask {
  title: string;
  dueDate?: string;
  alertTime?: string;
}

interface VoiceTaskInputProps {
  onTaskParsed: (task: ParsedVoiceTask) => void;
  className?: string;
}

/**
 * 한국어 자연어 날짜/시간 파서
 * 예: "내일 오후 3시 상계2구역 공사 현장 점검 30분 전 알람"
 */
function parseKoreanDateTime(text: string): ParsedVoiceTask {
  let cleanTitle = text;
  let dueDate: string | undefined = undefined;
  let alertTime: string | undefined = undefined;

  const now = new Date();

  // 1. 날짜 파싱 ("오늘", "내일", "모레", "X월 Y일")
  if (/오늘/.test(text)) {
    dueDate = now.toISOString().slice(0, 10);
    cleanTitle = cleanTitle.replace(/오늘\s*/g, "");
  } else if (/내일/.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow.toISOString().slice(0, 10);
    cleanTitle = cleanTitle.replace(/내일\s*/g, "");
  } else if (/모레/.test(text)) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dueDate = dayAfter.toISOString().slice(0, 10);
    cleanTitle = cleanTitle.replace(/모레\s*/g, "");
  } else {
    const monthDayMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (monthDayMatch) {
      const month = String(monthDayMatch[1]).padStart(2, "0");
      const day = String(monthDayMatch[2]).padStart(2, "0");
      dueDate = `${now.getFullYear()}-${month}-${day}`;
      cleanTitle = cleanTitle.replace(/(\d{1,2})월\s*(\d{1,2})일\s*/g, "");
    }
  }

  // 2. 시간 파싱 ("오후 3시", "오전 9시 30분", "14시")
  const pmMatch = text.match(/오후\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  const amMatch = text.match(/오전\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  const generalTimeMatch = text.match(/(\d{1,2})시(?:\s*(\d{1,2})분)?/);

  if (pmMatch) {
    let hour = parseInt(pmMatch[1], 10);
    if (hour < 12) hour += 12;
    const min = pmMatch[2] ? String(pmMatch[2]).padStart(2, "0") : "00";
    alertTime = `${String(hour).padStart(2, "0")}:${min}`;
    cleanTitle = cleanTitle.replace(/오후\s*\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  } else if (amMatch) {
    let hour = parseInt(amMatch[1], 10);
    if (hour === 12) hour = 0;
    const min = amMatch[2] ? String(amMatch[2]).padStart(2, "0") : "00";
    alertTime = `${String(hour).padStart(2, "0")}:${min}`;
    cleanTitle = cleanTitle.replace(/오전\s*\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  } else if (generalTimeMatch) {
    const hour = String(parseInt(generalTimeMatch[1], 10)).padStart(2, "0");
    const min = generalTimeMatch[2]
      ? String(generalTimeMatch[2]).padStart(2, "0")
      : "00";
    alertTime = `${hour}:${min}`;
    cleanTitle = cleanTitle.replace(/\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  }

  // 3. 알림 문구 제거 ("30분 전 알람", "알림 설정")
  cleanTitle = cleanTitle
    .replace(/\d+분\s*전\s*(?:알람|알림)?/g, "")
    .replace(/(?:알람|알림)\s*(?:해줘|설정|등록)?/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: cleanTitle || text.trim(),
    dueDate,
    alertTime,
  };
}

// 브라우저 Web Speech API 타입 정의 (타입 안전성 확보)
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

export default function VoiceTaskInput({
  onTaskParsed,
  className = "",
}: VoiceTaskInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Web Speech API 브라우저 내장 지원 확인 (Chrome, Edge, Safari 등)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setIsTextMode(true); // 미지원 브라우저는 텍스트 빠른 입력 모드로 기본 전환
      return;
    }

    try {
      const recognition: IWindowSpeechRecognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "ko-KR";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setFeedbackMsg(null);
      };

      recognition.onresult = (event) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        setIsListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setPermissionDenied(true);
          setIsTextMode(true);
          setFeedbackMsg("마이크 권한이 비활성화되어 텍스트 빠른 입력 모드로 전환되었습니다.");
        } else if (e.error !== "no-speech") {
          setIsTextMode(true);
          setFeedbackMsg("음성 인식 오류로 텍스트 빠른 입력 모드로 전환되었습니다.");
        }
      };

      recognitionRef.current = recognition;

      return () => {
        recognition.abort();
      };
    } catch {
      setSupported(false);
      setIsTextMode(true);
    }
  }, []);

  const toggleListening = () => {
    if (!supported || permissionDenied) {
      setIsTextMode(true);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      if (transcript.trim()) {
        const parsed = parseKoreanDateTime(transcript);
        onTaskParsed(parsed);
      }
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn("Speech start failed, switching to text mode:", err);
        setIsTextMode(true);
      }
    }
  };

  // 텍스트 모드에서 자연어 문장 제출 처리
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const parsed = parseKoreanDateTime(manualText);
    onTaskParsed(parsed);
    setManualText("");
    setFeedbackMsg(`"${parsed.title}" 일정이 분석되어 등록 폼에 반영되었습니다.`);

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  // 음성 인식이 끝났을 때 자동 파싱 반영
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      const parsed = parseKoreanDateTime(transcript);
      onTaskParsed(parsed);
    }
  }, [isListening, transcript, onTaskParsed]);

  // Web Speech API 미지원 또는 텍스트 모드 활성화 시 부드러운 텍스트 빠른 입력 UI 렌더링
  if (!supported || isTextMode) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <form
          onSubmit={handleManualSubmit}
          className="flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-white p-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20"
        >
          <div className="flex items-center gap-1 px-2 text-indigo-600 font-bold text-xs shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">빠른 입력</span>
          </div>

          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="예: 내일 오후 3시 상계2구역 현장 점검 (날짜·시간 자동 분석)"
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />

          <button
            type="submit"
            disabled={!manualText.trim()}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
          >
            <span>분석 반영</span>
            <Send className="h-3 w-3" />
          </button>

          {supported && !permissionDenied && (
            <button
              type="button"
              onClick={() => setIsTextMode(false)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors"
              title="음성 인식 모드로 복귀"
            >
              <Mic className="h-3 w-3 text-indigo-600" />
              <span className="hidden md:inline">음성 모드</span>
            </button>
          )}
        </form>

        {feedbackMsg && (
          <p className="text-[11px] text-indigo-600 font-medium px-2 animate-in fade-in">
            ✓ {feedbackMsg}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
          isListening
            ? "bg-rose-600 text-white shadow-md animate-pulse ring-2 ring-rose-400"
            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
        }`}
        title="브라우저 무료 음성 업무 등록 (Web Speech API)"
      >
        {isListening ? (
          <>
            <MicOff className="h-3.5 w-3.5 animate-bounce" />
            <span>음성 인식 중... (클릭 시 완료)</span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5 text-indigo-600" />
            <span>🎙️ 음성으로 빠른 업무 등록</span>
          </>
        )}
      </button>

      {/* 텍스트 모드로 수동 전환 버튼 */}
      <button
        type="button"
        onClick={() => setIsTextMode(true)}
        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
        title="텍스트 자연어 입력 모드로 전환"
      >
        <Keyboard className="h-3.5 w-3.5 text-slate-500" />
        <span className="hidden sm:inline">텍스트 빠른 입력</span>
      </button>

      {/* 실시간 음성 인식 피드백 */}
      {isListening && (
        <span className="flex items-center gap-1 text-[11px] text-slate-500 animate-in fade-in">
          <Volume2 className="h-3 w-3 text-rose-500 animate-pulse" />
          <span className="italic max-w-[200px] truncate text-slate-700">
            {transcript || "말씀해주세요 (예: '내일 오후 3시 현장 점검')"}
          </span>
        </span>
      )}

      {feedbackMsg && (
        <span className="text-[11px] text-amber-600 font-medium animate-in fade-in">
          {feedbackMsg}
        </span>
      )}
    </div>
  );
}
