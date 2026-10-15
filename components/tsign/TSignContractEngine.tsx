"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Upload,
  FileAudio,
  Sparkles,
  CheckCircle2,
  FileText,
  Factory,
  HardHat,
  Send,
  Copy,
  Download,
  ShieldCheck,
  Archive,
  X,
  Loader2,
} from "lucide-react";

type TemplateId = "PART_TIME" | "B2B_SUPPLY" | "OUTSOURCING";

interface ParsedFields {
  partyA: string;
  partyB: string;
  rate: string;
  period: string;
  workScope: string;
}

interface VaultEntry {
  id: string;
  title: string;
  template: TemplateId;
  signedAt: string;
}

const TEMPLATES: Array<{ id: TemplateId; icon: typeof FileText; title: string; desc: string }> = [
  {
    id: "PART_TIME",
    icon: FileText,
    title: "매장/외식업 알바 표준근로계약서",
    desc: "시급, 근무시간, 주휴수당 조건이 포함된 고용노동부 표준 양식",
  },
  {
    id: "B2B_SUPPLY",
    icon: Factory,
    title: "B2B 납품공급계약서",
    desc: "단가, 납품 주기, 품질 기준이 포함된 거래처 간 공급 계약",
  },
  {
    id: "OUTSOURCING",
    icon: HardHat,
    title: "외주용역합의서",
    desc: "작업 범위, 용역비, 기간이 포함된 1회성 외주 합의",
  },
];

const MOCK_PARSE_RESULT: ParsedFields = {
  partyA: "정자동 숯불화로구이 본점 (대표 최성호)",
  partyB: "김지수",
  rate: "시급 10,500원",
  period: "2026.11.01 ~ 2027.04.30 (주 4일, 1일 6시간)",
  workScope: "홀 서빙 및 포장 응대",
};

const MOCK_VAULT: VaultEntry[] = [
  { id: "v1", title: "정자동 숯불화로구이 - 김지수 알바 근로계약서", template: "PART_TIME", signedAt: "2026.10.02" },
  { id: "v2", title: "㈜상계유통 - 3분기 식자재 납품공급계약서", template: "B2B_SUPPLY", signedAt: "2026.09.18" },
];

