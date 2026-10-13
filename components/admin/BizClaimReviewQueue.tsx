"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  Check,
  X,
  AlertTriangle,
  Phone,
  Mail,
  User,
} from "lucide-react";
import type { BizClaimRequest } from "@/types/biz";

const INITIAL_CLAIMS: BizClaimRequest[] = [
  {
    id: "claim-001",
    bizId: "apt-sanggye14",
    bizTitle: "상계주공 14단지",
    bizType: "APT",
    applicantName: "김소장",
    applicantRole: "MANAGER",
    applicantPhone: "010-3849-1188",
    applicantEmail: "sanggye14.mgr@apt.kr",
    proofDocumentName: "상계주공14단지_관리사무소_고유번호증.pdf",
    submittedAt: "2026-10-13T10:20:00.000Z",
    status: "PENDING",
  },
  {
    id: "claim-002",
    bizId: "store-nowon-roastery",
    bizTitle: "노원 로스터리 상계점",
    bizType: "STORE",
    applicantName: "김노원",
    applicantRole: "REPRESENTATIVE",
    applicantPhone: "010-9922-1200",
    applicantEmail: "nowon.roastery@gmail.com",
    proofDocumentName: "사업자등록증_스캔본.jpg",
    submittedAt: "2026-10-12T15:00:00.000Z",
    status: "APPROVED",
  },
  {
    id: "claim-003",
    bizId: "corp-topsonic",
    bizTitle: "(주)탑소닉 테크놀로지",
    bizType: "CORP",
    applicantName: "박대표",
    applicantRole: "REPRESENTATIVE",
    applicantPhone: "010-5840-7788",
    applicantEmail: "ceo@topsonic.kr",
    proofDocumentName: "법인사업자등록증_공장등록증.pdf",
    submittedAt: "2026-10-11T11:45:00.000Z",
    status: "APPROVED",
  },
  {
    id: "claim-004",
    bizId: "apt-junggye03",
    bizTitle: "중계주공 3단지",
    bizType: "APT",
    applicantName: "이회장",
    applicantRole: "COUNCIL",
    applicantPhone: "010-8811-3344",
    applicantEmail: "junggye03.council@apt.kr",
    proofDocumentName: "입대의_회의록_위임장_및_명함.png",
    submittedAt: "2026-10-14T01:10:00.000Z",
    status: "PENDING",
  },
];

interface BizClaimReviewQueueProps {
  onClaimApproved?: (claim: BizClaimRequest) => void;
  onClaimRejected?: (claim: BizClaimRequest, reason: string) => void;
}

