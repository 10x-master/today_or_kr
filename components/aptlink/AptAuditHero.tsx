"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Upload,
  Camera,
  CheckCircle2,
  X,
  FileText,
  ChevronRight,
  Download,
  Building,
  TrendingUp,
  Coins,
  ArrowRight,
  ExternalLink,
  Lock,
  Unlock,
  Check,
} from "lucide-react";
import {
  MOCK_APT_AUDIT_DATA,
  getOrCreateAptAudit,
  type AptComplexAuditData,
  type ResidentAuthMethod,
} from "@/types/aptlink";

const RECOMMENDED_COMPLEXES = [
  "상계주공 14단지",
  "상계주공 5단지",
  "노원 롯데캐슬 시그니처",
  "분당 파크뷰",
  "마포 래미안 푸르지오",
];

export default function AptAuditHero() {
  const [searchQuery, setSearchQuery] = useState("상계주공 14단지");
  const [selectedAudit, setSelectedAudit] = useState<AptComplexAuditData>(() =>
    getOrCreateAptAudit("상계주공 14단지")
  );

  // 입주민 인증 락인 모달 상태
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<ResidentAuthMethod>("RECEIPT");
  const [authFilePreview, setAuthFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // 정밀 리포트 모달 상태
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartAudit = (complexName?: string) => {
    const targetName = (complexName || searchQuery).trim();
    if (!targetName) return;

    const data = getOrCreateAptAudit(targetName);
    setSelectedAudit(data);

    if (isUnlocked) {
      setIsReportModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAuthFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmVerification = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      setIsUnlocked(true);
      setIsAuthModalOpen(false);
      setIsReportModalOpen(true);
      showToast(`🎉 [${selectedAudit.complexName}] CERA-PMS 비공개 입찰 분석 리포트가 언락되었습니다!`);
    }, 1200);
  };

  const handleDownloadPdf = () => {
    showToast(`📄 [${selectedAudit.complexName}] CERA-PMS 표준 공사비 감사 리포트 PDF 출력을 시작합니다.`);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <section className="relative w-full bg-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 text-center">
        {/* 상단 엠블럼 & 신뢰 뱃지 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-bold tracking-tight shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>국토부 K-apt & CERA-PMS 공정 입찰 원가 데이터 연동</span>
        </div>

        {/* 킬러 메인 카피 */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
            내 아파트 입찰 공사비,{" "}
            <span className="text-blue-600 underline underline-offset-6 decoration-blue-200">
              적정한가?
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            방수·외벽 도색부터 승강기 교체까지, 인근 단지 표준 단가와 실시간 비교하여{" "}
            <br className="hidden sm:inline" />
            <strong className="text-slate-900 font-bold">장기수선충당금 누수 및 과다 청구</strong>를 1초 만에 무료 진단합니다.
          </p>
        </div>

        {/* 단지 검색 및 진단 CTA 박스 (순백 플랫 미니멀) */}
        <div className="max-w-2xl mx-auto p-2 sm:p-2.5 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100/80 transition-all hover:border-blue-300">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStartAudit();
            }}
            className="flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center pl-3.5">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아파트 단지명을 입력하세요 (예: 상계주공 14단지)"
                className="w-full py-3 px-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-98"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>적정가 무료 진단</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* 추천 단지 퀵 태그 */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 mr-1">인기 진단 단지:</span>
          {RECOMMENDED_COMPLEXES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setSearchQuery(name);
                handleStartAudit(name);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/60 transition-colors font-medium cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>

        {/* 3대 핵심 분석 지표 프리뷰 카드 (순백 미니멀) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-slate-200 transition-colors space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">표준 대비 입찰 편차율</span>
            <p className="text-xl font-black text-rose-600">
              +{selectedAudit.overallDeviationPercent}%
            </p>
            <p className="text-[11.5px] text-slate-500 font-normal">
              동일 세대수·연식 대비 초과 집행 추정
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-slate-200 transition-colors space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">장충금 누수 진단액</span>
            <p className="text-xl font-black text-slate-900">
              ₩{(selectedAudit.estimatedLeakAmount / 100000000).toFixed(1)}억원
            </p>
            <p className="text-[11.5px] text-slate-500 font-normal">
              3개년 누적 공사 과다 지출 위험액
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-slate-200 transition-colors space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">CERA 공정입찰 스코어</span>
            <p className="text-xl font-black text-blue-600">
              {selectedAudit.ceraScore}점{" "}
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </p>
            <p className="text-[11.5px] text-slate-500 font-normal">
              {selectedAudit.rating === "SAFE" ? "안심 관리 우수단지" : "주의 필요 관리단지"}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          [1초 입주민 인증 락인 모달 (Receipt/Capture/Entrance Upload)]
         ============================================================ */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 text-left my-auto">
            {/* 모달 헤더 */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                    <Lock className="h-4 w-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    1초 입주민 인증 락인
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  <strong className="text-blue-600 font-bold">{selectedAudit.complexName}</strong> 입찰 원가 및 장충금 비공개 보고서 열람을 위해 1초 인증을 완료해 주세요.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3대 인증 수단 선택 탭 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                인증 방식 선택 (택 1)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("RECEIPT")}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    authMethod === "RECEIPT"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className="text-lg block mb-0.5">🧾</span>
                  <span className="text-[11.5px] block leading-tight">관리비 영수증</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("APTI_SCREEN")}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    authMethod === "APTI_SCREEN"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className="text-lg block mb-0.5">📱</span>
                  <span className="text-[11.5px] block leading-tight">아파트아이 캡처</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("ENTRANCE_PHOTO")}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    authMethod === "ENTRANCE_PHOTO"
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className="text-lg block mb-0.5">🚪</span>
                  <span className="text-[11.5px] block leading-tight">동 현관/문주 사진</span>
                </button>
              </div>
            </div>

            {/* 업로드 드롭존 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 space-y-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {authFilePreview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={authFilePreview}
                    alt="인증 파일 미리보기"
                    className="max-h-36 mx-auto rounded-xl object-contain shadow-xs border border-slate-200"
                  />
                  <p className="text-xs text-blue-600 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>사진 첨부 완료 (클릭하여 변경)</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 mx-auto">
                    <Camera className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {authMethod === "RECEIPT"
                      ? "최근 관리비 고지서/영수증 사진 첨부"
                      : authMethod === "APTI_SCREEN"
                      ? "아파트아이 또는 동호수 인증 화면 캡처 첨부"
                      : "우리 아파트 동 현관 번호판 또는 문주 사진 첨부"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    주민등록번호 등 민감정보는 자동 마스킹되며 저장되지 않습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 하단 확인 버튼 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                🔒 개인정보보호법 제15조 안전 암호화 처리
              </span>

              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
                    <span>CERA-PMS 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>인증 및 리포트 언락</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          [CERA-PMS 비공개 입찰 분석 리포트 모달 (Unlocked Report View)]
         ============================================================ */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full p-5 sm:p-7 space-y-6 animate-in zoom-in-95 duration-150 text-left my-auto max-h-[90vh] overflow-y-auto">
            {/* 리포트 상단 헤더 */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                    CERA
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>{selectedAudit.complexName} 공정 입찰 정밀 분석서</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        인증 입주민 열람용
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      준공 {selectedAudit.builtYear}년 ({selectedAudit.elapsedYears}년 경과) · 총 {selectedAudit.totalUnits}세대 · K-apt 공시 연동
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="인쇄 및 PDF 다운로드"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">PDF 출력</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 핵심 진단 요약 박스 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
                <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  표준가 대비 편차
                </span>
                <p className="text-2xl font-black text-rose-600">
                  +{selectedAudit.overallDeviationPercent}%
                </p>
                <p className="text-[10.5px] text-rose-800 font-normal">
                  K-apt 동일권역 표준 단가 대비 초과
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  장충금 추정 누수액
                </span>
                <p className="text-2xl font-black text-slate-900">
                  ₩{(selectedAudit.estimatedLeakAmount / 10000).toLocaleString()}만원
                </p>
                <p className="text-[10.5px] text-slate-500 font-normal">
                  세대당 약 ₩{Math.round(selectedAudit.estimatedLeakAmount / selectedAudit.totalUnits).toLocaleString()}원 손실 추정
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  공정 입찰 스코어
                </span>
                <p className="text-2xl font-black text-blue-600">
                  {selectedAudit.ceraScore}점
                </p>
                <p className="text-[10.5px] text-blue-800 font-normal">
                  {selectedAudit.rating === "SAFE" ? "투명 관리 단지" : "사전 원가 재검토 권고"}
                </p>
              </div>
            </div>

            {/* 최근 대형 공사 입찰 대조표 */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>최근 주요 공사 입찰 표준 단가 대조표</span>
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden text-xs">
                {selectedAudit.recentBids.map((bid) => (
                  <div key={bid.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {bid.projectTitle}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          집행 시기: {bid.executionDate} · 입찰 방식: {bid.bidMethod}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          bid.status === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : bid.status === "OVERPRICED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {bid.deviationPercent > 0 ? `+${bid.deviationPercent}% 초과` : "적정 수준"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-400 block">실제 낙찰 집행액</span>
                        <strong className="text-slate-900 font-bold">
                          ₩{(bid.bidAmount / 100000000).toFixed(2)}억원
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">CERA 표준 산출가</span>
                        <strong className="text-blue-600 font-bold">
                          ₩{(bid.standardAmount / 100000000).toFixed(2)}억원
                        </strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block">차액 (과다 의심액)</span>
                        <strong className="text-rose-600 font-bold">
                          ₩{((bid.bidAmount - bid.standardAmount) / 10000).toLocaleString()}만원
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-normal">
                      💡 {bid.memo}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 핵심 리스크 및 공인 기술사 권고사항 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  ⚠️ 감지된 핵심 리스크 팩트
                </span>
                <ul className="space-y-1 text-slate-700 text-[11.5px] list-disc list-inside">
                  {selectedAudit.keyRisks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 space-y-2">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  🛠️ 공인 기술사 자문 권고사항
                </span>
                <ul className="space-y-1 text-slate-700 text-[11.5px] list-disc list-inside">
                  {selectedAudit.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 리포트 하단 액션 버튼 */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[11px] text-slate-400">
                Today Link · CERA-PMS 아파트 공정 입찰 표준 연구원
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportModalOpen(false);
                    const el = document.getElementById("repair-edu-voice-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer text-center"
                >
                  장기수선 스쿨 질문하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast("📞 전문 기술사 자문 신청이 접수되었습니다. 담당 연구원이 연락드립니다.");
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer text-center"
                >
                  공정 입찰 무료 기술 자문
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