export default function TSignContractEngine() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedLabel, setRecordedLabel] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedFields | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);

  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setUploadedFile(null);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast("마이크 권한이 필요합니다. 브라우저 설정을 확인해 주세요.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setRecordedLabel(`현장 음성 녹음 · ${recordSeconds}초`);
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    const okTypes = [".m4a", ".mp3", ".wav"];
    if (!okTypes.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      showToast("m4a, mp3, wav 파일만 업로드할 수 있습니다.");
      return;
    }
    setUploadedFile(file);
    setRecordedLabel(null);
  };

  const canParse = !!recordedLabel || !!uploadedFile;

  const runAiParse = () => {
    if (!canParse) return;
    setIsParsing(true);
    setParsed(null);
    setTimeout(() => {
      setParsed(MOCK_PARSE_RESULT);
      setIsParsing(false);
    }, 1400);
  };

  const handleConfirmSign = () => {
    if (!agreed || !phone) {
      showToast("상대방 연락처와 본인인증 동의가 필요합니다.");
      return;
    }
    setIsSigned(true);
    showToast("전자 체결이 완료되었습니다. 전자보관함에 저장됐어요.");
  };

  const resetFlow = () => {
    setParsed(null);
    setSelectedTemplate(null);
    setRecordedLabel(null);
    setUploadedFile(null);
    setPhone("");
    setAgreed(false);
    setIsSigned(false);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. 음성/통화 녹음 입력부 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Mic className="h-4 w-4 text-blue-600" />
          1. 현장 음성 · 통화 녹음 입력
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 즉석 음성 녹음 */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center gap-2.5 text-center">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
                isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              aria-label={isRecording ? "녹음 정지" : "녹음 시작"}
            >
              {isRecording ? <Square className="h-5 w-5 fill-white" /> : <Mic className="h-6 w-6" />}
            </button>
            <p className="text-xs font-bold text-slate-800">
              {isRecording ? `녹음 중... ${recordSeconds}초 / 60초` : "현장 구두 합의 즉석 녹음"}
            </p>
            <p className="text-[11px] text-slate-400">10~60초, 탭하여 시작</p>
            {recordedLabel && !isRecording && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3" /> {recordedLabel}
              </span>
            )}
          </div>

          {/* 통화 녹음 파일 업로드 드롭존 */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border border-dashed p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors ${
              isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".m4a,.mp3,.wav,audio/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <Upload className="h-6 w-6 text-slate-400" />
            <p className="text-xs font-bold text-slate-800">통화 녹음 파일 업로드</p>
            <p className="text-[11px] text-slate-400">m4a · mp3 · wav 지원, 드래그 또는 탭</p>
            {uploadedFile && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold truncate max-w-full">
                <FileAudio className="h-3 w-3 shrink-0" />
                <span className="truncate">{uploadedFile.name}</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!canParse || isParsing}
          onClick={runAiParse}
          className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all ${
            !canParse || isParsing
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]"
          }`}
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> AI가 녹음 내용을 분석하고 있어요...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" /> AI로 계약 조건 자동 추출
            </>
          )}
        </button>
      </section>

      {/* 2. AI 파싱 & 표준계약서 뷰어 */}
      {parsed && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            2. AI 추출 결과 & 표준계약서 선택
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {([
              ["당사자", parsed.partyA + " / " + parsed.partyB],
              ["시급·단가", parsed.rate],
              ["근무기간", parsed.period],
              ["업무내용", parsed.workScope],
            ] as const).map(([label, value]) => (
              <label key={label} className="space-y-1 block">
                <span className="text-[11px] font-bold text-slate-500">{label}</span>
                <input
                  defaultValue={value}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500">3대 표준계약서 양식 선택</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isSel = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`text-left rounded-xl border p-3 space-y-1 transition-all ${
                      isSel
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSel ? "text-blue-600" : "text-slate-400"}`} />
                    <p className="text-xs font-bold text-slate-900">{t.title}</p>
                    <p className="text-[10.5px] text-slate-500">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
              {`${TEMPLATES.find((t) => t.id === selectedTemplate)?.title}\n\n제1조(당사자) ${parsed.partyA}(이하 "갑")과 ${parsed.partyB}(이하 "을")은 아래와 같이 계약을 체결한다.\n제2조(조건) ${parsed.rate} / ${parsed.period}\n제3조(업무) ${parsed.workScope}\n\n※ AI 자동 생성 초안이며, 전자 체결 전 당사자 확인이 필요합니다.`}
            </div>
          )}
        </section>
      )}

      {/* 3. 전자 체결 & 발송 */}
      {parsed && selectedTemplate && !isSigned && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Send className="h-4 w-4 text-emerald-600" />
            3. 전자 체결 & 발송
          </h2>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="상대방 휴대폰 번호 (예: 010-1234-5678)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => showToast("카카오톡 메시지가 발송되었습니다.")}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs py-2.5 hover:bg-amber-300 transition-colors"
            >
              💬 카카오톡으로 전송
            </button>
            <button
              type="button"
              onClick={() => showToast("체결 URL이 복사되었습니다.")}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs py-2.5 hover:bg-slate-200 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> URL 복사
            </button>
          </div>

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
            />
            <span className="text-[11px] text-slate-600">
              양 당사자는 본인인증을 통해 본 계약 내용에 동의하며, 전자서명법상 동일한 법적 효력을 가짐에 동의합니다.
            </span>
          </label>

          <button
            type="button"
            onClick={handleConfirmSign}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-sm py-3 hover:bg-blue-700 transition-colors active:scale-[0.99]"
          >
            <ShieldCheck className="h-4 w-4" /> 본인인증 원클릭 동의 체결
          </button>
        </section>
      )}

      {/* 체결 완료 */}
      {isSigned && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> 체결 완료
          </h2>
          <p className="text-xs text-emerald-700">
            계약서가 전자서명되어 양 당사자 전자보관함에 저장되었습니다.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => showToast("PDF 다운로드를 시작합니다.")}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-bold text-xs py-2.5 hover:bg-emerald-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> 체결 PDF 다운로드
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs py-2.5 hover:bg-emerald-700 transition-colors"
            >
              새 계약서 만들기
            </button>
          </div>
        </section>
      )}

      {/* 전자보관함 목록 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Archive className="h-4 w-4 text-slate-500" /> 전자보관함
        </h2>
        <div className="space-y-2">
          {(isSigned
            ? [
                {
                  id: "new",
                  title: `${parsed?.partyA.split(" ")[0] ?? "신규"} - ${parsed?.partyB ?? ""} 계약서`,
                  template: selectedTemplate ?? "PART_TIME",
                  signedAt: "방금 전",
                } as VaultEntry,
                ...MOCK_VAULT,
              ]
            : MOCK_VAULT
          ).map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 truncate">{v.title}</span>
              </div>
              <span className="text-[10.5px] text-slate-400 shrink-0 ml-2">{v.signedAt}</span>
            </div>
          ))}
        </div>
      </section>

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
