"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  FileCheck2,
  Search,
  Award,
  ShieldCheck,
  X,
  Send,
  Sparkles,
} from "lucide-react";

export interface ConsultingProgram {
  id: string;
  icon: string;
  title: string;
  priceTag: string;
  targetDesc: string;
  benefits: string[];
  duration: string;
}

const CONSULTING_PROGRAMS: ConsultingProgram[] = [
  {
    id: "rep-1",
    icon: "📄",
    title: "장충금 1장 주민설득 리포트 신청",
    priceTag: "건당 50만~150만 원",
    targetDesc: "장기수선충당금 인상 또는 대수선 공사 의결 전 주민 동의율 확보",
    benefits: [
      "인근 동일 평형 대비 장충금 격차 시각화",
      "K-apt 실거래가 하락 방어 경제성 팩트 분석",
      "복잡한 수치 없이 주민 투표 1장에 설득하는 원페이지 인포그래픽",
    ],
    duration: "영업일 기준 3일 소요",
  },
  {
    id: "rep-2",
    icon: "🛠️",
    title: "3년 법정 장기수선계획 조정 패키지",
    priceTag: "단지당 300만~800만 원",
    targetDesc: "공동주택관리법 제29조에 따른 3년 주기 정기 법정 검토 및 조정",
    benefits: [
      "공인 건축·설비 기술사 합동 현장 실사 및 부품 수명 진단",
      "수선항목 누락 방지 및 불필요한 과다 적립금 최적화",
      "지자체 감사 지적 0건 보장 전문 의견서 발행",
    ],
    duration: "현장 실사 후 2주 소요",
  },
  {
    id: "rep-3",
    icon: "🔍",
    title: "K-apt 공사 입찰공고 사전 적정성 평가",
    priceTag: "건당 40만~90만 원",
    targetDesc: "승강기, 도장, 방수 등 억대 공사 발주 전 담합·적정가 사전 검증",
    benefits: [
      "최근 3개년 전국 유사 단지 낙찰가 빅데이터 CERA 엔진 비교",
      "특정 업체 몰아주기 제한 조항 및 독소조항 필터링",
      "입찰 공고문 표준 수정안 제공",
    ],
    duration: "접수 후 48시간 이내 긴급 회신",
  },
  {
    id: "rep-4",
    icon: "⭐",
    title: "착한아파트(클린트러스트) 연간 인증 신청",
    priceTag: "단지당 연 120만 원",
    targetDesc: "투명 관리·입찰 비리 제로 공식 인증 뱃지 및 단지 홍보 지원",
    benefits: [
      "Today. 공식 '클린트러스트 안심단지' 인증 현판 및 모바일 뱃지",
      "부동산 포털 및 네이버 팩트 피드에 아파트 가치 우수단지 홍보",
      "연간 상시 K-apt 행정/입찰 법률 질의응답 핫라인",
    ],
    duration: "연간 구독 멤버십",
  },
];

export default function AptConsultingSection() {
  const [selectedProgram, setSelectedProgram] = useState<ConsultingProgram | null>(null);
  const [aptName, setAptName] = useState("");
  const [applicantRole, setApplicantRole] = useState("동대표");
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
      setAptName("");
      setContactPhone("");
      setNotes("");
    }, 2200);
  };

  return (
    <section className="bg-white py-2.5 px-3 border-b border-slate-100 space-y-2">
      {/* 1. 상단 섹션 타이틀 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Building2 className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>아파트 회원사 공인 컨설팅 센터</span>
            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-medium">
              CERA Engine
            </span>
          </h2>
        </div>
        <span className="text-[10px] font-normal text-slate-400">
          K-apt 공공 빅데이터 기반 독립 진단
        </span>
      </div>

      {/* 2. 실시간 진단 현황 스트립 바 */}
      <div className="rounded-xl bg-slate-50/80 p-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="font-normal text-slate-700 truncate leading-snug">
            <span className="font-medium text-slate-900">상계주공 14단지 승강기 전면교체 입찰</span>
            <span className="text-slate-400 mx-1.5">|</span>
            <span>K-apt 실거래 대비 적정가 분석 완료</span>
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-medium">
          CERA 안정 스코어 94점
        </span>
      </div>

      {/* 3. 4대 컨설팅 퀵 액션 알약 버튼 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {CONSULTING_PROGRAMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleOpenModal(item)}
            className="group flex items-center justify-between rounded-xl bg-slate-50/60 hover:bg-slate-100/80 p-2 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
                  {item.title}
                </p>
                <p className="text-[10px] font-normal text-slate-400 truncate mt-0.5">
                  {item.priceTag}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-normal text-indigo-600 group-hover:translate-x-0.5 transition-transform ml-1">
              신청 →
            </span>
          </button>
        ))}
      </div>

      {/* 4. 컨설팅 상세 신청 모달 */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedProgram(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 모달 헤더 */}
            <div className="flex items-start gap-2.5 pr-6">
              <span className="text-2xl">{selectedProgram.icon}</span>
              <div>
                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {selectedProgram.priceTag} • {selectedProgram.duration}
                </span>
                <h3 className="text-sm font-medium text-slate-900 mt-1 leading-snug">
                  {selectedProgram.title}
                </h3>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  {selectedProgram.targetDesc}
                </p>
              </div>
            </div>

            {/* 제공 혜택 리스트 */}
            <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-xs">
              <p className="text-[11px] font-medium text-slate-700">핵심 제공 내용</p>
              <ul className="space-y-1">
                {selectedProgram.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] font-normal text-slate-600 leading-tight">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 성공 피드백 안내 또는 입력 폼 */}
            {isSubmitted ? (
              <div className="rounded-xl bg-emerald-50 p-3.5 text-center space-y-1 animate-in zoom-in-95">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-emerald-900">
                  컨설팅 신청서가 정상 접수되었습니다.
                </p>
                <p className="text-[11px] font-normal text-emerald-700">
                  전문 진단 기술사가 단지 K-apt 기초 분석 후 24시간 내 유선 안내드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      단지명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 상계주공 14단지"
                      value={aptName}
                      onChange={(e) => setAptName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      신청자 직책 *
                    </label>
                    <select
                      value={applicantRole}
                      onChange={(e) => setApplicantRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="동대표">동대표 / 입대의</option>
                      <option value="관리소장">관리소장 / 관리팀</option>
                      <option value="감사">단지 감사</option>
                      <option value="입주민">인증 입주민</option>
                    </select>
                  </div>
                </div>

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
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    주요 안건 / 희망 일정
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: 다가오는 정기회의 전 주민설득용 장충금 비교표 긴급 필요"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>공인 컨설팅 신청서 제출</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
