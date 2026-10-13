"use client";

import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  FileDown,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  HelpCircle,
  Shield,
  Coins,
} from "lucide-react";
import type { CleanTrustScoreCard as CleanTrustScoreCardType } from "@/types/civic";

export interface CleanTrustScoreCardProps {
  currentDong?: string;
  initialApartmentName?: string;
  onOpenConsultingModal?: () => void;
}

// 행정동/단지별 실시간 공동주택 안심 케어 & 자산 수호 진단 데이터 (법적 안심 딕셔너리 적용)
const COMPLEX_SCORE_DATA: Record<string, CleanTrustScoreCardType> = {
  "상계주공 14단지": {
    apartmentName: "상계주공 14단지",
    totalScore: 94, // 지자체 점검 사전 방어율 94%
    grade: "AAA",
    certified: true,
    breakdown: {
      biddingFairness: 28, // K-apt 실거래 예산 적정성 (30점 만점)
      reserveFundHealth: 24, // 미래 대규모 수선 준비도 (25점 만점)
      legalCompliance: 24, // 지자체 행정 점검 안심도 (25점 만점)
      residentEngagement: 18, // 입주민 상생 소통 지수 (20점 만점)
    },
    statusMessage: "공동주택관리법 제29조 기준 행정 지적 선제 방어 및 자산 가치 보전 우수 단지입니다.",
    updatedAt: "2026.10 K-apt 실거래 기준",
  },
  "상계주공 16단지": {
    apartmentName: "상계주공 16단지",
    totalScore: 88,
    grade: "AA",
    certified: true,
    breakdown: {
      biddingFairness: 26,
      reserveFundHealth: 22,
      legalCompliance: 23,
      residentEngagement: 17,
    },
    statusMessage: "동일 세대 평균 대비 알뜰한 관리비 집행 및 미래 대규모 수선 준비도가 우수합니다.",
    updatedAt: "2026.10 K-apt 실거래 기준",
  },
  "중계그린 1단지": {
    apartmentName: "중계그린 1단지",
    totalScore: 78,
    grade: "CARE",
    certified: false,
    breakdown: {
      biddingFairness: 23,
      reserveFundHealth: 18,
      legalCompliance: 21,
      residentEngagement: 16,
    },
    statusMessage: "💡 단지 맞춤형 지자체 시설보수 지원금 수혜 가능 항목 2건 확인 (최대 3,000만원 매칭)",
    updatedAt: "2026.09 K-apt 실거래 기준",
  },
  "하계장미 아파트": {
    apartmentName: "하계장미 아파트",
    totalScore: 91,
    grade: "AAA",
    certified: true,
    breakdown: {
      biddingFairness: 27,
      reserveFundHealth: 23,
      legalCompliance: 24,
      residentEngagement: 17,
    },
    statusMessage: "승강기·도색 등 장기 공사 시 주민 분담금 예방 및 입주민 소통 활성화 공인 단지입니다.",
    updatedAt: "2026.10 K-apt 실거래 기준",
  },
};

