"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
  CheckCircle2,
  Megaphone,
  ShieldCheck,
  Filter,
  Sparkles,
} from "lucide-react";
import type { NoticeItem, NoticeTrackType } from "@/types/officialNotice";
import FeedCard from "@/components/feed/FeedCard";
import ManagerApprovalQueueModal, {
  ManagerApprovalBar,
} from "@/components/admin/ManagerApprovalQueueModal";
import OfficialNoticeCreateModal from "@/components/portal/OfficialNoticeCreateModal";

export interface PortalLiveDeskProps {
  apartmentName?: string;
  isManager?: boolean;
}

// 4대 트랙 시드 데이터 (상계주공 14단지 기준)
const SEED_TRACK_NOTICES: NoticeItem[] = [
  {
    id: "track-off-1",
    title: "2026 하반기 상계주공 14단지 승강기 전면 교체 공사 입찰 공고",
    track: "OFFICIAL",
    author_role: "MANAGER",
    author_name: "상계주공 14단지 관리사무소",
    apartment_name: "상계주공 14단지",
    category: "장기수선 공사 입찰",
    content: "K-apt 실거래가 기반 승강기 20개소 전면 교체 적정가 심사 완료. 장충금 예산 대비 1.2억 원 절감 적정가 입찰 공고문입니다.",
    petition_votes: 0,
    approval_status: "APPROVED",
    cera_report_attached: true,
    created_at: "오늘 오전 09:30",
  },
  {
    id: "track-app-1",
    title: "탑소닉 초음파 싱크볼 입주민 단체 공구 (관리사무소 시공 승인 완료)",
    track: "APPROVED_GROUPBUY",
    author_role: "RESIDENT",
    author_name: "1408동 입주민 대표",
    apartment_name: "상계주공 14단지",
    category: "단지 공구",
    content: "주민 12세대 자발적 참여 및 관리사무소 무료 배관 시공 협의 완료! 세대당 35% 할인 단체 주문서가 활성화되었습니다.",
    petition_votes: 12,
    target_votes: 10,
    approval_status: "APPROVED",
    cera_report_attached: false,
    price_info: "단지 특판가 (35% OFF)",
    supplier: "(주)탑소닉 코리아",
    order_url: "https://topsonic.co.kr/b2b-apt",
    created_at: "어제",
  },
  {
    id: "track-pet-1",
    title: "아파트 미세먼지 차단 방충망 세대별 전면 시공 키트 공구 청원",
    track: "PETITION",
    author_role: "RESIDENT",
    author_name: "1412동 입주민",
    apartment_name: "상계주공 14단지",
    category: "주민 청원",
    content: "노후 방충망 일괄 교체 시공입니다. 10명 이상 모이면 제조사 본사 40% 공구가 및 무료 실측 방문이 적용됩니다.",
    petition_votes: 10,
    target_votes: 10,
    approval_status: "PENDING", // 10명 달성으로 승인 대기 상태!
    cera_report_attached: false,
    price_info: "공구가 45,000원",
    supplier: "현대나노 방충망",
    order_url: "https://form.naver.com/response/mesh2026",
    created_at: "2일 전",
  },
  {
    id: "track-pet-2",
    title: "McKare 비접촉 시니어 안심 모니터링 센서 독거어르신 케어 청원",
    track: "PETITION",
    author_role: "RESIDENT",
    author_name: "1403동 어르신회",
    apartment_name: "상계주공 14단지",
    category: "주민 청원",
    content: "사생활 침해 없는 비접촉 레이더 낙상 감지 센서입니다. 단지 어르신 10세대 공구 시 월 구독료 30% 할인이 적용됩니다.",
    petition_votes: 9,
    target_votes: 10,
    approval_status: "NONE", // 9명 (1명 더 모이면 승인 대기 전환!)
    cera_report_attached: false,
    price_info: "월 19,800원 입주민 특가",
    supplier: "맥케어 헬스케어",
    order_url: "https://mckare.co.kr/apt-senior",
    created_at: "3일 전",
  },
  {
    id: "track-spon-1",
    title: "2027 로컬 탁상달력 300부 한정판 입주민 직거래 특판",
    track: "SPONSORED",
    author_role: "PARTNER",
    author_name: "노원 로컬 프레스",
    apartment_name: "상계주공 14단지",
    category: "로컬 제휴",
    content: "노원·상계 사계절 일러스트 탁상달력. 관리사무소 대량 주문 시 단지명 무료 각인 지원.",
    petition_votes: 0,
    approval_status: "APPROVED",
    cera_report_attached: false,
    price_info: "직거래 9,900원",
    supplier: "노원 로컬 프레스",
    order_url: "https://form.naver.com/response/calendar2027",
    created_at: "4일 전",
  },
];

