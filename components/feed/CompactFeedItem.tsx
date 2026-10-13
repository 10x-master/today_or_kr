"use client";

import { useEffect, useState } from "react";
import { Eye, MessageSquare, Star, ThumbsUp } from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";
import type { LocalCafePlace, LocalPost } from "@/types/local";
import type { LocalComplexEvent } from "@/types/officialNotice";
import { formatRelativeTime } from "@/lib/db/mockSeed";

export interface CompactFeedItemProps {
  notice?: LocalOfficialNotice;
  cafe?: LocalCafePlace;
  event?: LocalComplexEvent;
  post?: LocalPost;
  onClick: () => void;
  isBookmarked?: boolean;
}

export default function CompactFeedItem({
  notice,
  cafe,
  event,
  post,
  onClick,
  isBookmarked = false,
}: CompactFeedItemProps) {
  const [relativeTime, setRelativeTime] = useState<string>("방금 전");

  useEffect(() => {
    if (post?.createdAt) {
      setRelativeTime(formatRelativeTime(post.createdAt));
    }
  }, [post?.createdAt]);

  // =========================================================================
  // 1. 블라인드형 커뮤니티 포스트 (LocalPost - 인플루언서 수배 / 수익 인증 / 잡담 / 번개)
  // =========================================================================
  if (post) {
    const isNotice = post.category === "notice";
    const isFlash = post.category === "flash";
    const isMeetup = post.category === "meetup";

    const categoryBadge = isNotice
      ? { label: "📢 공지", bg: "bg-rose-50 text-rose-700 border-rose-200" }
      : isFlash
      ? { label: "⚡ 번개", bg: "bg-amber-50 text-amber-700 border-amber-200" }
      : isMeetup
      ? { label: "🤝 모임", bg: "bg-blue-50 text-blue-700 border-blue-200" }
      : { label: "💬 이웃톡", bg: "bg-slate-100 text-slate-700 border-slate-200" };

    return (
      <article
        onClick={onClick}
        className="group relative w-full border-b border-slate-100 bg-white px-3.5 py-2.5 transition-colors hover:bg-slate-50/70 active:bg-slate-100/70 cursor-pointer select-none"
      >
        <div className="w-full">
          {/* 상단 1행: 카테고리 뱃지 + 작성자/동네 + 상대 시간 */}
          <div className="flex items-center gap-1.5 mb-1 text-[11px] flex-wrap">
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium border ${categoryBadge.bg}`}
            >
              <span>{categoryBadge.label}</span>
            </span>
            <span className="font-medium text-slate-700">{post.author.name}</span>
            {post.author.badge && (
              <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-normal text-slate-500">
                {post.author.badge}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">{post.region.dong}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 font-normal">{relativeTime}</span>
          </div>

          {/* 메인 제목: 우측 이미지 없이 텍스트 100% 할당 */}
          <h3 className="w-full text-[13.5px] font-medium text-slate-900 group-hover:text-amber-950 leading-snug break-words">
            {post.title}
          </h3>

          {/* 본문 미리보기: 고밀도 2줄 말줄임 */}
          {post.content && (
            <p className="mt-0.5 w-full text-xs text-slate-600 line-clamp-2 leading-relaxed break-words font-normal">
              {post.content}
            </p>
          )}

          {/* 하단 메타 바: 조회수 · 공감 · 댓글 */}
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:text-slate-600">
                <Eye className="h-3 w-3" />
                <span>{post.viewCount.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-rose-600">
                <ThumbsUp className="h-3 w-3" />
                <span>{post.likeCount}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-blue-600">
                <MessageSquare className="h-3 w-3" />
                <span>{post.commentCount}</span>
              </span>
            </div>

            {isBookmarked && (
              <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700 border border-amber-200">
                t.note 보관됨
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 2. 동네 카페인 경우 (우측 이미지 박스 제거, 텍스트 100% 할당)
  // =========================================================================
  if (cafe) {
    return (
      <article
        onClick={onClick}
        className="group relative w-full border-b border-slate-100 bg-white px-3.5 py-2.5 transition-colors hover:bg-amber-50/30 active:bg-slate-100/70 cursor-pointer select-none"
      >
        <div className="w-full">
          {/* 상단 뱃지 & 위치 */}
          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.2 font-medium text-amber-800 border border-amber-200/80">
              <span>☕</span>
              <span>동네카페</span>
            </span>
            <span className="font-normal text-slate-600">{cafe.dong}</span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-0.5 font-medium text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              <span>{cafe.rating.toFixed(1)}</span>
            </span>
            {cafe.discount_benefit && (
              <span className="ml-auto font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 text-[10px]">
                🎁 {cafe.discount_benefit}
              </span>
            )}
          </div>

          {/* 메인 상호명 100% 폭 */}
          <h3 className="w-full text-[13.5px] font-medium text-slate-900 group-hover:text-amber-950 leading-snug break-words">
            {cafe.name}
          </h3>

          {/* 대표 메뉴 및 주소 */}
          <div className="mt-0.5 flex items-center justify-between text-xs text-slate-500 font-normal">
            <span className="truncate text-slate-600 text-[11px]">
              시그니처: {cafe.signature_menu}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
              {cafe.address}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 3. 단지 제휴 이벤트인 경우 (우측 이미지 박스 제거, 텍스트 100% 할당)
  // =========================================================================
  if (event) {
    return (
      <article
        onClick={onClick}
        className="group relative w-full border-b border-emerald-100/60 bg-emerald-50/20 px-3.5 py-2.5 transition-colors hover:bg-emerald-50/40 active:bg-emerald-100/40 cursor-pointer select-none"
      >
        <div className="w-full">
          <div className="flex items-center gap-1.5 mb-1 text-[11px]">
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100/80 px-1.5 py-0.2 font-medium text-emerald-800 border border-emerald-200">
              <span>🧾</span>
              <span>단지제휴</span>
            </span>
            <span className="font-normal text-slate-600">{event.provider_name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 font-normal">{event.complex_name}</span>
          </div>

          <h3 className="w-full text-[13.5px] font-medium text-slate-900 group-hover:text-emerald-950 leading-snug break-words">
            {event.title}
          </h3>

          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="font-medium text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
              {event.badge_label || event.benefit_summary}
            </span>
            <span className="text-slate-400 text-[10px] font-normal">
              잔여 {event.remaining_count || 10}건
            </span>
          </div>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 4. 기본 공식 행정 고시 (우측 엠블럼 박스 제거, 텍스트 100% 할당)
  // =========================================================================
  if (!notice) return null;

  const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
    label: notice.category,
    icon: "📌",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badgeText: "text-slate-700",
  };

  const formattedDate = notice.publish_date ? notice.publish_date.replace(/-/g, ".") : "";

  return (
    <article
      onClick={onClick}
      className="group relative w-full border-b border-slate-100 bg-white px-3.5 py-2.5 transition-colors hover:bg-slate-50/70 active:bg-slate-100/70 cursor-pointer select-none"
    >
      <div className="w-full">
        {/* 상단 1행: 트랙 뱃지 4종 + K-apt CERA 적정가 검증 + 카테고리 미니 배지 + 발행처 + 대상 권역 */}
        <div className="flex items-center gap-1.5 mb-1 text-[11px] flex-wrap">
          {notice.track && (
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium border text-[10px] ${
                notice.track === "OFFICIAL"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : notice.track === "APPROVED_GROUPBUY"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : notice.track === "PETITION"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span>
                {notice.track === "OFFICIAL"
                  ? "🏢 관리사무소 공식"
                  : notice.track === "APPROVED_GROUPBUY"
                  ? "✅ 주민 승인 공구"
                  : notice.track === "PETITION"
                  ? `🙋 주민 청원 중 (${notice.petition_votes ?? 0}/10명)`
                  : "📢 Sponsored"}
              </span>
            </span>
          )}

          {notice.cera_report_attached && (
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
              <span>🛡️ CERA 검증</span>
            </span>
          )}

          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium border ${meta.badgeBg}`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
          <span className="font-medium text-slate-700">
            {notice.issuing_agency}
          </span>
          {notice.impact_zone && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 font-normal">
                {notice.impact_zone}
              </span>
            </>
          )}
        </div>

        {/* 메인 제목: 우측 엠블럼 없이 100% 너비 확보 */}
        <h3 className="w-full text-[13.5px] font-medium text-slate-900 group-hover:text-amber-950 leading-snug break-words">
          {notice.title}
        </h3>

        {/* 요약 또는 팩트 프리뷰 */}
        {notice.summary_1 && (
          <p className="mt-0.5 w-full text-xs text-slate-600 line-clamp-1 leading-relaxed font-normal">
            • {notice.summary_1}
          </p>
        )}

        {/* 하단 캡션: 날짜 · 조회수 · 북마크 뱃지 */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2.5 font-normal">
            <span>{formattedDate}</span>
            {notice.view_count !== undefined && (
              <span className="flex items-center gap-0.5 text-slate-400">
                <Eye className="h-3 w-3" />
                <span>{notice.view_count.toLocaleString()}</span>
              </span>
            )}
          </div>
          {isBookmarked && (
            <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-medium text-amber-700 border border-amber-200">
              t.note 담김
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
