"use client";

import React, { useState } from "react";
import {
  X,
  Bell,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Building,
  Check,
  ArrowRight,
} from "lucide-react";
import type { NoticeItem } from "@/types/officialNotice";

// 1. 슬림 알림 바 (PC 포털 중앙 상단 및 모바일 상단 노출용)
export interface ManagerApprovalBarProps {
  count: number;
  apartmentName?: string;
  onClick: () => void;
}

export function ManagerApprovalBar({
  count,
  apartmentName = "상계주공 14단지",
  onClick,
}: ManagerApprovalBarProps) {
  if (count <= 0) return null;

  return (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-300/80 px-3.5 py-2 text-xs text-amber-950 cursor-pointer hover:bg-amber-100/50 transition-colors shadow-2xs select-none"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-slate-950 text-xs shrink-0 font-medium">
          🔔
        </span>
        <span className="font-normal truncate">
          <strong className="font-medium">[{apartmentName}]</strong> 주민 10인 달성 청원{" "}
          <strong className="font-semibold text-rose-600 underline">{count}건</strong>이 관리소장 승인 대기 중입니다.
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0 font-medium text-amber-900 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
        <span>확인 및 승인</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}

// 2. 관리소장/운영진 전용 원클릭 승인 큐 모달
export interface ManagerApprovalQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: NoticeItem[];
  onApprove: (itemId: string) => void;
  onReject: (itemId: string, reason?: string) => void;
  apartmentName?: string;
}

export default function ManagerApprovalQueueModal({
  isOpen,
  onClose,
  pendingItems,
  onApprove,
  onReject,
  apartmentName = "상계주공 14단지",
}: ManagerApprovalQueueModalProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleApproveClick = (itemId: string, title: string) => {
    onApprove(itemId);
    showToast(`✓ [${title}] 공식 단지 공구로 즉시 승인되었습니다!`);
  };

  const handleRejectSubmit = (itemId: string) => {
    onReject(itemId, rejectReason || "단지 사정상 보류");
    setRejectingId(null);
    setRejectReason("");
    showToast("✓ 해당 청원 건이 반려/보류 처리되었습니다.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* 상단 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더 */}
        <div className="pr-6 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              <Building className="h-3 w-3 text-blue-600" />
              <span>관리주체 원클릭 승인 룸</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {apartmentName} 관리사무소
            </span>
          </div>

          <h2 className="text-sm font-medium text-slate-900 leading-snug">
            주민 10인 달성 청원 승인 큐 ({pendingItems.length}건)
          </h2>
          <p className="text-[11px] font-normal text-slate-500">
            입주민들이 자발적으로 10명 이상 모은 청원 건입니다. 승인 시 [공식 단지 공구]로 격상되어 전체 세대에 특판 주문서가 발송됩니다.
          </p>
        </div>

        {/* 승인 대기 리스트 */}
        {pendingItems.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center space-y-2 border border-slate-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto" />
            <p className="text-xs font-normal text-slate-600">
              현재 승인 대기 중인 주민 청원이 없습니다.
            </p>
            <p className="text-[11px] text-slate-400">
              새로운 주민 10인 청원이 접수되면 실시간으로 알림 바에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-slate-50/70 p-3.5 space-y-2.5 border border-slate-100"
              >
                {/* 상단: 상태 및 참여 인원 */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                      🙋 주민 10인 청원 달성
                    </span>
                    {item.cera_report_attached && (
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
                        <ShieldCheck className="inline h-2.5 w-2.5 mr-0.5 text-indigo-600" />
                        CERA 검증완료
                      </span>
                    )}
                  </div>

                  <span className="font-medium text-amber-900 flex items-center gap-1">
                    <Users className="h-3 w-3 text-amber-600" />
                    <span>신청 입주민: {item.petition_votes}명 참여</span>
                  </span>
                </div>

                {/* 상품명 및 제조사 */}
                <div>
                  <h3 className="text-xs font-medium text-slate-900">
                    {item.title}
                  </h3>
                  {item.content && (
                    <p className="text-[11px] font-normal text-slate-600 mt-0.5 line-clamp-2">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* 가격 및 제조사 정보 박스 */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400">제조사 직거래가</span>
                    <p className="font-medium text-slate-800">{item.price_info || "단지 특판가"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">공급 업체</span>
                    <p className="font-medium text-slate-800">{item.supplier || "투데이 제휴 회원사"}</p>
                  </div>
                </div>

                {/* 반려 사유 입력 모드 */}
                {rejectingId === item.id ? (
                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <input
                      type="text"
                      placeholder="반려/보류 사유를 입력하세요 (예: 단지 내 타 사업자 기체결)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-rose-400 focus:outline-none"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-normal text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectSubmit(item.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700 cursor-pointer"
                      >
                        반려 확정
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 원클릭 승인 / 반려 액션 버튼 */
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApproveClick(item.id, item.title)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>✅ 공식 단지 공구로 원클릭 승인</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(item.id);
                        setRejectReason("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-2 text-xs font-normal text-slate-600 transition-colors cursor-pointer"
                    >
                      반려/보류
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 풋터 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-normal">
          <span>※ 승인된 공구는 실시간으로 녹색 뱃지가 부여되어 피드 상단에 배치됩니다.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            닫기
          </button>
        </div>

        {/* 토스트 */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-normal shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xs">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