export default function PortalLiveDesk({
  apartmentName = "상계주공 14단지",
  isManager = true, // 기본값 관리소장/운영진 모드 활성화
}: PortalLiveDeskProps) {
  const [items, setItems] = useState<NoticeItem[]>(SEED_TRACK_NOTICES);
  const [filterTrack, setFilterTrack] = useState<NoticeTrackType | "ALL">("ALL");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isCreateNoticeModalOpen, setIsCreateNoticeModalOpen] = useState(false);

  // 승인 대기 중인 청원 항목 계산 (petition_votes >= 10 이면서 아직 미승인인 항목)
  const pendingItems = items.filter(
    (i) =>
      i.track === "PETITION" &&
      (i.approval_status === "PENDING" || i.petition_votes >= (i.target_votes || 10))
  );

  // 관리소장 원클릭 승인 처리
  const handleApprove = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            track: "APPROVED_GROUPBUY",
            approval_status: "APPROVED",
            created_at: "방금 승인됨",
          };
        }
        return item;
      })
    );
  };

  // 관리소장 반려/보류 처리
  const handleReject = (itemId: string, reason?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            approval_status: "REJECTED",
            rejection_reason: reason,
          };
        }
        return item;
      })
    );
  };

  // 신규 공식 공고 발행 처리
  const handleCreateNotice = (newNotice: NoticeItem) => {
    setItems((prev) => [newNotice, ...prev]);
  };

  // 필터링 적용
  const filteredItems = items.filter((item) => {
    if (filterTrack === "ALL") return true;
    return item.track === filterTrack;
  });

  return (
    <section className="w-full space-y-2.5">
      {/* 1. 관리소장 전용 승인 대기 알림 바 (10인 달성 건 실시간 카운트) */}
      {isManager && pendingItems.length > 0 && (
        <ManagerApprovalBar
          count={pendingItems.length}
          apartmentName={apartmentName}
          onClick={() => setIsApprovalModalOpen(true)}
        />
      )}

      {/* 2. 섹션 헤더 & 트랙 분기 바 */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs">
            🏢
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-medium text-slate-900 sm:text-sm">
                아파트 공고 4대 라이브 데스크
              </h2>
              <span className="text-[10px] text-slate-400 font-normal">
                ({apartmentName})
              </span>
            </div>
            <p className="text-[10.5px] font-normal text-slate-500">
              관리주체 직발행 · 주민 10인 청원 승인제 · 공식 단지 공구
            </p>
          </div>
        </div>

        {/* 관리주체 공식 공고 발행 버튼 */}
        <button
          type="button"
          onClick={() => setIsCreateNoticeModalOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer shadow-2xs"
          title="관리사무소/입대의 직발행 공식 공고 등록"
        >
          <Plus className="h-3 w-3" />
          <span>단지 공식 공고 발행</span>
        </button>
      </div>

      {/* 3. 4가지 트랙 필터 탭 (네이버 뉴스식 깔끔한 칩 버튼) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTrack("ALL")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
            filterTrack === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          전체 ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTrack("OFFICIAL")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            filterTrack === "OFFICIAL"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <span>🏢 관리사무소</span>
          <span>({items.filter((i) => i.track === "OFFICIAL").length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTrack("APPROVED_GROUPBUY")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            filterTrack === "APPROVED_GROUPBUY"
              ? "bg-emerald-600 text-white"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <span>✅ 승인 공구</span>
          <span>({items.filter((i) => i.track === "APPROVED_GROUPBUY").length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTrack("PETITION")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            filterTrack === "PETITION"
              ? "bg-amber-500 text-slate-950 font-medium"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <span>🙋 주민 청원</span>
          <span>({items.filter((i) => i.track === "PETITION").length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTrack("SPONSORED")}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
            filterTrack === "SPONSORED"
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>📢 Sponsored</span>
          <span>({items.filter((i) => i.track === "SPONSORED").length})</span>
        </button>
      </div>

      {/* 4. 피드 카드 리스트 */}
      <div className="rounded-xl border border-slate-100/80 bg-white overflow-hidden divide-y divide-slate-100/60">
        {filteredItems.map((notice) => (
          <FeedCard key={notice.id} item={notice} />
        ))}
      </div>

      {/* 5. 모달 연결 */}
      {/* 관리소장 승인 큐 모달 */}
      <ManagerApprovalQueueModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        pendingItems={pendingItems}
        onApprove={handleApprove}
        onReject={handleReject}
        apartmentName={apartmentName}
      />

      {/* 관리주체 공식 공고 발행 모달 */}
      <OfficialNoticeCreateModal
        isOpen={isCreateNoticeModalOpen}
        onClose={() => setIsCreateNoticeModalOpen(false)}
        onSubmitNotice={handleCreateNotice}
        apartmentName={apartmentName}
      />
    </section>
  );
}
