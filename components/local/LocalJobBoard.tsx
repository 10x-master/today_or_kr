"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  Clock,
  Search,
  Filter,
  Send,
  Sparkles,
  ChevronRight,
  X,
  CheckCircle2,
  Building,
  ArrowRight,
  TrendingUp,
  Share2,
} from "lucide-react";
import type { JobPostingItem, JobApplicantSubmission } from "@/types/homepage";
import { MOCK_JOB_POSTINGS } from "@/lib/homepageSeed";

interface LocalJobBoardProps {
  initialDistrict?: string;
  className?: string;
}

export default function LocalJobBoard({
  initialDistrict = "ALL",
  className = "",
}: LocalJobBoardProps) {
  const [jobs, setJobs] = useState<JobPostingItem[]>(MOCK_JOB_POSTINGS);
  const [selectedDong, setSelectedDong] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 간편 지원 모달 상태
  const [applyTargetJob, setApplyTargetJob] = useState<JobPostingItem | null>(null);
  const [applyName, setApplyName] = useState<string>("");
  const [applyPhone, setApplyPhone] = useState<string>("");
  const [applyIntro, setApplyIntro] = useState<string>("");

  // 토스트 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 필터링된 공고 목록
  const filteredJobs = jobs.filter((job) => {
    const matchesDong =
      selectedDong === "ALL" || job.dong === selectedDong;
    const matchesRole =
      selectedRole === "ALL" || job.role_category === selectedRole;
    const matchesQuery =
      !searchQuery.trim() ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDong && matchesRole && matchesQuery;
  });

  // 간편 지원 제출
  const handleSubmitApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyTargetJob) return;
    if (!applyName.trim() || !applyPhone.trim()) {
      alert("성함과 연락처를 입력해주세요.");
      return;
    }

    const newApplication: JobApplicantSubmission = {
      id: `app-${Date.now()}`,
      job_posting_id: applyTargetJob.id,
      tenant_id: applyTargetJob.tenant_id,
      tenant_name: applyTargetJob.tenant_name,
      applicant_name: applyName.trim(),
      applicant_phone: applyPhone.trim(),
      applicant_intro: applyIntro.trim() || "성실히 일하겠습니다.",
      pipeline_stage: "APPLIED",
      applied_at: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem("today_job_applicants");
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem("today_job_applicants", JSON.stringify([newApplication, ...list]));

      // 사장님 t.note 데스크 실시간 카운팅 동기화 이벤트
      window.dispatchEvent(
        new CustomEvent("today_applicant_added", { detail: newApplication })
      );
    } catch {}

    // 카운터 증가 반영
    setJobs((prev) =>
      prev.map((j) =>
        j.id === applyTargetJob.id ? { ...j, applicant_count: j.applicant_count + 1 } : j
      )
    );

    showToast(
      `🎉 [${applyTargetJob.tenant_name}]에 1초 간편 지원이 성공적으로 완료되었습니다! 사장님의 t.note 데스크로 즉시 전송되었습니다.`
    );

    setApplyTargetJob(null);
    setApplyName("");
    setApplyPhone("");
    setApplyIntro("");
  };

  return (
    <div className={`space-y-4 font-sans text-slate-900 ${className}`}>
      {/* 토스트 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 안내 배너]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
                📍
              </span>
              <h2 className="font-bold text-sm sm:text-base text-slate-950">
                Today 로컬 안심 구인 피드
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                M-FAD 인증 매장 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              관내 동네 상권의 모든 티홈페이지(t.homepage)에서 실시간 등록된 일자리를 취합하여 1초 간편 지원을 제공합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/desk"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              내 사장님 데스크 가기 →
            </Link>
          </div>
        </div>

        {/* 검색 및 필터 바 */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="매장명, 직무, 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-medium"
            />
          </div>

          {/* 동네 탭 필터 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs shrink-0">
            {[
              { id: "ALL", label: "전체 동네" },
              { id: "정자동", label: "정자동" },
              { id: "삼평동", label: "삼평동(판교)" },
              { id: "상계동", label: "상계동" },
              { id: "역삼동", label: "역삼동" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDong(tab.id)}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap text-xs ${
                  selectedDong === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          [2. 직종 필터 칩]
         ============================================================ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: "ALL", label: "전체 직종" },
          { id: "HALL", label: "🍽️ 홀서빙" },
          { id: "KITCHEN", label: "🍳 주방보조" },
          { id: "DESK", label: "📋 인포데스크" },
          { id: "BARISTA", label: "☕ 바리스타/탭룸" },
          { id: "OTHER", label: "🩺 병의원/기타" },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setSelectedRole(chip.id)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedRole === chip.id
                ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </button>
        ))}
        <span className="text-[11px] text-slate-400 ml-auto shrink-0">
          총 {filteredJobs.length}건 모집 중
        </span>
      </div>

      {/* ============================================================
          [3. 구인 공고 피드 카드 그리드]
         ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between gap-3 text-xs"
          >
            <div className="space-y-2">
              {/* 상단: 매장명, 거리, 업종 뱃지 */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/${job.tenant_slug}`}
                      className="font-bold text-slate-950 text-xs sm:text-sm hover:underline hover:text-indigo-600 truncate flex items-center gap-1"
                    >
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.tenant_name}</span>
                    </Link>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                      {job.category_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                      <MapPin className="h-3 w-3" />
                      {job.distance_text}
                    </span>
                    <span>•</span>
                    <span>{job.dong}</span>
                  </div>
                </div>

                {/* 급여 뱃지 */}
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-950 border border-amber-200 font-bold text-xs shrink-0">
                  {job.salary_text}
                </span>
              </div>

              {/* 공고 제목 및 업무 내용 */}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                  {job.title}
                </h3>
                <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* 근무 조건 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 space-y-0.5">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{job.work_schedule}</span>
                </div>
                <p className="text-[10.5px] text-slate-400 truncate">
                  요건: {job.requirements}
                </p>
              </div>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <span className="text-[10.5px] text-slate-400">
                지원자 {job.applicant_count}명 접수 중
              </span>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/${job.tenant_slug}`}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  매장 보기
                </Link>

                <button
                  type="button"
                  onClick={() => setApplyTargetJob(job)}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <span>1초 간편 지원</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
          [간편 지원 모달 팝업]
         ============================================================ */}
      {applyTargetJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setApplyTargetJob(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                💼
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  {applyTargetJob.tenant_name} 1초 간편 지원
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  {applyTargetJob.title} • {applyTargetJob.salary_text}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitApply} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  지원자 성함:
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김지민"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  연락처 (휴대폰 번호):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="예: 010-1234-5678"
                  value={applyPhone}
                  onChange={(e) => setApplyPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  한 줄 소개 및 희망 근무 일정:
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 인근 거주하며 주 3회 성실히 근무 가능합니다."
                  value={applyIntro}
                  onChange={(e) => setApplyIntro(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>1초 간편 지원서 제출 (사장님 실시간 알림)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
