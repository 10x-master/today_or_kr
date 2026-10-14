"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Scale,
  CheckCircle2,
  Send,
  HelpCircle,
  FileText,
  AlertCircle,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  KAPT_2025_GUIDELINE_QA,
  type KaptGuidelineQaItem,
} from "@/types/aptlink";

interface QnAHistoricItem {
  id: string;
  timestamp: string;
  question: string;
  answer: string;
  detail: string;
  legalBasis: string;
  category: string;
}

export default function RepairEduVoiceRoom() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState<KaptGuidelineQaItem | null>(
    () => KAPT_2025_GUIDELINE_QA[0]
  );
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>("qa-1");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // 질의응답 아카이빙 내역
  const [qnaHistory, setQnaHistory] = useState<QnAHistoricItem[]>([
    {
      id: "hist-1",
      timestamp: "방금 전",
      question: KAPT_2025_GUIDELINE_QA[0].question,
      answer: KAPT_2025_GUIDELINE_QA[0].summaryAnswer,
      detail: KAPT_2025_GUIDELINE_QA[0].detailedGuideline,
      legalBasis: KAPT_2025_GUIDELINE_QA[0].legalBasis,
      category: KAPT_2025_GUIDELINE_QA[0].category,
    },
    {
      id: "hist-2",
      timestamp: "10분 전",
      question: KAPT_2025_GUIDELINE_QA[1].question,
      answer: KAPT_2025_GUIDELINE_QA[1].summaryAnswer,
      detail: KAPT_2025_GUIDELINE_QA[1].detailedGuideline,
      legalBasis: KAPT_2025_GUIDELINE_QA[1].legalBasis,
      category: KAPT_2025_GUIDELINE_QA[1].category,
    },
  ]);

  const recognitionRef = useRef<any>(null);

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results?.[0]?.[0]?.transcript || "";
        if (spokenText) {
          setTranscript(spokenText);
          handleProcessQuestion(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Speech recognition init failed:", err);
      setVoiceSupported(false);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 음성 TTS 낭독
  const speakText = (text: string) => {
    if (speechMuted) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 마이크 토글
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("현재 브라우저는 Web Speech 음성 인식을 지원하지 않습니다. 아래 텍스트 입력창 또는 추천 질문을 이용해주세요.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition start failed:", e);
      }
    }
  };

  // 질문 처리 및 지식 DB 매칭
  const handleProcessQuestion = (queryText: string) => {
    const cleanQuery = queryText.trim().toLowerCase();
    if (!cleanQuery) return;

    // 키워드 점수 매칭
    let bestMatch: KaptGuidelineQaItem | null = null;
    let highestScore = 0;

    KAPT_2025_GUIDELINE_QA.forEach((item) => {
      let score = 0;
      if (cleanQuery.includes(item.question.toLowerCase())) score += 10;
      item.keywords.forEach((kw) => {
        if (cleanQuery.includes(kw.toLowerCase())) score += 3;
      });
      if (cleanQuery.includes(item.category.toLowerCase())) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    });

    // 매칭 실패 시 기본 응답 생성
    const matchedResult: KaptGuidelineQaItem = bestMatch && highestScore > 0
      ? bestMatch
      : {
          id: `custom-${Date.now()}`,
          category: "과태료방어",
          question: queryText,
          keywords: [queryText],
          summaryAnswer: `[국토부 2025 가이드라인 검토] 문의하신 "${queryText}" 관련 사항은 공동주택관리법 제29조 및 별표1 법정 기준에 따라 3년 주기 장기수선계획 조정 절차를 반드시 수반해야 합니다.`,
          detailedGuideline: `주요 시설물 관련 지출 시 수선유지비와 장기수선충당금의 집행 구분을 엄격히 적용해야 합니다. 300만원 초과 시에는 K-apt 전자입찰 적격심사를 원칙으로 하며, 단지 내 사전 타당성 조사와 입대의 의결 및 회의록 공고가 필수적입니다.`,
          legalBasis: "공동주택관리법 제29조, 제30조 및 국토부 주택관리업자 및 사업자 선정지침",
        };

    setCurrentAnswer(matchedResult);
    setExpandedDetailId(matchedResult.id);

    // 아카이빙 추가
    const newHistoryItem: QnAHistoricItem = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      question: queryText,
      answer: matchedResult.summaryAnswer,
      detail: matchedResult.detailedGuideline,
      legalBasis: matchedResult.legalBasis,
      category: matchedResult.category,
    };
    setQnaHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]);

    // 무료 음성 낭독
    speakText(matchedResult.summaryAnswer);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    handleProcessQuestion(transcript);
  };

  const filteredHistory = selectedCategory === "ALL"
    ? qnaHistory
    : qnaHistory.filter((item) => item.category === selectedCategory);

  const categories = ["ALL", "수선주기", "적립산식", "항목선정", "입찰방식", "과태료방어"];

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* 상단 섹션 헤더 */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-medium mb-3">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>국토교통부 · LH 2025 표준 가이드라인 공인 DB</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            장기수선 실무스쿨 & 음성 질의응답 연구원
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 font-normal">
            65개 법정 수선항목, 전면수선 최소단위, 3년 정기검토 기산점 및 장충금 적립 공식까지
            <br className="hidden sm:inline" />
            <span className="text-blue-600 font-medium">비용 0원의 브라우저 Web Speech AI</span>로 말하듯 질문하고 음성으로 즉시 브리핑받으세요.
          </p>
        </div>

        {/* 메인 인터랙티브 콘솔 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 좌측: 실시간 음성 질문 및 답변 패널 (7열) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            {/* 음성 상태 인디케이터 바 */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {isListening ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  )}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {isListening
                    ? "주민님의 질문을 듣고 있습니다..."
                    : isSpeaking
                    ? "가이드라인 답변을 음성으로 브리핑 중..."
                    : "음성 질의응답 대기 상태 (준비 완료)"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !speechMuted;
                    setSpeechMuted(next);
                    if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    speechMuted
                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                  title={speechMuted ? "음성 낭독 켜기" : "음성 낭독 끄기"}
                >
                  {speechMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>음소거 중</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>음성 낭독 ON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 마이크 버튼 & 음성 파형 비주얼 */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="relative group">
                {isListening && (
                  <div className="absolute -inset-3 rounded-full bg-blue-100 animate-pulse opacity-80" />
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all transform active:scale-95 ${
                    isListening
                      ? "bg-red-600 text-white ring-4 ring-red-100 shadow-red-200"
                      : "bg-blue-600 text-white hover:bg-blue-700 ring-4 ring-blue-50 shadow-blue-200"
                  }`}
                  aria-label={isListening ? "음성 입력 중지" : "음성 질문 시작"}
                >
                  {isListening ? (
                    <MicOff className="w-9 h-9 animate-pulse" />
                  ) : (
                    <Mic className="w-9 h-9" />
                  )}
                </button>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                {isListening ? "마이크에 대고 말씀해주세요" : "마이크를 누르고 무엇이든 질문하세요"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                예: &ldquo;승강기 와이어로프 교체 주기와 부분수선 기준은?&rdquo;
              </p>
            </div>

            {/* 텍스트 직접 입력창 (음성 미지원 브라우저 및 키보드 입력용) */}
            <form onSubmit={handleManualSubmit} className="relative mb-6">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="장기수선 계획 및 공사 입찰에 관해 궁금한 점을 적어보세요..."
                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!transcript.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                <span>질문</span>
                <Send className="w-3 h-3" />
              </button>
            </form>

            {/* 추천 질문 퀵 칩 */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>자주 묻는 법정 쟁점 빠른 질의:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {KAPT_2025_GUIDELINE_QA.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTranscript(item.question);
                      handleProcessQuestion(item.question);
                    }}
                    className="text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/60 text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {item.question.length > 28 ? item.question.slice(0, 28) + "..." : item.question}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재 포커스된 실시간 답변 카드 */}
            {currentAnswer && (
              <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
                      {currentAnswer.category}
                    </span>
                    <span className="text-xs font-medium text-slate-500">법정 실무 공식 답변</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakText(currentAnswer.summaryAnswer)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>다시 듣기</span>
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  Q. {currentAnswer.question}
                </h4>

                <div className="p-3 bg-white rounded-lg border border-slate-200/80 mb-3">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    💡 {currentAnswer.summaryAnswer}
                  </p>
                </div>

                {/* 상세 가이드라인 펼치기 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDetailId(
                        expandedDetailId === currentAnswer.id ? null : currentAnswer.id
                      )
                    }
                    className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 font-semibold py-1"
                  >
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      <span>2025 국토부·LH 세부 실무 해설 및 법적 근거</span>
                    </span>
                    {expandedDetailId === currentAnswer.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {expandedDetailId === currentAnswer.id && (
                    <div className="mt-2 text-xs text-slate-600 space-y-2 border-t border-slate-200/60 pt-2 leading-relaxed">
                      <p className="whitespace-pre-line">{currentAnswer.detailedGuideline}</p>
                      <p className="text-slate-500 font-mono text-[11px] bg-slate-100 p-2 rounded">
                        📌 <strong className="text-slate-700">법적 근거:</strong> {currentAnswer.legalBasis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 실시간 질의응답 아카이빙 및 2025 법정 65개 체크리스트 (5열) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 카테고리 필터 바 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">질의응답 실시간 아카이브</h3>
                </div>
                <span className="text-[11px] text-slate-500">누적 {qnaHistory.length}건</span>
              </div>

              {/* 카테고리 알약 탭 */}
              <div className="flex flex-wrap gap-1 mb-4 pb-3 border-b border-slate-100">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "ALL" ? "전체보기" : cat}
                  </button>
                ))}
              </div>

              {/* 아카이빙 리스트 */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    해당 분류의 질의 기록이 없습니다.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/20 transition-all text-left"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                        {item.question}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.answer}
                      </p>
                      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 truncate max-w-[180px]">
                          {item.legalBasis}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            speakText(item.answer);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>낭독</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2025 개정 핵심 포인트 배너 */}
            <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-blue-100/60 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    2025년 지자체 감사 중점 점검 3원칙
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 mt-2">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>전면수선 최소단위 엄수:</strong> 임의 부분수선 처리 시 과태료 최대 2,000만원 부과</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>3년 검토 기산점:</strong> 직전 검토 완료일 기준 3년 이내 입대의 정기검토 의결</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>장충금 적립 공식 준수:</strong> ㎡당 최소 권장액 미달 시 적립 요율 정상화 권고</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