export default function BizClaimReviewQueue({
  onClaimApproved,
  onClaimRejected,
}: BizClaimReviewQueueProps) {
  const [claims, setClaims] = useState<BizClaimRequest[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [previewDoc, setPreviewDoc] = useState<BizClaimRequest | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<BizClaimRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_biz_claims");
      if (saved) {
        setClaims(JSON.parse(saved));
      } else {
        setClaims(INITIAL_CLAIMS);
        localStorage.setItem("today_biz_claims", JSON.stringify(INITIAL_CLAIMS));
      }
    } catch {
      setClaims(INITIAL_CLAIMS);
    }
  }, []);

  const saveClaims = (items: BizClaimRequest[]) => {
    setClaims(items);
    try {
      localStorage.setItem("today_biz_claims", JSON.stringify(items));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 소유권 승인 및 OWNER 권한 부여
  const handleApprove = (claimId: string) => {
    const target = claims.find((c) => c.id === claimId);
    if (!target) return;

    try {
      localStorage.setItem(`today_biz_claim_status_${target.bizId}`, "CLAIMED");
      window.dispatchEvent(
        new CustomEvent("today_biz_claim_status_changed", {
          detail: { bizId: target.bizId, status: "CLAIMED" },
        })
      );
    } catch {}

    const updated = claims.map((c) =>
      c.id === claimId ? { ...c, status: "APPROVED" as const } : c
    );
    saveClaims(updated);
    showToast(
      `🎉 [${target.bizTitle}] 소유권 이전이 승인되었습니다! 계정에 비즈홈 OWNER 권한이 부여되었습니다.`
    );

    if (onClaimApproved) {
      onClaimApproved(target);
    }
  };

  // 반려 처리
  const handleConfirmReject = () => {
    if (!rejectingClaim) return;
    const reasonText = rejectReason.trim() || "첨부 증빙 서류 식별 불가 또는 위임 관계 불명확";

    try {
      localStorage.setItem(`today_biz_claim_status_${rejectingClaim.bizId}`, "UNCLAIMED");
    } catch {}

    const updated = claims.map((c) =>
      c.id === rejectingClaim.id ? { ...c, status: "REJECTED" as const } : c
    );
    saveClaims(updated);
    showToast(`반려 처리가 완료되었습니다. 신청자(${rejectingClaim.applicantName})에게 보완 요청 알림이 발송됩니다.`);

    if (onClaimRejected) {
      onClaimRejected(rejectingClaim, reasonText);
    }

    setRejectingClaim(null);
    setRejectReason("");
  };

  const filteredClaims = claims.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  const pendingCount = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* 토스트 피드백 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 현황 & 필터 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-slate-900">
              비즈홈 소유권 이전 (Claim) 심사 대기열
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium animate-pulse">
                {pendingCount}건 심사 대기
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            아파트 관리소장 및 상점 대표자의 고유번호증·사업자등록증을 대조 심사하고 공식 관리자(OWNER) 권한을 부여합니다.
          </p>
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === "ALL"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            전체 ({claims.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === "PENDING"
                ? "bg-white text-rose-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            심사 대기 ({claims.filter((c) => c.status === "PENDING").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === "APPROVED"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            승인 완료 ({claims.filter((c) => c.status === "APPROVED").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("REJECTED")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === "REJECTED"
                ? "bg-white text-slate-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            반려 ({claims.filter((c) => c.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* 심사 대기 리스트 */}
      {filteredClaims.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
          해당 상태의 소유권 이전 신청 건이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const isPending = claim.status === "PENDING";
            const roleLabel =
              claim.applicantRole === "MANAGER"
                ? "관리사무소장"
                : claim.applicantRole === "REPRESENTATIVE"
                ? "사업자 대표"
                : claim.applicantRole === "COUNCIL"
                ? "입대의 회장/임원"
                : "위임 대리인";

            return (
              <div
                key={claim.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-colors shadow-2xs space-y-3"
              >
                {/* 상단 헤더 메타 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs">
                      {claim.bizType === "APT" ? "🏢" : "🍽️"}
                    </span>
                    <h4 className="text-sm font-medium text-slate-900">
                      {claim.bizTitle}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">({claim.bizId})</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-normal">
                      {claim.bizType === "APT" ? "아파트 단지" : "지역 상점/법인"}
                    </span>
                  </div>

                  {/* 상태 뱃지 */}
                  <div>
                    {claim.status === "PENDING" && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium flex items-center gap-1 animate-pulse">
                        <Clock className="h-3 w-3" />
                        심사 대기 (PENDING)
                      </span>
                    )}
                    {claim.status === "APPROVED" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        소유권 이전 승인 완료 (OWNER)
                      </span>
                    )}
                    {claim.status === "REJECTED" && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-normal">
                        반려됨
                      </span>
                    )}
                  </div>
                </div>

                {/* 신청자 정보 & 증빙 서류 썸네일 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 신청자 인적사항 */}
                  <div className="md:col-span-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-900 font-medium">
                        신청자: {claim.applicantName} ({roleLabel})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {claim.applicantPhone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {claim.applicantEmail}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      신청 접수 일시: {new Date(claim.submittedAt).toLocaleString()}
                    </p>

                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={`/biz/${claim.bizId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                      >
                        <span>해당 비즈홈 실시간 페이지 확인</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* 첨부 서류 미리보기 카드 */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {claim.proofDocumentName || "증빙 서류"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          사업자등록증 / 고유번호증
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewDoc(claim)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>서류 확인</span>
                    </button>
                  </div>
                </div>

                {/* 하단 심사 액션 버튼 */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingClaim(claim);
                        setRejectReason("");
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      반려 및 보완요청
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(claim.id)}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                      <span>승인 및 OWNER 권한 부여</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 증빙 서류 상세 미리보기 모달 */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-100 p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-medium text-slate-900">
                  {previewDoc.bizTitle} 증빙 서류 검토
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 서류 가상 뷰어 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-2">
                <span>
                  문서명: <strong>{previewDoc.proofDocumentName}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                  스캔 원본
                </span>
              </div>

              {/* 문서 모의 그래픽 캔버스 */}
              <div className="h-52 w-full rounded-lg bg-white border border-dashed border-slate-300 p-4 flex flex-col justify-between shadow-inner text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-800">
                      {previewDoc.bizType === "APT" ? "고유번호증 (수익사업을 하지 않는 비영리법인)" : "사업자등록증"}
                    </span>
                    <span className="text-[10px] text-slate-400">국세청 발급 인증</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>상호/법인명:</strong> {previewDoc.bizTitle}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong>대표자/관리인:</strong> {previewDoc.applicantName}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong>사업장 소재지:</strong> 서울특별시 노원구 상계동
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>신청자 연락처: {previewDoc.applicantPhone}</span>
                  <span className="text-emerald-700 font-semibold">검증 완료 마크 [인]</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
              >
                닫기
              </button>
              {previewDoc.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(previewDoc.id);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>이 서류로 즉시 승인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-100 p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-medium text-slate-900">
                  소유권 이전 신청 반려 / 보완요청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingClaim(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>대상:</strong> {rejectingClaim.bizTitle} ({rejectingClaim.bizId})
              </p>
              <p>
                <strong>신청자:</strong> {rejectingClaim.applicantName} ({rejectingClaim.applicantPhone})
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                반려 / 보완요청 사유 입력
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 첨부된 사업자등록증의 대표자 성명과 신청자 성명이 불일치합니다. 위임장을 첨부해주세요."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-400 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingClaim(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                반려 처리 및 알림톡 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
