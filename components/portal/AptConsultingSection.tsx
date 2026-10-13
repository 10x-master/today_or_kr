"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  FileCheck2,
  Award,
  ShieldCheck,
  X,
  Send,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

export interface ConsultingProgram {
  id: string;
  icon: string;
  title: string;
  valueTag: string; // 가치 중심 카피 (금액 표기 전면 삭제)
  targetDesc: string;
  benefits: string[];
  duration: string;
}

const CONSULTING_PROGRAMS: ConsultingProgram[] = [
  {
    id: "rep-1",
    icon: "📄",
    title: "장충금 인상 '주민설득 1장 리포트'",
    valueTag: "주민 반발 및 비대위 탄핵 민원 사전 방어 (단지 맞춤 견적)",
    targetDesc: "장기수선충당금 현실화 및 노후 시설 대수선 공사 의결 전 주민 동의율 80% 돌파",
    benefits: [
      "인근 동일 평형 대비 장충금 격차 시각화 및 K-apt 자산 가치 방어",
      "복잡한 법정 계산식 없이 한눈에 들어오는 원페이지 인포그래픽",
      "입대의 회의 및 입주민 설명회 즉시 배포용 맞춤 출력본 제공",
    ],
    duration: "영업일 기준 3일 내 맞춤 리포트 발송",
  },
  {
    id: "rep-2",
    icon: "🛠️",
    title: "3년 법정 장기수선계획 정기/수시조정",
    valueTag: "공동주택관리법 제29조 기준 행정 지적 선제 방어",
    targetDesc: "지자체 정기 행정 점검 안심 대비 및 최적 수선 플랜을 수립하는 공인 기술사 정밀 진단",
    benefits: [
      "공인 건축·설비 기술사 합동 현장 실사 및 승강기/배관 수명 진단",
      "수선항목 누락 방지 및 불필요한 과다 적립금 맞춤 최적화",
      "지자체 행정 지적 리스크 0건을 지향하는 법적 소명 공인 의견서 발행",
    ],
    duration: "현장 정밀 실사 후 2주 소요",
  },
  {
    id: "rep-3",
    icon: "⭐",
    title: "공동주택 안심 케어 & 자산 수호 연간 인증",
    valueTag: "K-apt 실거래 기반 안심 관리 공인 뱃지 및 현판 수여",
    targetDesc: "예산 집행 적정성 및 상생 소통 공인 인증으로 아파트 자산 가치 및 입주민 자긍심 극대화",
    benefits: [
      "Today. 공식 '안심 관리 1등급 단지' 공인 금빛 현판 및 모바일 뱃지",
      "부동산 포털 및 네이버 동네 팩트 피드에 아파트 가치 우수단지 홍보",
      "연간 상시 K-apt 행정/입찰 법률 질의응답 핫라인 무료 배정",
    ],
    duration: "연간 공인 멤버십 (전담 기술사 배정)",
  },
];

export interface AptConsultingSectionProps {
  initialApartmentName?: string;
  compact?: boolean;
}

