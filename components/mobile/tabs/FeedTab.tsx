"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, HeartHandshake, Pin, Plus, Sparkles } from "lucide-react";
import ComposeModal from "@/components/mobile/ComposeModal";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  FEED_CHANNEL_FILTERS,
  FEED_CHANNEL_TAB_LABELS,
  type FeedChannelFilter,
} from "@/lib/localPickCategory";
import type { LocalPost, Region } from "@/types/local";

const SHORT_LINK_BANNER_INTERVAL = 5;

export default function FeedTab({
  region,
  onNavigateFunding,
}: {
  region: Region;
  onNavigateFunding?: () => void;
}) {
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [channel, setChannel] = useState<FeedChannelFilter>("all");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/feed?dong=${encodeURIComponent(region.dong)}`)
      .then((res) => res.json())
      .then((data: { posts: LocalPost[] }) => {
        if (cancelled) return;
        setPosts(data.posts);
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

  return (
    <div className="flex flex-col px-4 py-4 sm:px-6">
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

      {loading && <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>}
      {error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}

      {!loading && !error && sortedPosts.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-400">
          아직 {region.dong}에 등록된 글이 없어요.
        </p>
      )}

      <div className="flex flex-col">
        {sortedPosts.map((post, index) => {
          const isNotice = post.category === "notice";
          return (
            <Fragment key={post.id}>
              <article className="border-b border-slate-100 py-2.5 first:pt-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {post.author.badge && (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {post.author.badge}
                    </span>
                  )}
                  {post.noticePeriod && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                      {post.noticePeriod}
                    </span>
                  )}
                </div>

                <h4
                  className={`mt-1 flex items-center gap-1 truncate text-sm font-bold ${
                    isNotice ? "text-amber-600" : "text-zinc-900"
                  }`}
                >
                  {isNotice && <Pin className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />}
                  <span className="truncate">{post.title}</span>
                </h4>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {post.content}
                </p>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="truncate text-[11px] text-zinc-400">
                    {formatRelativeTime(post.createdAt)} · 조회 {post.viewCount} · 👍{" "}
                    {post.likeCount} · 💬 {post.commentCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReport(post.id)}
                    disabled={reportingId === post.id}
                    aria-label="신고"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {post.reportCount > 0 && post.reportCount}
                  </button>
                </div>
              </article>

              {(index + 1) % SHORT_LINK_BANNER_INTERVAL === 0 && renderShortLinkBanner(index)}
            </Fragment>
          );
        })}

        <div className="sticky bottom-20 z-30 flex justify-end pr-1 pt-2">
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            aria-label="소식 등록하기"
            className="flex h-13 w-13 items-center justify-center rounded-full bg-amber-400 text-zinc-900 shadow-lg transition-colors hover:bg-amber-300"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

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
