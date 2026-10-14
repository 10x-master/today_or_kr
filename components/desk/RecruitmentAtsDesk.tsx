"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Calendar,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Phone,
  Mail,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  MapPin,
  X,
  Plus,
  RefreshCw,
  Search,
  Check,
  ExternalLink,
  Receipt,
  UserCheck,
} from "lucide-react";
import type {
  AtsApplicant,
  AtsPipelineStage,
  TSignLaborContract,
  TCheckAttendanceLog,
  TaxSettlementItem,
} from "@/types/recruitment";
import {
  MOCK_APPLICANTS,
  MOCK_CONTRACTS,
  MOCK_ATTENDANCE_LOGS,
  MOCK_TAX_SETTLEMENTS,
} from "@/lib/recruitmentSeed";

interface RecruitmentAtsDeskProps {
  storeName?: string;
  bizRegNumber?: string;
  representativeName?: string;
  className?: string;
}

export default function RecruitmentAtsDesk({
  storeName = "정자동 숯불화로구이 본점",
  bizRegNumber = "214-88-91823",
  representativeName = "최성호",
  className = "",
}: RecruitmentAtsDeskProps) {
  // 1. 지원자 목록 상태
  const [applicants, setApplicants] = useState<AtsApplicant[]>(MOCK_APPLICANTS);
  const [contracts, setContracts] = useState<Record<string, TSignLaborContract>>(MOCK_CONTRACTS);
  const [attendanceLogs] = useState<TCheckAttendanceLog[]>(MOCK_ATTENDANCE_LOGS);
  const [taxSettlements] = useState<TaxSettlementItem[]>(MOCK_TAX_SETTLEMENTS);

  // 2. 모달 상태
  const [activeModal, setActiveModal] = useState<
    "INTERVIEW_PLAN" | "TSIGN_CONTRACT" | "ATTENDANCE_LOGS" | "TAX_REPORT" | null
  >(null);
  const [selectedApplicant, setSelectedApplicant] = useState<AtsApplicant | null>(null);
  const [selectedContract, setSelectedContract] = useState<TSignLaborContract | null>(null);
  const [selectedTaxItem, setSelectedTaxItem] = useState<TaxSettlementItem | null>(null);

  // 3. 인터뷰 일정 조율 인풋
  const [interviewDate, setInterviewDate] = useState<string>("2026-10-16T15:00");
  const [interviewNote, setInterviewNote] = useState<string>("");

  // 4. t.sign 전자계약 작성 인풋
  const [contractHourlyWage, setContractHourlyWage] = useState<number>(11500);
  const [contractDailyHours, setContractDailyHours] = useState<number>(4);
  const [contractWeeklyDays, setContractWeeklyDays] = useState<number>(5);
  const [contractStartDate, setContractStartDate] = useState<string>("2026-10-20");
  const [contractEndDate, setContractEndDate] = useState<string>("2027-04-19");
  const [isContractSigned, setIsContractSigned] = useState<boolean>(false);
  const [signatureSvg, setSignatureSvg] = useState<string>("");

  // 5. 토스트 알림
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 티홈페이지 및 로컬 스토리지 동기화
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // 1) 기존 저장된 ATS 지원자 로드
      const savedAts = localStorage.getItem("today_ats_applicants");
      let currentList: AtsApplicant[] = savedAts ? JSON.parse(savedAts) : MOCK_APPLICANTS;

      // 2) 티홈페이지(t.homepage)에서 실시간 유입된 새 지원자 취합
      const webApplicants = localStorage.getItem("today_job_applicants");
      if (webApplicants) {
        const parsedWeb = JSON.parse(webApplicants);
        // ID 중복 방지 병합
        const existingIds = new Set(currentList.map((a) => a.id));
        const newAdditions: AtsApplicant[] = [];
        for (const wa of parsedWeb) {
          if (!existingIds.has(wa.id)) {
            newAdditions.push({
              id: wa.id,
              name: wa.applicant_name,
              phone: wa.applicant_phone,
              role: "홀서빙 및 매장 운영",
              salary_text: "시급 11,500원",
              hourly_wage: 11500,
              stage: "APPLIED",
              intro: wa.applicant_intro,
              applied_at: wa.applied_at,
            });
            existingIds.add(wa.id);
          }
        }
        if (newAdditions.length > 0) {
          currentList = [...newAdditions, ...currentList];
        }
      }

      setApplicants(currentList);
      localStorage.setItem("today_ats_applicants", JSON.stringify(currentList));

      // 3) 계약서 로컬 동기화
      const savedContracts = localStorage.getItem("today_tsign_contracts");
      if (savedContracts) {
        setContracts(JSON.parse(savedContracts));
      }
    } catch {}
  }, []);

  const saveApplicants = (next: AtsApplicant[]) => {
    setApplicants(next);
    try {
      localStorage.setItem("today_ats_applicants", JSON.stringify(next));
    } catch {}
  };

  const saveContracts = (next: Record<string, TSignLaborContract>) => {
    setContracts(next);
    try {
      localStorage.setItem("today_tsign_contracts", JSON.stringify(next));
    } catch {}
  };

  // 파이프라인 통계 계산
  const stats = {
    applied: applicants.filter((a) => a.stage === "APPLIED").length,
    interview: applicants.filter((a) => a.stage === "INTERVIEW").length,
    hired: applicants.filter((a) => a.stage === "HIRED").length,
    active: applicants.filter((a) => a.stage === "ACTIVE").length,
  };

  // 지원자 단계 변경 핸들러
  const handleMoveStage = (applicantId: string, nextStage: AtsPipelineStage) => {
    const updated = applicants.map((a) =>
      a.id === applicantId ? { ...a, stage: nextStage } : a
    );
    saveApplicants(updated);
    showToast(`🔄 지원자 상태가 [${nextStage}] 단계로 업데이트되었습니다.`);
  };

  // 면접 일정 확정 핸들러
  const handleConfirmInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    const updated = applicants.map((a) =>
      a.id === selectedApplicant.id
        ? {
            ...a,
            stage: "INTERVIEW" as AtsPipelineStage,
            interview_scheduled_at: new Date(interviewDate).toISOString(),
            interview_notes: interviewNote || "현장 면접 예정",
          }
        : a
    );
    saveApplicants(updated);
    showToast(
      `📅 [${selectedApplicant.name} 지원자] 면접 일정이 확정되었으며, 카카오 알림톡으로 면접 안내가 발송되었습니다.`
    );
    setActiveModal(null);
    setSelectedApplicant(null);
  };

  // t.sign 근로계약서 발송 및 서명 모달 오픈
  const handleOpenContractModal = (applicant: AtsApplicant) => {
    setSelectedApplicant(applicant);
    const existingContract = applicant.contract_id ? contracts[applicant.contract_id] : null;

    if (existingContract) {
      setSelectedContract(existingContract);
      setContractHourlyWage(existingContract.hourly_wage);
      setContractDailyHours(existingContract.daily_hours);
      setContractWeeklyDays(existingContract.weekly_days);
      setContractStartDate(existingContract.work_start_date);
      setContractEndDate(existingContract.work_end_date);
      setIsContractSigned(existingContract.status === "SIGNED");
    } else {
      setContractHourlyWage(applicant.hourly_wage || 11500);
      setContractDailyHours(4);
      setContractWeeklyDays(5);
      setIsContractSigned(false);
      setSelectedContract(null);
    }

    setActiveModal("TSIGN_CONTRACT");
  };

  // t.sign 근로계약서 체결 완료 처리
  const handleCompleteContract = () => {
    if (!selectedApplicant) return;

    const contractId = selectedApplicant.contract_id || `contract-${Date.now()}`;
    const weeklyHours = contractDailyHours * contractWeeklyDays;
    const isHolidayPayEligible = weeklyHours >= 15;

    // 모의 SHA-256 해시 생성
    const rawContent = `${storeName}|${selectedApplicant.name}|${contractHourlyWage}|${weeklyHours}|${Date.now()}`;
    const mockHash = Array.from(rawContent)
      .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
      .toString(16)
      .padStart(64, "e8a94b21c402187d3298abff10984aef5083c92178e24fa0912cb843109a2754");

    const newContract: TSignLaborContract = {
      id: contractId,
      applicant_id: selectedApplicant.id,
      employer_name: representativeName,
      employer_store: storeName,
      biz_reg_number: bizRegNumber,
      employee_name: selectedApplicant.name,
      employee_phone: selectedApplicant.phone,
      hourly_wage: contractHourlyWage,
      daily_hours: contractDailyHours,
      weekly_days: contractWeeklyDays,
      weekly_hours: weeklyHours,
      is_holiday_pay_eligible: isHolidayPayEligible,
      work_start_date: contractStartDate,
      work_end_date: contractEndDate,
      renewal_alert_date: "2027-04-16",
      sha256_hash: mockHash,
      status: "SIGNED",
      audit_trail: {
        auth_method: "KAKAO_CERT",
        ip_address: "211.192.48.112",
        signed_at: new Date().toISOString(),
        cert_serial: `CERT-TSIGN-${Date.now().toString().slice(-6)}`,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 계약서 저장
    const updatedContracts = { ...contracts, [contractId]: newContract };
    saveContracts(updatedContracts);

    // 지원자 상태를 ACTIVE(근태/정산 가동) 단계로 자동 이관!
    const updatedApplicants = applicants.map((a) =>
      a.id === selectedApplicant.id
        ? {
            ...a,
            stage: "ACTIVE" as AtsPipelineStage,
            contract_id: contractId,
            workforce_id: `wf-${selectedApplicant.id}`,
          }
        : a
    );
    saveApplicants(updatedApplicants);

    showToast(
      `🎉 [${selectedApplicant.name}님] t.sign 고용노동부 표준 근로계약서가 SHA-256 전자서명 날인되어 체결 완료되었습니다! t.check 50m 지오펜싱 출퇴근 명부로 자동 이관되었습니다.`
    );

    setActiveModal(null);
    setSelectedApplicant(null);
  };

  // 세무 리포트 모달 오픈
  const handleOpenTaxReport = (applicant: AtsApplicant) => {
    const found = taxSettlements.find((t) => t.employee_name === applicant.name) || {
      id: `tax-${applicant.id}`,
      employee_name: applicant.name,
      employee_phone: applicant.phone,
      period: "2026년 10월",
      total_work_hours: 60,
      base_pay: 690000,
      holiday_pay: 138000,
      gross_pay: 828000,
      income_tax_3pct: 24840,
      local_tax_03pct: 2480,
      total_withholding_tax: 27320,
      net_pay: 800680,
      store_name: storeName,
      biz_reg_number: bizRegNumber,
      representative_name: representativeName,
    };
    setSelectedTaxItem(found);
    setActiveModal("TAX_REPORT");
  };

  // 브라우저 A4 인쇄
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className={`space-y-4 font-sans text-slate-900 ${className}`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 실시간 통계 바: 지원자 파이프라인 수치]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs">
                💼
              </span>
              <h2 className="font-bold text-sm sm:text-base text-slate-950">
                알바 ATS & t.sign/t.check 노무·세무 자동화 데스크
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {storeName} • 고용노동부 표준 근로계약 및 50m 지오펜싱 세무 정산 파이프라인
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedTaxItem(taxSettlements[0]);
                setActiveModal("TAX_REPORT");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5 text-indigo-600" />
              <span>3.3% 세무 리포트 출력</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal("ATTENDANCE_LOGS")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>t.check 출결 로그 ({attendanceLogs.length})</span>
            </button>
          </div>
        </div>

        {/* 4단계 파이프라인 프로그레스 바 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">① 신규 지원</span>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">{stats.applied}명</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              티홈 유입
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">② 면접 진행</span>
              <p className="text-base font-bold text-amber-600 font-mono mt-0.5">{stats.interview}명</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              일정 조율
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">③ 채용 확정</span>
              <p className="text-base font-bold text-rose-600 font-mono mt-0.5">{stats.hired}명</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
              t.sign 대기
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">④ 현재 출근 중</span>
              <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">{stats.active}명</p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
              t.check 50m
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          [2. 4단계 칸반 보드 (Kanban Board)]
         ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
        {/* ==========================================================
            열 1: [신규 지원 (APPLIED)]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white text-[10px] font-bold">
                1
              </span>
              <h3 className="font-bold text-xs text-slate-900">신규 지원</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
              {stats.applied}명
            </span>
          </div>

          <div className="space-y-2.5">
            {applicants
              .filter((a) => a.stage === "APPLIED")
              .map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-2xs hover:border-slate-300 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{app.name}</h4>
                      <p className="text-[10.5px] text-slate-500 font-mono">{app.phone}</p>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9.5px] font-semibold">
                      {app.salary_text}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {app.intro || app.role}
                  </p>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplicant(app);
                        setActiveModal("INTERVIEW_PLAN");
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors cursor-pointer"
                    >
                      면접 조율 →
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStage(app.id, "REJECTED")}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 text-[11px] transition-colors cursor-pointer"
                      title="보류 / 불합격"
                    >
                      보류
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ==========================================================
            열 2: [면접 조율 (INTERVIEW)]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-600 text-white text-[10px] font-bold">
                2
              </span>
              <h3 className="font-bold text-xs text-slate-900">면접 조율</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
              {stats.interview}명
            </span>
          </div>

          <div className="space-y-2.5">
            {applicants
              .filter((a) => a.stage === "INTERVIEW")
              .map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{app.name}</h4>
                      <p className="text-[10.5px] text-slate-500 font-mono">{app.phone}</p>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9.5px] font-bold">
                      면접 예정
                    </span>
                  </div>

                  {app.interview_scheduled_at && (
                    <div className="p-2 rounded-lg bg-white border border-amber-200/80 text-[10.5px] text-amber-950 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="font-bold">
                        {new Date(app.interview_scheduled_at).toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {app.interview_notes && (
                    <p className="text-[10.5px] text-slate-600 italic">
                      메모: {app.interview_notes}
                    </p>
                  )}

                  <div className="pt-1 flex items-center gap-1.5 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenContractModal(app);
                      }}
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      <span>⚡ 채용 확정 & t.sign 발송</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ==========================================================
            열 3: [채용 확정 (HIRED)]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-600 text-white text-[10px] font-bold">
                3
              </span>
              <h3 className="font-bold text-xs text-slate-900">채용 확정</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
              {stats.hired}명
            </span>
          </div>

          <div className="space-y-2.5">
            {applicants
              .filter((a) => a.stage === "HIRED")
              .map((app) => {
                const contract = app.contract_id ? contracts[app.contract_id] : null;
                const isSigned = contract?.status === "SIGNED";

                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-rose-200 bg-rose-50/30 p-3 shadow-2xs text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{app.name}</h4>
                        <p className="text-[10.5px] text-slate-500 font-mono">{app.phone}</p>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                          isSigned
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isSigned ? "서명 완료" : "t.sign 대기"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">{app.role}</p>

                    <div className="p-2 rounded-lg bg-white border border-rose-100 space-y-1 text-[10.5px]">
                      <div className="flex justify-between text-slate-600">
                        <span>약정 시급:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          ₩{(contract?.hourly_wage || app.hourly_wage).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>주 근로시간:</span>
                        <span className="font-mono">
                          {contract ? `${contract.weekly_hours}시간/주` : "주 20시간"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 space-y-1.5 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleOpenContractModal(app)}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <FileCheck className="h-3 w-3 text-amber-400" />
                        <span>t.sign 계약서 {isSigned ? "조회" : "체결"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveStage(app.id, "ACTIVE")}
                        className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>출근부(t.check) 등록 →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ==========================================================
            열 4: [근태/정산 (ACTIVE)]
           ========================================================== */}
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                4
              </span>
              <h3 className="font-bold text-xs text-slate-900">근태/정산</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              {stats.active}명 가동
            </span>
          </div>

          <div className="space-y-2.5">
            {applicants
              .filter((a) => a.stage === "ACTIVE")
              .map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 shadow-2xs text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-xs">{app.name}</h4>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-mono">{app.phone}</p>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 text-[9.5px] font-bold">
                      t.check 안심
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">{app.role}</p>

                  <div className="p-2 rounded-lg bg-white border border-emerald-100 space-y-1 text-[10.5px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>지오펜싱:</span>
                      <span className="font-semibold text-emerald-700">반경 50m 정상 인증</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>최근 출근:</span>
                      <span className="font-mono text-slate-900 font-bold">10:28 (14.2m)</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleOpenTaxReport(app)}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Receipt className="h-3 w-3 text-amber-400" />
                      <span>3.3% 세무 영수증</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ============================================================
          [모달 1: 면접 일정 조율 팝업]
         ============================================================ */}
      {activeModal === "INTERVIEW_PLAN" && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-xs">
                📅
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  {selectedApplicant.name} 지원자 면접 일정 조율
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  연락처: {selectedApplicant.phone} • {selectedApplicant.role}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmInterview} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  면접 희망 일시:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  면접 안내 메모 (매장 위치 및 지참물):
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 정자동 푸르지오시티 1층 108호 매장 방문. 신분증 지참 요망."
                  value={interviewNote}
                  onChange={(e) => setInterviewNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>카카오 알림톡 면접 안내 발송 & 일정 확정</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 2: t.sign 표준 근로계약 체결 팝업]
         ============================================================ */}
      {activeModal === "TSIGN_CONTRACT" && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[92vh] overflow-y-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                📜
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  고용노동부 표준 단기/알바 근로계약서 (t.sign)
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  전자서명법 제3조 공인 전자계약 • SHA-256 감사추적서 발급
                </p>
              </div>
            </div>

            {/* 계약서 조항 프리뷰 */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <span>[계약 당사자]</span>
                <span className="text-emerald-700">고용노동부 표준 서식 호환</span>
              </div>
              <p>
                <strong>사업주(갑):</strong> {storeName} (대표: {representativeName} / 사업자번호: {bizRegNumber})
              </p>
              <p>
                <strong>근로자(을):</strong> {selectedApplicant.name} (연락처: {selectedApplicant.phone})
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-slate-700">
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">약정 시급:</label>
                  <input
                    type="number"
                    value={contractHourlyWage}
                    onChange={(e) => setContractHourlyWage(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">일 근로시간 / 주 근무일:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={contractDailyHours}
                      onChange={(e) => setContractDailyHours(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900"
                    />
                    <span>시간 x</span>
                    <input
                      type="number"
                      value={contractWeeklyDays}
                      onChange={(e) => setContractWeeklyDays(Number(e.target.value))}
                      className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900"
                    />
                    <span>일</span>
                  </div>
                </div>
              </div>

              {/* 주휴수당 자동 산정 배너 */}
              <div
                className={`p-2 rounded-lg text-[10.5px] font-medium flex items-center justify-between ${
                  contractDailyHours * contractWeeklyDays >= 15
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span>
                  주 소정근로시간: <strong>{contractDailyHours * contractWeeklyDays}시간</strong>
                </span>
                <span>
                  {contractDailyHours * contractWeeklyDays >= 15
                    ? "✓ 주 15시간 이상 (주휴수당 법정 의무 적용)"
                    : "○ 주 15시간 미만 (주휴수당 미해당)"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">계약 시작일:</label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">계약 만료일:</label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 모바일 전자서명 및 감사추적서 (Audit Trail) */}
            <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-amber-300 font-bold">
                  본인인증 & SHA-256 감사추적서 (Audit Trail)
                </span>
                <span className="text-slate-400 font-mono">카카오/PASS 인증 연동</span>
              </div>
              <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                <p>• 서명자 IP: 211.192.48.112 (위치 검증 완료)</p>
                <p>• 해시값: SHA-256 e8a94b21c402187d3298abff10984aef5083c921...</p>
                <p>• 계약 만료 3일 전 자동 갱신 알림 트리거 활성화</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={handleCompleteContract}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
              >
                <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>카카오톡 비대면 서명 날인 & 출근부 자동 이관</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 3: t.check 50m 지오펜스 근태 출결 로그 팝업]
         ============================================================ */}
      {activeModal === "ATTENDANCE_LOGS" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
                📍
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  t.check 매장 반경 50m 지오펜싱 실시간 출결 로그
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  GPS 정밀 위치 교차 검증 • 대리출석 원천 차단
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {attendanceLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{log.employee_name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.check_type === "CHECK_IN"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {log.check_type === "CHECK_IN" ? "출근 완료" : "퇴근 완료"}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        반경 {log.distance_meters}m 안착
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      단말기: {log.device_name}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.checked_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 4: 📄 3.3% 원천징수 & 인건비 세무 리포트 출력 팝업 (A4 인쇄 대응)]
         ============================================================ */}
      {activeModal === "TAX_REPORT" && selectedTaxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl space-y-4 border border-slate-200 max-h-[95vh] overflow-y-auto text-xs print:p-0 print:border-none print:shadow-none">
            {/* 닫기 버튼 (인쇄 시 숨김) */}
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer print:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 인쇄 전용 헤더 및 명세서 본문 */}
            <div className="space-y-4 print:space-y-3">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  사업소득(3.3%) 원천징수 및 인건비 지급명세서
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  [종합소득세 필요경비 산입 및 세무사 제출용 공식 정산서]
                </p>
              </div>

              {/* 기본 정보 테이블 */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <p><strong>상호(사업장):</strong> {selectedTaxItem.store_name}</p>
                  <p><strong>사업자등록번호:</strong> {selectedTaxItem.biz_reg_number}</p>
                  <p><strong>대표자:</strong> {selectedTaxItem.representative_name}</p>
                </div>
                <div className="space-y-1">
                  <p><strong>소득자 성명:</strong> {selectedTaxItem.employee_name}</p>
                  <p><strong>연락처:</strong> {selectedTaxItem.employee_phone}</p>
                  <p><strong>귀속 기간:</strong> {selectedTaxItem.period}</p>
                </div>
              </div>

              {/* 지급 및 공제 내역 표 */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                      <th className="p-2.5">구분 항목</th>
                      <th className="p-2.5 text-right">산출 내역</th>
                      <th className="p-2.5 text-right">금액 (원)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans">기본급 (시급 x 근무시간)</td>
                      <td className="p-2.5 text-right text-slate-500">누적 {selectedTaxItem.total_work_hours}시간</td>
                      <td className="p-2.5 text-right font-bold">₩{selectedTaxItem.base_pay.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">주휴수당 (유급휴일)</td>
                      <td className="p-2.5 text-right text-slate-500">법정 기준 산출</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        +₩{selectedTaxItem.holiday_pay.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2.5 font-sans">총 지급액 (과세표준)</td>
                      <td className="p-2.5 text-right text-slate-500">소득세 부과 기준</td>
                      <td className="p-2.5 text-right text-slate-900">
                        ₩{selectedTaxItem.gross_pay.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="text-rose-700">
                      <td className="p-2.5 font-sans">소득세 (3.0%)</td>
                      <td className="p-2.5 text-right text-slate-400">국세 원천징수</td>
                      <td className="p-2.5 text-right">-₩{selectedTaxItem.income_tax_3pct.toLocaleString()}</td>
                    </tr>
                    <tr className="text-rose-700">
                      <td className="p-2.5 font-sans">지방소득세 (0.3%)</td>
                      <td className="p-2.5 text-right text-slate-400">지방세 원천징수</td>
                      <td className="p-2.5 text-right">-₩{selectedTaxItem.local_tax_03pct.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-rose-50 font-bold text-rose-900">
                      <td className="p-2.5 font-sans">원천징수 세액 합계 (3.3%)</td>
                      <td className="p-2.5 text-right">공제 합계</td>
                      <td className="p-2.5 text-right">
                        -₩{selectedTaxItem.total_withholding_tax.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold text-sm">
                      <td className="p-3 font-sans">차인지급액 (실제 수령액)</td>
                      <td className="p-3 text-right text-slate-300 font-sans text-xs">통장 입금액</td>
                      <td className="p-3 text-right text-emerald-400">
                        ₩{selectedTaxItem.net_pay.toLocaleString()} 원
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 영수인 확인 서명란 */}
              <div className="p-3.5 border border-dashed border-slate-300 rounded-xl space-y-2 text-slate-700 leading-relaxed text-[11px]">
                <p>위 금액을 영수(지급)하였으며, 소득세법 제127조에 따라 원천징수하였음을 증명합니다.</p>
                <div className="flex justify-between items-center pt-2 font-bold text-slate-900">
                  <span>지급일자: {new Date().toLocaleDateString("ko-KR")}</span>
                  <span>지급자: {selectedTaxItem.store_name} 대표 {selectedTaxItem.representative_name} (인)</span>
                </div>
              </div>
            </div>

            {/* 인쇄 및 다운로드 버튼 (인쇄 시 숨김) */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4 text-amber-400" />
                <span>A4 1장 즉시 인쇄 (세무사 제출용)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
