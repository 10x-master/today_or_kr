"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  Users,
  Megaphone,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Flame,
  FileText,
} from "lucide-react";
import type { NoticeItem, NoticeTrackType } from "@/types/officialNotice";
import { NOTICE_TRACK_META } from "@/types/officialNotice";
import GroupBuyVoteButton from "@/components/commerce/GroupBuyVoteButton";

export interface FeedCardProps {
  item: NoticeItem;
  onClick?: () => void;
  showVoteButton?: boolean;
}

export default function FeedCard({
  item,
  onClick,
  showVoteButton = true,
}: FeedCardProps) {
  const meta = NOTICE_TRACK_META[item.track] || NOTICE_TRACK_META.OFFICIAL;

  return (
    <article
      onClick={onClick}
      className="group relative w-full border-b border-slate-100 bg-white p-3.5 transition-colors hover:bg-slate-50/70 select-none cursor-pointer"
    >
      <div className="w-full space-y-2">
        {/* 상단 라인: 트랙 뱃지 4종 + K-apt CERA 적정가 검증 배지 + 작성자/아파트 */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          {/* 1) 트랙 뱃지 (관리사무소 공식 / 주민 승인 공구 / 주민 청원 중 / Sponsored) */}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium border text-[10.5px] ${meta.badgeClass}`}
          >
            <span>{meta.icon}</span>
            <span>
              {item.track === "PETITION"
                ? `주민 청원 중 (${item.petition_votes}/10명)`
                : meta.label}
            </span>
          </span>

          {/* 2) CERA 적정가 검증 뱃지 */}
          {item.cera_report_attached && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200/80">
              <ShieldCheck className="h-3 w-3 text-indigo-600" />
              <span>특허 CERA 적정가 검증</span>
            </span>
          )}

          {/* 3) 카테고리 태그 */}
          {item.category && (
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded">
              {item.category}
            </span>
          )}

          {/* 4) 작성자 및 아파트 */}
          <span className="text-[10px] text-slate-400 font-normal ml-auto">
            {item.apartment_name || "상계주공 14단지"}
          </span>
        </div>

        {/* 메인 타이틀 */}
        <div>
          <h3 className="text-[13.5px] font-medium text-slate-900 group-hover:text-amber-950 leading-snug break-words">
            {item.title}
          </h3>
          {item.content && (
            <p className="mt-1 text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
              {item.content}
            </p>
          )}
        </div>

        {/* 부가 메타 정보: 가격/공급처 등 */}
        {(item.price_info || item.supplier) && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
            {item.price_info && (
              <span className="font-medium text-slate-800">
                특판가: {item.price_info}
              </span>
            )}
            {item.supplier && (
              <span className="text-slate-400">
                제조/공급: {item.supplier}
              </span>
            )}
          </div>
        )}

        {/* 청원 투표 게이지 (PETITION 트랙일 경우) */}
        {item.track === "PETITION" && showVoteButton && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <GroupBuyVoteButton
              itemId={item.id}
              itemTitle={item.title}
              initialCount={item.petition_votes}
              targetCount={item.target_votes || 10}
              apartmentName={item.apartment_name || "상계주공 14단지"}
              orderFormUrl={item.order_url}
            />
          </div>
        )}

        {/* 승인 완료 공구 (APPROVED_GROUPBUY)일 경우 바로가기 */}
        {item.track === "APPROVED_GROUPBUY" && item.order_url && (
          <div className="pt-1 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
            <span className="text-[11px] text-emerald-700 font-normal flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>관리사무소 직권 승인 완료 · 특판 주문 가능</span>
            </span>
            <a
              href={item.order_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-medium text-white transition-colors"
            >
              <span>단체 주문서</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* 하단 메타바 */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px] text-slate-400 font-normal">
          <div className="flex items-center gap-2">
            <span>발행: {item.author_name || "관리주체/입주민"}</span>
            {item.created_at && <span>· {item.created_at}</span>}
          </div>
          <span className="flex items-center gap-0.5 text-slate-400 group-hover:text-slate-600 transition-colors">
            상세 보기 <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
