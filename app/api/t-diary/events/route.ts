import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryEvent, getDiaryEventsByIds } from "@/lib/db/store";
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

/**
 * 선생님/관리자의 공개 대상(역할·학년) 지정 일정 등록
 * POST /api/t-diary/events  { diary_id, title, description, event_date, is_public, target_roles, target_grades, media_type, media_url, voice_url }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const diary_id = body?.diary_id as string | undefined;
  const title = String(body?.title || "").trim();
  const event_date = String(body?.event_date || "").trim();

  if (!diary_id || !title || !event_date) {
    return NextResponse.json({ error: "diary_id, title, event_date가 필요합니다." }, { status: 400 });
  }

  const payload = {
    diary_id,
    title,
    description: body?.description ? String(body.description).trim() : null,
    event_date,
    is_public: Boolean(body?.is_public),
    target_roles: Array.isArray(body?.target_roles) && body.target_roles.length ? body.target_roles : ["ALL"],
    target_grades: Array.isArray(body?.target_grades) && body.target_grades.length ? body.target_grades : ["ALL"],
    media_type: body?.media_type || "NONE",
    media_url: body?.media_url || null,
    voice_url: body?.voice_url || null,
  };

  // 1. 로컬 mock store 즉시 반영
  const mockEvent = createDiaryEvent(payload);

  // 2. Supabase 동기화 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_events")
        .insert({ ...payload, send_alimtalk: false })
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, event: data as DiaryEvent });
      }
    }
  } catch (err) {
    console.warn("Supabase diary event insert error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, event: mockEvent });
}
