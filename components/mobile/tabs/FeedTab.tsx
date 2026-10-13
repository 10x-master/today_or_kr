"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, HeartHandshake, Pin, Plus, Sparkles } from "lucide-react";
import ComposeModal from "@/components/mobile/ComposeModal";
import OfficialNoticeFactFeed from "@/components/mobile/OfficialNoticeFactFeed";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  FEED_CHANNEL_FILTERS,
  FEED_CHANNEL_TAB_LABELS,
  type FeedChannelFilter,
} from "@/lib/localPickCategory";
import { CIVIC_CATEGORY_COLUMN, CIVIC_COLUMN_TITLES } from "@/lib/civicCategory";
import { AUTHOR_ROLE_TEXT_CLASS } from "@/lib/authorRole";
import type { LocalPost, Region } from "@/types/local";
import type { CivicNotice } from "@/types/civic";

const SHORT_LINK_BANNER_INTERVAL = 5;

/** 배경 없이 테마 컬러 텍스트 + 연한 테두리로만 표현하는 등록 주체 라벨 */
function RoleBadge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span
      className={`rounded border border-current/30 px-1.5 py-0.5 text-[10px] font-bold ${colorClass}`}
    >
      {label}
    </span>
  );
}

function CivicRow({ notice }: { notice: CivicNotice }) {
  return (
    <article className="border-b border-slate-100 py-1.5 first:pt-0">
      <div className="flex items-center gap-1.5">
        <RoleBadge label={notice.department} colorClass={AUTHOR_ROLE_TEXT_CLASS.gov} />
        <span className="text-[10px] font-normal text-zinc-500">{notice.publishedAt}</span>
      </div>
      <h4 className="mt-1 line-clamp-2 text-[13px] font-normal leading-snug text-zinc-900">
        {notice.title}
      </h4>
      <a
        href={notice.originUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-[11px] font-normal text-sky-600 hover:underline"
      >
        원문 보기 ↗
      </a>
    </article>
  );
}

function CommunityRow({
  post,
  onReport,
  reporting,
}: {
  post: LocalPost;
  onReport: (id: string) => void;
  reporting: boolean;
}) {
  const isNotice = post.category === "notice";

  return (
    <article className="border-b border-slate-100 py-1.5 first:pt-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {post.author.badge && (
          <RoleBadge label={post.author.badge} colorClass={AUTHOR_ROLE_TEXT_CLASS[post.author.role]} />
        )}
        {post.noticePeriod && (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-normal text-rose-500">
            {post.noticePeriod}
          </span>
        )}
      </div>

      <h4
        className={`mt-1 flex items-center gap-1 truncate text-[13px] font-normal leading-snug ${
          isNotice ? "text-amber-600" : "text-zinc-900"
        }`}
      >
        {isNotice && <Pin className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />}
        <span className="truncate">{post.title}</span>
      </h4>
      <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-zinc-500">{post.content}</p>

      <div className="mt-1 flex items-center justify-between">
        <span className="truncate text-[11px] font-normal text-zinc-500">
          {formatRelativeTime(post.createdAt)} · 조회 {post.viewCount} · 👍 {post.likeCount} · 💬{" "}
          {post.commentCount}
        </span>
        <button
          type="button"
          onClick={() => onReport(post.id)}
          disabled={reporting}
          aria-label="신고"
          className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 text-[11px] font-normal text-zinc-500 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {post.reportCount > 0 && post.reportCount}
        </button>
      </div>
    </article>
  );
}

