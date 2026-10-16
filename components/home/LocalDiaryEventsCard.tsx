"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { toDateStr } from "@/lib/diary/dateUtils";
import type { DiaryBrand, DiaryEvent } from "@/types/diary";

const MEDIA_BADGE: Record<DiaryEvent["media_type"], string | null> = {
  NONE: null,
  YOUTUBE: "▶",
  IMAGE: "🖼",
  VOICE: "🎙",
};

interface FeedEvent extends DiaryEvent {
  brand_name: string;
}

/** 메인 로컬 피드 '우리 동네 소식' — 현재 동네 핀(구 단위)의 승인된 제공자 오늘/이번주 일정 */
export default function LocalDiaryEventsCard({
  regionDong,
  regionGugun,
}: {
  regionDong: string;
  regionGugun: string;
}) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regionGugun) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`/api/t-diary/providers?region=${encodeURIComponent(regionGugun)}`)
      .then((res) => res.json())
      .then(async (data) => {
        const providers: DiaryBrand[] = data.providers || [];
        if (!providers.length) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const ids = providers.map((p) => p.id).join(",");
        const evRes = await fetch(`/api/t-diary/events?diary_ids=${encodeURIComponent(ids)}`);
        const evData = await evRes.json();

        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 86400000);
        const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
        const weekLaterStr = toDateStr(weekLater.getFullYear(), weekLater.getMonth(), weekLater.getDate());

        const providerNameById: Record<string, string> = {};
        providers.forEach((p) => {
          providerNameById[p.id] = p.brand_name;
        });

        const upcoming: FeedEvent[] = (evData.events || [])
          .filter((e: DiaryEvent) => e.event_date >= todayStr && e.event_date <= weekLaterStr)
          .sort((a: DiaryEvent, b: DiaryEvent) => a.event_date.localeCompare(b.event_date))
          .slice(0, 4)
          .map((e: DiaryEvent) => ({ ...e, brand_name: providerNameById[e.diary_id] || "" }));

        setEvents(upcoming);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  }, [regionGugun]);

  if (loading || events.length === 0) return null;

  return (
    <div className="mx-3 mt-2.5 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
          {regionDong} 우리 동네 소식
        </h3>
        <Link href="/t-diary" className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
          전체보기 →
        </Link>
      </div>
      <div className="space-y-1.5">
        {events.map((e) => (
          <Link
            key={e.id}
            href="/t-diary"
            className="flex items-center gap-2 rounded-xl bg-slate-50/70 p-2 hover:bg-slate-100 transition-colors"
          >
            <span className="w-11 shrink-0 text-[10px] font-bold text-blue-600">{e.event_date.slice(5)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-800 truncate">{e.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{e.brand_name}</p>
            </div>
            {MEDIA_BADGE[e.media_type] && <span className="shrink-0 text-xs">{MEDIA_BADGE[e.media_type]}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