export default function AptConsultingSection({
  initialApartmentName = "상계주공 14단지",
  compact = false,
}: AptConsultingSectionProps) {
  const [selectedProgram, setSelectedProgram] = useState<ConsultingProgram | null>(null);

  // 견적서 신청 폼 상태 (단지명, 총 세대수, 준공연도, 신청자 직책, 연락처)
  const [aptName, setAptName] = useState(initialApartmentName);
  const [totalUnits, setTotalUnits] = useState("1,540세대");
  const [builtYear, setBuiltYear] = useState("1989년");
  const [applicantRole, setApplicantRole] = useState("관리소장");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpenModal = (program: ConsultingProgram) => {
    setSelectedProgram(program);
    setIsSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptName.trim() || !contactPhone.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setSelectedProgram(null);
      setIsSubmitted(false);
      setContactPhone("");
      setNotes("");
    }, 2200);
  };

  return (
    <section className="h-full rounded-2xl bg-white p-3.5 border border-slate-100 flex flex-col justify-between space-y-3">
      {/* 1. 상단 섹션 타이틀 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white text-xs">
              <Building2 className="h-3 w-3" />
            </span>
            <h2 className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
              <span>아파트 회원사 공인 컨설팅 센터</span>
              <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.2 text-[10px] font-medium">
                CERA
              </span>
            </h2>
          </div>
          <span className="text-[10px] font-normal text-slate-400">
            K-apt 공공 빅데이터 독립 진단
          </span>
        </div>
        <p className="text-[11px] font-normal text-slate-500">
          고정 금액 청구가 아닌, 단지별 세대수와 준공연도에 맞춘 최적화 견적을 제안합니다.
        </p>
      </div>

      {/* 2. 3대 컨설팅 프로그램 콤팩트 카드 리스트 (금액 삭제 & 가치 중심 카피) */}
      <div className="space-y-2">
        {CONSULTING_PROGRAMS.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl bg-slate-50/70 p-2.5 space-y-1.5 transition-colors hover:bg-slate-100/70 border border-slate-100/80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <h3 className="text-xs font-medium text-slate-900 group-hover:text-blue-900 truncate transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[10.5px] font-normal text-blue-700 mt-0.5 line-clamp-1">
                    {item.valueTag}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal(item)}
                className="shrink-0 rounded-lg bg-white border border-slate-200/90 hover:bg-blue-50 hover:border-blue-300 px-2 py-1 text-[11px] font-medium text-slate-800 hover:text-blue-900 transition-colors cursor-pointer shadow-2xs"
              >
                맞춤 견적 신청
              </button>
            </div>

            <p className="text-[10.5px] font-normal text-slate-500 line-clamp-1">
              {item.targetDesc}
            </p>
          </div>
        ))}
      </div>

      {/* 3. 단지 맞춤형 견적서 원클릭 종합 신청 버튼 */}
      <div className="pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleOpenModal(CONSULTING_PROGRAMS[0])}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>📋 단지 맞춤형 공인 컨설팅 견적서 신청</span>
        </button>
      </div>

      {/* 4. 견적서 신청 폼 모달 (단지명, 총 세대수, 준공연도, 직책, 연락처) */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedProgram(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 모달 헤더 */}
            <div className="flex items-start gap-2.5 pr-6">
              <span className="text-2xl shrink-0">{selectedProgram.icon}</span>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {selectedProgram.valueTag}
                </span>
                <h3 className="text-sm font-medium text-slate-900 mt-1 leading-snug">
                  {selectedProgram.title}
                </h3>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  {selectedProgram.targetDesc}
                </p>
              </div>
            </div>

            {/* 핵심 제공 혜택 3종 */}
            <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-xs">
              <p className="text-[11px] font-medium text-slate-800">
                컨설팅 주요 산출물
              </p>
              <ul className="space-y-1">
                {selectedProgram.benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-1.5 text-[11px] font-normal text-slate-600 leading-tight"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 신청 성공 피드백 또는 입력 폼 */}
            {isSubmitted ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-center space-y-1 animate-in zoom-in-95">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-emerald-900">
                  단지 맞춤형 견적서 신청이 정상 접수되었습니다!
                </p>
                <p className="text-[11px] font-normal text-emerald-700">
                  전문 기술사가 {aptName}의 K-apt 공공 장충금 현황 기초 분석 후 24시간 내 유선 안내드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
                {/* 1) 단지명 & 신청자 직책 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      아파트 단지명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 상계주공 14단지"
                      value={aptName}
                      onChange={(e) => setAptName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      신청자 직책 *
                    </label>
                    <select
                      value={applicantRole}
                      onChange={(e) => setApplicantRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="관리소장">관리소장 (관리사무소)</option>
                      <option value="입대의 회장">입주자대표회의 회장</option>
                      <option value="동대표">동대표 / 임원</option>
                      <option value="감사">단지 감사</option>
                      <option value="입주민">인증 입주민</option>
                    </select>
                  </div>
                </div>

                {/* 2) 총 세대수 & 준공연도 (맞춤 견적 산출 핵심 인자) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      총 세대수 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 1,540세대"
                      value={totalUnits}
                      onChange={(e) => setTotalUnits(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      준공연도 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 1989년"
                      value={builtYear}
                      onChange={(e) => setBuiltYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3) 담당자 연락처 */}
                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    담당자 연락처 (휴대폰) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 4) 주요 안건 / 희망 일정 */}
                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    주요 고민 안건 / 희망 일정
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: 3년 주기 장기수선계획 정기조정 기한 임박, 지자체 감사 대비 사전 리포트 필요"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>단지 맞춤형 견적서 무료 신청하기</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
