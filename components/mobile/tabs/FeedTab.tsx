"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, HeartHandshake, ImageOff, MessageCircle, Plus } from "lucide-react";
import ComposeModal from "@/components/mobile/ComposeModal";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  CATEGORY_TO_FILTER_GROUP,
  FEED_FILTER_GROUPS,
  FEED_FILTER_GROUP_LABELS,
  LOCAL_PICK_CATEGORY_LABELS,
  type FeedFilterGroup,
} from "@/lib/localPickCategory";
import type { LocalPost, Region } from "@/types/local";
import type { DonationCampaign } from "@/types/commerce";

const SOURCE_CHANNEL_LABELS: Record<LocalPost["sourceChannel"], string> = {
  kakao_channel: "카톡 제보",
  mobile_web: "웹 등록",
  official_gov: "지자체 공공",
};

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

function FeedImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
        <ImageOff className="h-5 w-5 text-zinc-300" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="h-16 w-16 shrink-0 rounded-xl object-cover"
    />
  );
}

export default function FeedTab({ region }: { region: Region }) {
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<FeedFilterGroup>("all");
  const [campaign, setCampaign] = useState<(DonationCampaign & { achievementRate: number }) | null>(
    null
  );

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

  useEffect(() => {
    let cancelled = false;

    fetch("/api/commerce/funding")
      .then((res) => res.json())
      .then((data: { campaigns: Array<DonationCampaign & { achievementRate: number }> }) => {
        if (cancelled) return;
        const matched = data.campaigns.find((c) => c.targetRegion.includes(region.dong));
        setCampaign(matched ?? null);
      })
      .catch(() => {
        if (!cancelled) setCampaign(null);
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

  const filteredPosts = posts.filter(
    (post) => filterGroup === "all" || CATEGORY_TO_FILTER_GROUP[post.category] === filterGroup
  );

  const sharingNoticeCard = campaign && (
    <div className="flex items-center gap-2 rounded-xl bg-zinc-100/70 px-3.5 py-2 text-[11px] text-zinc-500">
      <HeartHandshake className="h-3.5 w-3.5 shrink-0 text-rose-400" />
      <span className="truncate">
        우리동네 상생 나눔 알림 · {campaign.title} {Math.round(campaign.achievementRate * 100)}%
        달성 ({won(campaign.currentAmount)} 적립)
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-300">
            <MessageCircle className="h-4.5 w-4.5 text-zinc-900" />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-900">
              카톡으로 1초 만에 우리동네 제보하기
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-600">
              카카오톡 채널 &apos;투데이픽&apos;을 추가하고 사진과 함께 메시지를 보내면
              가입 절차 없이 바로 피드에 등록돼요.
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {FEED_FILTER_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setFilterGroup(group)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filterGroup === group
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {FEED_FILTER_GROUP_LABELS[group]}
          </button>
        ))}
      </div>

      {loading && <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>}
      {error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}

      {!loading && !error && filteredPosts.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-400">
          아직 {region.dong}에 등록된 소식이 없어요.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {filteredPosts.length < 2 && sharingNoticeCard}

        {filteredPosts.map((post, index) => (
          <Fragment key={post.id}>
            <article className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
              <FeedImage src={post.images[0]} alt={post.title} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {post.author.badge && (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {post.author.badge}
                    </span>
                  )}
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                    {LOCAL_PICK_CATEGORY_LABELS[post.category]}
                  </span>
                  {post.noticePeriod && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
                      {post.noticePeriod}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-400">
                    {SOURCE_CHANNEL_LABELS[post.sourceChannel]}
                  </span>
                </div>
                <h4 className="mt-1 truncate text-sm font-bold text-zinc-900">{post.title}</h4>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {post.content}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {formatRelativeTime(post.createdAt)} · 조회 {post.viewCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReport(post.id)}
                    disabled={reportingId === post.id}
                    aria-label="신고"
                    className="flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    신고 {post.reportCount > 0 && `(${post.reportCount})`}
                  </button>
                </div>
              </div>
            </article>

            {index === 1 && sharingNoticeCard}
          </Fragment>
        ))}

        <div className="sticky bottom-20 z-30 flex justify-end pr-1">
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
