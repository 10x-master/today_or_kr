import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryEventsByIds } from "@/lib/db/store";
import type { DiaryEvent } from "@/types/diary";

/**
 * 구독 중인 복수 제공자(diary_id)의 공식 행사 일정 조회 API
 * GET /api/t-diary/events?diary_ids=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("diary_ids") || "";
  const diaryIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!diaryIds.length) {
    return NextResponse.json({ events: [] });
  }

  // 1. Supabase 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_events")
        .select("*")
        .in("diary_id", diaryIds)
        .eq("is_public", true)
        .order("event_date", { ascending: true });

      if (!error && data) {
        return NextResponse.json({ events: data as DiaryEvent[] });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary events fetch error, falling back to mock store:", err);
  }

  // 2. 목(mock) 데이터 폴백
  const events = getDiaryEventsByIds(diaryIds);
  return NextResponse.json({ events });
}