export default function CleanTrustScoreCard({
  currentDong = "상계동",
  initialApartmentName = "상계주공 14단지",
  onOpenConsultingModal,
}: CleanTrustScoreCardProps) {
  const [selectedApt, setSelectedApt] = useState<string>(initialApartmentName);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const data = COMPLEX_SCORE_DATA[selectedApt] || COMPLEX_SCORE_DATA["상계주공 14단지"];

  const handleDownload = () => {
    setDownloadToast(`✓ [${data.apartmentName}] 전문가 1장 안심 리포트가 다운로드되었습니다.`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 2500);
  };

  // 도넛 차트 원주 계산 (반지름 r=38, 원주=238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.totalScore / 100) * circumference;

  const isCareTarget = data.totalScore < 85 || data.grade === "CARE";
  const tierLabel =
    data.totalScore >= 90
      ? "🏆 안심 관리 1등급"
      : data.totalScore >= 80
      ? "🏆 안심 관리 2등급"
      : "🛡️ 안심 케어 관리 등급";

  return (
    <div className="h-full rounded-2xl bg-white p-3.5 border border-slate-100 flex flex-col justify-between space-y-3 font-sans">
      {/* 1. 상단 바: 단지 셀렉터 & 안심 관리 등급 뱃지 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 text-xs">
              🛡️
            </span>
            <span className="text-xs font-medium text-slate-900">
              공동주택 안심 케어 & 자산 수호 진단
            </span>
          </div>

          {/* 단지 실시간 셀렉터 */}
          <div className="relative">
            <select
              value={selectedApt}
              onChange={(e) => setSelectedApt(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200/80 rounded-lg pl-2 pr-6 py-1 text-[11px] font-medium text-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {Object.keys(COMPLEX_SCORE_DATA).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 상단 안심 뱃지 ("🏆 안심 관리 1등급" + "지자체 점검 사전 방어율 94%") */}
        {!isCareTarget ? (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 text-[11px] text-emerald-800">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tierLabel} ({data.grade})</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              지자체 점검 사전 방어율 {data.totalScore}%
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-amber-50/90 border border-amber-200 px-2.5 py-1 text-[11px] text-amber-900">
            <span className="flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>{tierLabel} (CARE)</span>
            </span>
            <span className="text-[10px] text-amber-800 font-semibold">
              지자체 점검 사전 방어율 {data.totalScore}%
            </span>
          </div>
        )}
      </div>

      {/* 2. 도넛형 종합 게이지: 지자체 점검 사전 방어율 시각화 */}
      <div className="flex items-center gap-3.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
        {/* SVG 원형 프로그레스 도넛 게이지 */}
        <div className="relative flex items-center justify-center shrink-0 w-22 h-22">
          <svg className="w-22 h-22 -rotate-90" viewBox="0 0 90 90">
            {/* 배경 원 */}
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-200/70"
              fill="transparent"
            />
            {/* 프로그레스 원 */}
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={
                data.totalScore >= 90
                  ? "text-emerald-500"
                  : data.totalScore >= 80
                  ? "text-amber-500"
                  : "text-indigo-500"
              }
              fill="transparent"
            />
          </svg>

          {/* 중앙 방어율 수치 (점수 단독 표기 배제) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {data.totalScore}%
            </span>
            <span className="text-[9px] font-normal text-slate-400 mt-0.5">
              사전 방어율
            </span>
          </div>
        </div>

        {/* 종합 판정 메시지 및 솔루션 기회 안내 */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-900 text-white px-1.5 py-0.5 text-[10px] font-medium">
              {tierLabel}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {data.updatedAt}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 leading-snug">
            지자체 점검 사전 방어율 {data.totalScore}%
          </p>

          <p className="text-[11px] font-normal text-slate-700 leading-relaxed">
            {data.statusMessage}
          </p>

          {isCareTarget ? (
            <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[10.5px] text-amber-900 leading-tight space-y-0.5">
              <p className="font-semibold">
                💡 단지 맞춤형 지자체 시설보수 지원금 수혜 가능 항목 2건 확인
              </p>
              <p className="text-amber-800 font-normal">
                🛡️ 행정 권장 보완 가이드라인 확인 ➔ [전문가 1장 안심 리포트 다운로드]
              </p>
            </div>
          ) : (
            <p className="text-[10.5px] text-slate-400 font-normal">
              K-apt 실거래 예산 분석과 CERA 표준 단가 안심 교차 검증 완료
            </p>
          )}
        </div>
      </div>

      {/* 3. 4대 세부 지표 명칭 및 긍정적 안내 카피 (법적 안심 딕셔너리) */}
      <div className="space-y-2 text-xs">
        {/* 1) K-apt 실거래 예산 적정성 */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-800 font-medium">
              1. K-apt 실거래 예산 적정성
            </span>
            <span className="text-slate-600 font-medium text-[10.5px]">
              {data.breakdown.biddingFairness} / 30
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            동일 세대 평균 대비 알뜰한 관리비 집행 분석
          </p>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.biddingFairness / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* 2) 미래 대규모 수선 준비도 */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-800 font-medium">
              2. 미래 대규모 수선 준비도
            </span>
            <span className="text-slate-600 font-medium text-[10.5px]">
              {data.breakdown.reserveFundHealth} / 25
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            승강기·도색 등 장기 공사 시 주민 분담금 예방
          </p>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.reserveFundHealth / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 3) 지자체 행정 점검 안심도 */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-800 font-medium">
              3. 지자체 행정 점검 안심도
            </span>
            <span className="text-slate-600 font-medium text-[10.5px]">
              {data.breakdown.legalCompliance} / 25
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            공동주택관리법 제29조 기준 행정 지적 선제 방어
          </p>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.legalCompliance / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 4) 입주민 상생 소통 지수 */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-800 font-medium">
              4. 입주민 상생 소통 지수
            </span>
            <span className="text-slate-600 font-medium text-[10.5px]">
              {data.breakdown.residentEngagement} / 20
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal">
            단지 공구 및 시설 개선 제안 참여율
          </p>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.residentEngagement / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. 하단 솔루션 중심 액션 버튼 */}
      <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-2 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
        >
          <FileDown className="h-3.5 w-3.5 text-amber-400" />
          <span>전문가 1장 안심 리포트 다운로드</span>
        </button>

        {onOpenConsultingModal && (
          <button
            type="button"
            onClick={onOpenConsultingModal}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-2.5 text-xs font-normal text-slate-700 transition-colors cursor-pointer"
          >
            <span>단지 맞춤형 지자체 지원금 신청</span>
          </button>
        )}
      </div>

      {/* 다운로드 토스트 */}
      {downloadToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-normal shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}
    </div>
  );
}
