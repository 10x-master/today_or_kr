"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Users,
  Building,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";

export interface GroupBuyPetitionItem {
  id: string;
  apartmentName: string;
  dong: string;
  title: string;
  productName: string;
  category: string;
  currentVotes: number;
  targetVotes: number;
  applicantName: string;
  applicantRole: string;
  targetPrice: string;
  marketPrice: string;
  discountRate: string;
  ceraReportAttached: boolean;
  status: "PENDING" | "OFFICIAL_ACTIVE" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

const INITIAL_PETITIONS: GroupBuyPetitionItem[] = [
  {
    id: "petition-001",
    apartmentName: "상계주공 14단지",
    dong: "상계동",
    title: "아파트 싱크볼 일체형 친환경 초음파 식기·과일세척기 10인 공구",
    productName: "초음파 식기세척기 싱크볼 일체형 (특허 스마트 모델)",
    category: "친환경 주방 설비",
    currentVotes: 10,
    targetVotes: 10,
    applicantName: "이동대표",
    applicantRole: "104동 동대표 / 입대의 감사",
    targetPrice: "680,000원",
    marketPrice: "1,650,000원",
    discountRate: "58% 절감",
    ceraReportAttached: true,
    status: "PENDING",
    createdAt: "2026-10-13T10:15:00.000Z",
  },
  {
    id: "petition-002",
    apartmentName: "중계주공 3단지",
    dong: "중계동",
    title: "단지 옥상 탄성 우레탄 방수제 하도/상도 B2B 특판 자재",
    productName: "옥상 탄성 우레탄 방수제 세트 (18kg 대용량)",
    category: "공용시설 보수 자재",
    currentVotes: 10,
    targetVotes: 10,
    applicantName: "정동대표",
    applicantRole: "입주자대표회의 회장",
    targetPrice: "CERA 표준 시공가",
    marketPrice: "일반 입찰가 대비 32% 절감",
    discountRate: "32% 절감",
    ceraReportAttached: true,
    status: "PENDING",
    createdAt: "2026-10-12T16:40:00.000Z",
  },
  {
    id: "petition-003",
    apartmentName: "상계주공 14단지",
    dong: "상계동",
    title: "제주 산지직송 무농약 고당도 조생감귤 단지 입주민 상생 직거래",
    productName: "제주 서귀포 무농약 조생감귤 (5kg)",
    category: "친환경 농산물",
    currentVotes: 10,
    targetVotes: 10,
    applicantName: "김입주",
    applicantRole: "112동 입주민",
    targetPrice: "18,900원",
    marketPrice: "소비자가 29,000원",
    discountRate: "35% 절감",
    ceraReportAttached: false,
    status: "OFFICIAL_ACTIVE",
    createdAt: "2026-10-11T09:20:00.000Z",
    approvedAt: "2026-10-12T11:00:00.000Z",
  },
  {
    id: "petition-004",
    apartmentName: "상계보람 아파트",
    dong: "상계동",
    title: "지하주차장 고효율 스마트 센서 LED 등기구 일괄 교체",
    productName: "스마트 디밍 LED 주차장등 20W",
    category: "에너지 절감 설비",
    currentVotes: 6,
    targetVotes: 10,
    applicantName: "박기전",
    applicantRole: "관리사무소 기전과장",
    targetPrice: "개당 14,500원",
    marketPrice: "개당 24,000원",
    discountRate: "40% 절감",
    ceraReportAttached: true,
    status: "PENDING",
    createdAt: "2026-10-13T14:00:00.000Z",
  },
];

interface GroupBuyApprovalQueueProps {
  onStatusChange?: (item: GroupBuyPetitionItem, nextStatus: string) => void;
}

export default function GroupBuyApprovalQueue({ onStatusChange }: GroupBuyApprovalQueueProps) {
  const [petitions, setPetitions] = useState<GroupBuyPetitionItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "OFFICIAL_ACTIVE" | "REJECTED">("ALL");
  const [rejectingItem, setRejectingItem] = useState<GroupBuyPetitionItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      const saved = localStorage.getItem("today_petition_queue");
      if (saved) {
        setPetitions(JSON.parse(saved));
      } else {
        setPetitions(INITIAL_PETITIONS);
        localStorage.setItem("today_petition_queue", JSON.stringify(INITIAL_PETITIONS));
      }
    } catch {
      setPetitions(INITIAL_PETITIONS);
    }
  }, []);

  const savePetitions = (items: GroupBuyPetitionItem[]) => {
    setPetitions(items);
    try {
      localStorage.setItem("today_petition_queue", JSON.stringify(items));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 공식 공구 승인
  const handleApprove = (id: string) => {
    const target = petitions.find((p) => p.id === id);
    if (!target) return;

    const updated = petitions.map((p) =>
      p.id === id
        ? { ...p, status: "OFFICIAL_ACTIVE" as const, approvedAt: new Date().toISOString() }
        : p
    );
    savePetitions(updated);
    showToast(`✅ [${target.apartmentName}] '${target.title}' 공식 공구 승인이 완료되었습니다!`);

    if (onStatusChange) {
      onStatusChange(target, "OFFICIAL_ACTIVE");
    }
  };

  // 반려 처리
  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    const reasonText = rejectReason.trim() || "관리규약 또는 단가 적합성 보완 필요";

    const updated = petitions.map((p) =>
      p.id === rejectingItem.id
        ? { ...p, status: "REJECTED" as const, rejectionReason: reasonText }
        : p
    );
    savePetitions(updated);
    showToast(`반려 처리가 완료되었습니다. 신청자(${rejectingItem.applicantName})에게 보완 사유가 전달됩니다.`);

    if (onStatusChange) {
      onStatusChange({ ...rejectingItem, rejectionReason: reasonText }, "REJECTED");
    }

    setRejectingItem(null);
    setRejectReason("");
  };

  const filteredPetitions = petitions.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
  });

  const pending10Count = petitions.filter(
    (p) => p.status === "PENDING" && p.currentVotes >= p.targetVotes
  ).length;

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
              주민 10인 청원 원클릭 공고 승인함
            </h3>
            {pending10Count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium animate-pulse">
                10인 달성 {pending10Count}건 승인 대기
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            아파트 주민 10인 투표 달성 청원을 검토하고 원클릭으로 공식 단지 공구로 승인합니다.
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
            전체 ({petitions.length})
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
            심사 대기 ({petitions.filter((p) => p.status === "PENDING").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("OFFICIAL_ACTIVE")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === "OFFICIAL_ACTIVE"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            공식 승인 ({petitions.filter((p) => p.status === "OFFICIAL_ACTIVE").length})
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
            반려 ({petitions.filter((p) => p.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* 청원 리스트 그리드 */}
      {filteredPetitions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-xs text-slate-400">
          해당 상태의 청원 공구 건이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPetitions.map((p) => {
            const isFullVotes = p.currentVotes >= p.targetVotes;
            const progressPercent = Math.min(100, Math.round((p.currentVotes / p.targetVotes) * 100));

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-colors shadow-2xs space-y-3"
              >
                {/* 상단 메타 바 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs">
                      🏢
                    </span>
                    <span className="text-xs font-medium text-slate-900">
                      {p.apartmentName} ({p.dong})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-normal">
                      {p.category}
                    </span>
                    {p.ceraReportAttached && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        CERA 적정가 검증
                      </span>
                    )}
                  </div>

                  {/* 상태 뱃지 */}
                  <div>
                    {p.status === "OFFICIAL_ACTIVE" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        공식 공구 진행 중 (OFFICIAL_ACTIVE)
                      </span>
                    )}
                    {p.status === "PENDING" && isFullVotes && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        10인 달성 승인 대기
                      </span>
                    )}
                    {p.status === "PENDING" && !isFullVotes && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                        주민 청원 투표 중 ({p.currentVotes}/{p.targetVotes})
                      </span>
                    )}
                    {p.status === "REJECTED" && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-normal">
                        반려 완료
                      </span>
                    )}
                  </div>
                </div>

                {/* 본문 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1.5">
                    <h4 className="text-sm font-medium text-slate-900 leading-snug">
                      {p.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-normal">
                      품목: <strong className="text-slate-800">{p.productName}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>
                        신청자: <strong>{p.applicantName}</strong> ({p.applicantRole})
                      </span>
                      <span>•</span>
                      <span>
                        목표 공급가: <strong className="text-slate-900">{p.targetPrice}</strong>{" "}
                        <span className="text-emerald-700 font-medium">({p.discountRate})</span>
                      </span>
                    </div>

                    {p.rejectionReason && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-800">
                        <strong>반려 사유:</strong> {p.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* 10인 투표 게이지 박스 */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 font-normal">주민 투표 진행률</span>
                        <span className="font-semibold text-slate-900">
                          {p.currentVotes} / {p.targetVotes}명 ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFullVotes ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-slate-400">
                      신청일시: {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* 하단 액션 버튼 바 */}
                {p.status === "PENDING" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingItem(p);
                        setRejectReason("");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      🔴 반려 / 보완요청
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(p.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>🟢 공식 공구 승인</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-100 p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-medium text-slate-900">
                  청원 공구 반려 / 보완요청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>단지:</strong> {rejectingItem.apartmentName}
              </p>
              <p>
                <strong>청원:</strong> {rejectingItem.title}
              </p>
              <p>
                <strong>신청자:</strong> {rejectingItem.applicantName} ({rejectingItem.applicantRole})
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
                placeholder="예: 단지 관리규약 제45조 입찰 규정 확인 필요 / K-apt CERA 적정가 대비 품목 사양 보완 요청"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-400 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                반려 및 알림 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