export default function FeedTab({
  region,
  onNavigateFunding,
}: {
  region: Region;
  onNavigateFunding?: () => void;
}) {
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [civicNotices, setCivicNotices] = useState<CivicNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [channel, setChannel] = useState<FeedChannelFilter>("all");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/feed?dong=${encodeURIComponent(region.dong)}`).then((res) => res.json()),
      fetch(`/api/civic?dong=${encodeURIComponent(region.dong)}`).then((res) => res.json()),
    ])
      .then(([feedData, civicData]: [{ posts: LocalPost[] }, { notices: CivicNotice[] }]) => {
        if (cancelled) return;
        setPosts(feedData.posts);
        setCivicNotices(civicData.notices);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("피드를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [region.dong]);

  async function handleReport(postId: string) {
    setReportingId(postId);
    try {
      const res = await fetch(`/api/feed/${postId}/report`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;

      const updated: LocalPost = data.post;
      if (updated.isBlinded) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      } else {
        setPosts((prev) => prev.map((post) => (post.id === postId ? updated : post)));
      }
    } finally {
      setReportingId(null);
    }
  }

  const filteredPosts = posts.filter((post) => channel === "all" || post.category === channel);

  // 전체 보기에서는 공지(notice)를 상단에 고정 노출 (작성 순서는 그대로 유지하는 안정 정렬)
  const sortedPosts =
    channel === "all"
      ? [...filteredPosts].sort((a, b) => {
          const aPinned = a.category === "notice" ? 0 : 1;
          const bPinned = b.category === "notice" ? 0 : 1;
          return aPinned - bPinned;
        })
      : filteredPosts;

  function renderShortLinkBanner(index: number) {
    const isTipBanner = Math.floor(index / SHORT_LINK_BANNER_INTERVAL) % 2 === 0;

    if (isTipBanner) {
      return (
        <button
          type="button"
          onClick={() => setChannel("tip")}
          className="flex w-full items-center gap-2 border-b border-slate-100 bg-amber-50/60 px-1 py-2 text-left text-[11px] text-amber-700"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">[30초 꿀팁] 요즘 이웃들이 많이 묻는 생활 꿀팁 모아보기</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onNavigateFunding?.()}
        className="flex w-full items-center gap-2 border-b border-slate-100 bg-rose-50/60 px-1 py-2 text-left text-[11px] text-rose-600"
      >
        <HeartHandshake className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">[착한소비 펀딩 리포트] 우리동네 상생 나눔 현황 보러가기</span>
      </button>
    );
  }

  const column1Notices = civicNotices.filter((n) => CIVIC_CATEGORY_COLUMN[n.category] === 1);
  const column2Notices = civicNotices.filter((n) => CIVIC_CATEGORY_COLUMN[n.category] === 2);
  const column3Notices = civicNotices.filter((n) => CIVIC_CATEGORY_COLUMN[n.category] === 3);

  function renderCommunityList() {
    return (
      <>
        {sortedPosts.map((post, index) => (
          <Fragment key={post.id}>
            <CommunityRow post={post} onReport={handleReport} reporting={reportingId === post.id} />
            {(index + 1) % SHORT_LINK_BANNER_INTERVAL === 0 && renderShortLinkBanner(index)}
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6">
      {loading && <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>}
      {error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* 공식 행정 고시 & 로컬 인프라/재개발 팩트 피드 */}
          <OfficialNoticeFactFeed
            districtCode={region.code}
            dongName={`${region.gugun} ${region.dong}`}
          />

          {/* PC/태블릿: 3열 신문형 그리드 */}
          <div className="hidden md:grid md:grid-cols-3 md:gap-6">
            <section>
              <h3 className="mb-1 text-sm font-bold text-zinc-900">{CIVIC_COLUMN_TITLES[1]}</h3>
              <div className="flex flex-col">
                {column1Notices.map((notice) => (
                  <CivicRow key={notice.id} notice={notice} />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-bold text-zinc-900">{CIVIC_COLUMN_TITLES[2]}</h3>
              <div className="flex flex-col">
                {column2Notices.map((notice) => (
                  <CivicRow key={notice.id} notice={notice} />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-bold text-zinc-900">{CIVIC_COLUMN_TITLES[3]}</h3>
              <div className="flex flex-col">
                {column3Notices.map((notice) => (
                  <CivicRow key={notice.id} notice={notice} />
                ))}
                {renderCommunityList()}
              </div>
            </section>
          </div>

          {/* 모바일: 1열 컴팩트 카드 */}
          <div className="md:hidden">
            {civicNotices.length > 0 && (
              <section className="mb-4">
                <h3 className="mb-1 text-sm font-bold text-zinc-900">🏛️ 오늘의 공식 소식</h3>
                <div className="flex flex-col">
                  {civicNotices.slice(0, 6).map((notice) => (
                    <CivicRow key={notice.id} notice={notice} />
                  ))}
                </div>
              </section>
            )}

            <div className="flex gap-2 overflow-x-auto pb-3">
              {FEED_CHANNEL_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChannel(item)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    channel === item
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {FEED_CHANNEL_TAB_LABELS[item]}
                </button>
              ))}
            </div>

            {sortedPosts.length === 0 && (
              <p className="py-10 text-center text-sm text-zinc-400">
                아직 {region.dong}에 등록된 글이 없어요.
              </p>
            )}

            <div className="flex flex-col">{renderCommunityList()}</div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        aria-label="소식 등록하기"
        className="fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-amber-400 text-zinc-900 shadow-lg transition-colors hover:bg-amber-300 sm:right-6"
      >
        <Plus className="h-6 w-6" />
      </button>

      {composeOpen && (
        <ComposeModal
          region={region}
          onClose={() => setComposeOpen(false)}
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
        />
      )}
    </div>
  );
}
