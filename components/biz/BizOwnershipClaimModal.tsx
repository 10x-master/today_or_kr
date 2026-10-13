"use client";

import { useState, useRef } from "react";
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  FileUp,
  HelpCircle,
  Phone,
  Shield,
  ShieldCheck,
  Store,
  Upload,
  User,
  X,
} from "lucide-react";
import type { BizType, BizClaimRequest } from "@/types/biz";

interface BizOwnershipClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  bizId: string;
  bizTitle: string;
  bizType: BizType;
  onSuccess?: (claim: BizClaimRequest) => void;
}

export default function BizOwnershipClaimModal({
  isOpen,
  onClose,
  bizId,
  bizTitle,
  bizType,
  onSuccess,
}: BizOwnershipClaimModalProps) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantRole, setApplicantRole] = useState<
    "REPRESENTATIVE" | "MANAGER" | "COUNCIL" | "AGENT"
  >(bizType === "APT" ? "MANAGER" : "REPRESENTATIVE");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantPhone || !agreeTerms) return;

    setSubmitting(true);

    const newClaim: BizClaimRequest = {
      id: `claim-${Date.now()}`,
      bizId,
      bizTitle,
      bizType,
      applicantName,
      applicantRole,
      applicantPhone,
      applicantEmail: applicantEmail || `${applicantPhone.replace(/\D/g, "")}@today.internal`,
      proofDocumentName: fileName || "사업자등록증_사본.pdf",
      proofDocumentUrl: filePreview || undefined,
      submittedAt: new Date().toISOString(),
      status: "PENDING",
    };

    // 로컬 스토리지에 신청건 적재
    try {
      const existingRaw = localStorage.getItem("today_biz_claims");
      const list: BizClaimRequest[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(newClaim);
      localStorage.setItem("today_biz_claims", JSON.stringify(list));
      localStorage.setItem(`today_biz_claim_status_${bizId}`, "CLAIM_PENDING");

      window.dispatchEvent(
        new CustomEvent("today_biz_claimed", { detail: { bizId, claim: newClaim } })
      );
    } catch {}

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      if (onSuccess) onSuccess(newClaim);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-100 shadow-2xl overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150">
        {/* 헤더 바 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-medium text-xs">
              {bizType === "APT" ? "🏢" : "🍽️"}
            </span>
            <div>
              <h3 className="text-sm font-medium text-slate-900 tracking-tight">
                공식 비즈 홈 소유권 이전 (Claim)
              </h3>
              <p className="text-[10px] text-slate-400 font-normal">
                {bizTitle} · 1분 권한 등록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          /* 신청 완료 안내 화면 */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-medium text-slate-900">
                소유권 이전 신청이 접수되었습니다!
              </h4>
              <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                제출해주신 증빙 서류는 최고관리자 CRM 승인 대기열로 즉시 적재되었습니다.
                <br />
                검토 완료(평균 10분 이내) 시 등록된 연락처로 SMS/알림톡이 발송됩니다.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-left space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>대상 시설/사업체:</span>
                <span className="font-medium text-slate-900">{bizTitle}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>신청자 / 직책:</span>
                <span className="font-medium text-slate-900">
                  {applicantName} (
                  {applicantRole === "MANAGER"
                    ? "관리소장"
                    : applicantRole === "REPRESENTATIVE"
                    ? "대표자"
                    : applicantRole === "COUNCIL"
                    ? "입대의 임원"
                    : "대리인"}
                  )
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>현재 상태:</span>
                <span className="font-medium text-amber-600">심사 대기중 (CLAIM_PENDING)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              확인 및 비즈 홈으로 돌아가기
            </button>
          </div>
        ) : (
          /* 신청 폼 */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* 안내 띠배너 */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-3 text-amber-950 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-medium text-[11px]">
                  공식 권한을 획득하면 공고 직발행 및 1:1 상담창구가 활성화됩니다.
                </p>
                <p className="text-[10px] text-amber-900/80 font-normal mt-0.5">
                  허위 권한 신청 방지를 위해 고유번호증, 사업자등록증 또는 명함 사진이 필요합니다.
                </p>
              </div>
            </div>

            {/* 입력 필드 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  신청자 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  직책 구분 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={applicantRole}
                  onChange={(e) =>
                    setApplicantRole(
                      e.target.value as "REPRESENTATIVE" | "MANAGER" | "COUNCIL" | "AGENT"
                    )
                  }
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-slate-400"
                >
                  {bizType === "APT" ? (
                    <>
                      <option value="MANAGER">🏢 아파트 관리사무소장</option>
                      <option value="COUNCIL">👥 입주자대표회의 회장/임원</option>
                      <option value="AGENT">🤝 위탁관리사 대리인</option>
                    </>
                  ) : (
                    <>
                      <option value="REPRESENTATIVE">🍽️ 사업자 대표자</option>
                      <option value="MANAGER">👔 총괄 관리책임자/지점장</option>
                      <option value="AGENT">💼 위임 영업대리인</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  휴대폰 번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  이메일 (선택)
                </label>
                <input
                  type="email"
                  placeholder="official@company.kr"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            {/* 증빙 서류 업로드 드롭존 */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                증빙 서류 첨부 (사업자등록증 / 고유번호증 / 명함 사진)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? "border-amber-400 bg-amber-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />

                {fileName ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <FileCheck2 className="h-5 w-5" />
                    <span className="font-medium truncate max-w-[240px]">{fileName}</span>
                    <span className="text-[10px] text-slate-400">(변경 클릭)</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-5 w-5 mx-auto text-slate-400" />
                    <p className="text-[11px] text-slate-600 font-medium">
                      사진 또는 PDF 파일을 드래그하거나 클릭하여 첨부
                    </p>
                    <p className="text-[10px] text-slate-400">
                      * 주민번호 등 민감정보는 가려도 무방합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 법적 책임 동의 체크 */}
            <div className="pt-1">
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-0"
                />
                <span className="leading-tight">
                  [필수] 본인은 해당 단지/사업체의 정당한 관리 책임자이며, 허위 신청 시 관련
                  법령에 따라 소유권 회수 및 법적 조치를 받을 수 있음에 동의합니다.
                </span>
              </label>
            </div>

            {/* 하단 제출 버튼 */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !agreeTerms || !applicantName || !applicantPhone}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                {submitting ? "접수 처리 중..." : "1초 소유권 이전 신청"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
