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
} from "lucide-react";
import type { CleanTrustScoreCard as CleanTrustScoreCardType } from "@/types/civic";

export interface CleanTrustScoreCardProps {
  currentDong?: string;
  initialApartmentName?: string;
  onOpenConsultingModal?: () => void;
}

// 행정동/단지별 실시간 착한아파트 4대 지수 데이터
const COMPLEX_SCORE_DATA: Record<string, CleanTrustScoreCardType> = {
  "상계주공 14단지": {
    apartmentName: "상계주공 14단지",
    totalScore: 94,
    grade: "AAA",
    certified: true,
    breakdown: {
      biddingFairness: 28, // 30점 만점
      reserveFundHealth: 24, // 25점 만점
      legalCompliance: 24, // 25점 만점
      residentEngagement: 18, // 20점 만점
    },
    statusMessage: "지자체 감사 대비 최고 안전 등급 단지입니다 (비리 위험도 0%)",
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
    statusMessage: "K-apt 실거래 대비 투명 관리 공인 인증 단지입니다",
    updatedAt: "2026.10 K-apt 실거래 기준",
  },
  "중계그린 1단지": {
    apartmentName: "중계그린 1단지",
    totalScore: 78,
    grade: "A",
    certified: false,
    breakdown: {
      biddingFairness: 23,
      reserveFundHealth: 18,
      legalCompliance: 21,
      residentEngagement: 16,
    },
    statusMessage: "장충금 현실화 및 3년 법정 정기수선계획 조정 권장 단지입니다",
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
    statusMessage: "클린트러스트 안심 현판 및 뱃지 공인 인증 단지입니다",
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
    setDownloadToast(`✓ [${data.apartmentName}] 클린트러스트 공인 진단 리포트가 다운로드되었습니다.`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 2200);
  };

  // 도넛 차트 원주 계산 (반지름 r=38, 원주=238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.totalScore / 100) * circumference;

  return (
    <div className="h-full rounded-2xl bg-white p-3.5 border border-slate-100 flex flex-col justify-between space-y-3">
      {/* 1. 상단 바: 단지 셀렉터 & 클린트러스트 공인 인증 뱃지 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 text-xs">
              ⭐
            </span>
            <span className="text-xs font-medium text-slate-900">
              착한아파트 클린트러스트 지수
            </span>
          </div>

          {/* 단지 실시간 셀렉터 */}
          <div className="relative">
            <select
              value={selectedApt}
              onChange={(e) => setSelectedApt(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200/80 rounded-lg pl-2 pr-6 py-1 text-[11px] font-medium text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
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

        {/* 85점 이상 단지 점등 뱃지 */}
        {data.totalScore >= 85 && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 text-[11px] text-emerald-800">
            <span className="flex items-center gap-1 font-medium">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              <span>⭐ 클린트러스트 공인 인증 단지 ({data.grade} 등급)</span>
            </span>
            <span className="text-[10px] text-emerald-600/80 font-normal">
              현판·모바일 뱃지 수여
            </span>
          </div>
        )}
      </div>

      {/* 2. 도넛형 종합 스코어 게이지 & 한줄 상태 요약 */}
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

          {/* 중앙 스코어 숫자 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-medium tracking-tight text-slate-900 leading-none">
              {data.totalScore}
            </span>
            <span className="text-[9px] font-normal text-slate-400 mt-0.5">
              100점 만점
            </span>
          </div>
        </div>

        {/* 종합 판정 메시지 및 등급 */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-900 text-white px-1.5 py-0.5 text-[10px] font-medium">
              {data.grade} 등급
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {data.updatedAt}
            </span>
          </div>
          <p className="text-xs font-normal text-slate-800 leading-snug">
            {data.statusMessage}
          </p>
          <p className="text-[10.5px] text-slate-400 font-normal">
            K-apt 공공데이터와 CERA 입찰 적정가 독립 교차 검증 완료
          </p>
        </div>
      </div>

      {/* 3. 4대 세부 항목별 점수 바 */}
      <div className="space-y-1.5 text-xs">
        {/* 1) 입찰 공정성 (30점 만점) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-normal">
              1. 입찰 공정성 (CERA 적정가 편차 분석)
            </span>
            <span className="text-slate-800 font-medium text-[10.5px]">
              {data.breakdown.biddingFairness} / 30점
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.biddingFairness / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* 2) 장충금 건전성 (25점 만점) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-normal">
              2. 장충금 건전성 (목적외 사용 방어율)
            </span>
            <span className="text-slate-800 font-medium text-[10.5px]">
              {data.breakdown.reserveFundHealth} / 25점
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.reserveFundHealth / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 3) 법정 준수성 (25점 만점) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-normal">
              3. 법정 이행력 (3년 정기조정 검토율)
            </span>
            <span className="text-slate-800 font-medium text-[10.5px]">
              {data.breakdown.legalCompliance} / 25점
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.legalCompliance / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 4) 주민 참여도 (20점 만점) */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-normal">
              4. 주민 참여도 (공구·청원 자치 투표율)
            </span>
            <span className="text-slate-800 font-medium text-[10.5px]">
              {data.breakdown.residentEngagement} / 20점
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(data.breakdown.residentEngagement / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. 하단 액션 버튼: 리포트 다운로드 & 맞춤 견적 연동 */}
      <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-2 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
        >
          <FileDown className="h-3.5 w-3.5 text-amber-400" />
          <span>공인 진단 1장 리포트 다운로드</span>
        </button>

        {onOpenConsultingModal && (
          <button
            type="button"
            onClick={onOpenConsultingModal}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-2.5 text-xs font-normal text-slate-700 transition-colors cursor-pointer"
          >
            <span>견적 문의</span>
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
