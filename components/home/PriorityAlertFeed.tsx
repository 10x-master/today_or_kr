"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Zap } from "lucide-react";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import { classifyAlertQueue, type AlertSourceItem } from "@/lib/diary/alertUtils";
import type { TodayNote } from "@/types/officialNotice";
import type { DiaryBrand, DiaryEvent } from "@/types/diary";

/**
 * T.노트 스마트 알림 큐 — 메인 피드 최상단 선제 알림.
 * ① 중요도(D-7) 항목을 골드 뱃지로, ② 당일 항목을 최신순으로 노출한다.
 * 표시할 항목이 없으면 아무것도 렌더링하지 않는다(조용히 숨김).
 */
export default function PriorityAlertFeed({ className = "" }: { className?: string }) {
  const [important, setImportant] = useState<ReturnType<typeof classifyAlertQueue>["important"]>([]);
  const [today, setToday] = useState<AlertSourceItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const user = await getCurrentAuthUser();
      const userId = user?.id || "user-001";

      const items: AlertSourceItem[] = [];

      // 1. 내 T.노트 (today_notes)
      try {
        const res = await fetch(`/api/today-notes?user_id=${encodeURIComponent(userId)}`);
        const data = await res.json();
        const notes: TodayNote[] = data.notes || [];
        for (const n of notes) {
          items.push({
            id: `note-${n.id}`,
            title: n.title,
            dateStr: n.due_date,
            isImportant: !!n.is_important,
            reminderDaysBefore: n.reminder_days_before ?? 7,
            targetAlertDate: n.target_alert_date || null,
            sortTimestamp: n.updated_at || n.created_at || null,
            href: "/workspace",
            sourceLabel: "T.노트",
          });
        }
      } catch {}

      // 2. 구독 중인 다이어리의 공식 행사 일정
      try {
        const subscribedIds: string[] = JSON.parse(localStorage.getItem("today_diary_subscriptions") || "[]");
        if (subscribedIds.length > 0) {
          const [providersRes, eventsRes] = await Promise.all([
            fetch("/api/t-diary/providers"),
            fetch(`/api/t-diary/events?diary_ids=${encodeURIComponent(subscribedIds.join(","))}`),
          ]);
          const providersData = await providersRes.json();
          const eventsData = await eventsRes.json();
          const brands: DiaryBrand[] = providersData.providers || [];
          const slugById: Record<string, string> = {};
          const nameById: Record<string, string> = {};
          brands.forEach((b) => {
            slugById[b.id] = b.brand_slug;
            nameById[b.id] = b.brand_name;
          });

          const events: DiaryEvent[] = eventsData.events || [];
          for (const e of events) {
            const slug = slugById[e.diary_id];
            items.push({
              id: `event-${e.id}`,
              title: e.title,
              dateStr: e.event_date,
              isImportant: !!e.is_important,
              reminderDaysBefore: e.reminder_days_before ?? 7,
              targetAlertDate: e.target_alert_date || null,
              sortTimestamp: e.event_date,
              href: slug ? `/t-diary?brand=${encodeURIComponent(slug)}` : "/t-diary",
              sourceLabel: nameById[e.diary_id] || "T.다이어리",
            });
          }
        }
      } catch {}

      if (!cancelled) {
        const { important: importantItems, today: todayItems } = classifyAlertQueue(items);
        setImportant(importantItems);
        setToday(todayItems);
        setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || (important.length === 0 && today.length === 0)) return null;

  return (
    <section aria-label="T.노트 스마트 알림 큐" className={`px-3 pt-3 space-y-1.5 bg-white ${className}`}>
      {important.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 hover:bg-amber-50 transition-colors"
        >
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
            <Star className="h-3 w-3 fill-amber-950" />
            D-{item.daysLeft}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{item.title}</p>
            <p className="truncate text-[10px] text-amber-700">⭐ 중요 알림 · {item.sourceLabel}</p>
          </div>
        </Link>
      ))}

      {today.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 px-3 py-2.5 hover:bg-blue-50 transition-colors"
        >
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
            <Zap className="h-3 w-3 fill-white" />
            오늘
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{item.title}</p>
            <p className="truncate text-[10px] text-blue-600">{item.sourceLabel}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
