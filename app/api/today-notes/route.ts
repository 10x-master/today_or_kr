import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTodayNote, getTodayNotes } from "@/lib/db/store";
import { getGoogleClient, insertCalendarEvent } from "@/lib/calendar/googleCalendar";
import type { TodayNote } from "@/types/officialNotice";

/**
 * 티노트/티단노트(today_notes) 조회 및 생성 API
 * GET /api/today-notes?kapt_code=A113501050
 * POST /api/today-notes
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const hasKapt = searchParams.has("kapt_code");
  const rawKapt = searchParams.get("kapt_code");
  const kaptCode = hasKapt
    ? rawKapt === "null" || rawKapt === ""
      ? null
      : rawKapt
    : undefined;

  // 1. Supabase 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("today_notes")
        .select("*, linked_notice:local_official_notices(*)")
        .order("created_at", { ascending: false });

      if (kaptCode !== undefined) {
        if (kaptCode === null || kaptCode === "null") {
          query = query.is("linked_kapt_code", null);
        } else {
          query = query.eq("linked_kapt_code", kaptCode);
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({
          notes: data as TodayNote[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase today_notes query fallback to store:", err);
  }

  // 2. Mock store fallback
  const notes = getTodayNotes({
    kaptCode,
  });

  return NextResponse.json({
    notes,
    source: "mock",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      note_type = "SCHEDULE",
      due_date,
      scheduled_at,
      location,
      category = "WORK",
      is_todo = false,
      sync_status = "LOCAL",
      linked_notice_id,
      linked_kapt_code = null,
      user_id = "user-001",
      diary_event_id = null,
      image_urls = [],
      bookmark_urls = [],
      audio_duration = 0,
      record_date = null,
      t_sign_doc_id = null,
      sign_status = "NONE",
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const finalDueDate = due_date || (scheduled_at ? scheduled_at.slice(0, 10) : null);

    let createdNote: TodayNote | null = null;
    let source = "mock";

    // 1. Supabase 삽입 시도
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("today_notes")
          .insert({
            title,
            content,
            note_type,
            due_date: finalDueDate,
            scheduled_at: scheduled_at || null,
            location: location || null,
            category: category || "WORK",
            is_todo: Boolean(is_todo),
            sync_status: sync_status || "LOCAL",
            linked_notice_id: linked_notice_id || null,
            linked_kapt_code: linked_kapt_code || null,
            diary_event_id: diary_event_id || null,
            image_urls,
            bookmark_urls,
            audio_duration,
            record_date,
            t_sign_doc_id,
            sign_status,
          })
          .select()
          .single();

        if (!error && data) {
          createdNote = data as TodayNote;
          source = "supabase";
        }
      }
    } catch (err) {
      console.warn("Supabase insert fallback to mock store:", err);
    }

    // 2. Mock store fallback
    if (!createdNote) {
      createdNote = createTodayNote({
        title,
        content: content || "",
        note_type,
        due_date: finalDueDate,
        scheduled_at: scheduled_at || null,
        location: location || null,
        category: category || "WORK",
        is_todo: Boolean(is_todo),
        sync_status: sync_status || "LOCAL",
        linked_notice_id: linked_notice_id || null,
        linked_kapt_code: linked_kapt_code || null,
        diary_event_id: diary_event_id || null,
        image_urls,
        bookmark_urls,
        audio_duration,
        record_date,
        t_sign_doc_id,
        sign_status,
      });
      source = "mock";
    }

    // 3. 구글 캘린더 연동 유저라면 구글 캘린더 일정(Events.insert) 자동 동시 등록
    let calendarSynced = false;
    let calendarEvent = null;

    if (due_date) {
      try {
        const gClient = await getGoogleClient(user_id);
        if (gClient) {
          calendarEvent = await insertCalendarEvent(user_id, {
            summary: `[t.note] ${title}`,
            description: content || "",
            startDateTime: due_date,
            reminderMinutes: 30,
          });
          calendarSynced = true;
        }
      } catch (calErr) {
        console.warn("Auto Google Calendar sync warning:", calErr);
      }
    }

    return NextResponse.json({
      success: true,
      note: createdNote,
      calendar_synced: calendarSynced,
      calendar_event: calendarEvent,
      source,
    });
  } catch (err) {
    console.error("Failed to create today note:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

