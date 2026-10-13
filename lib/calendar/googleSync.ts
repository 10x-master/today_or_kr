import type { GoogleCalendarEventInput, GoogleCalendarEventResult } from "@/types/calendar";
import type { ParsedNoteData, SyncStatus } from "@/types/note";
import type { TodayNote } from "@/types/officialNotice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 1. 구글 캘린더 이벤트 동기화 페이로드 구성
 * - 시작 10분 전 브라우저/캘린더 팝업 알림 기본 활성화 (reminderMinutes: 10)
 */
export function buildGoogleCalendarPayload(
  parsed: ParsedNoteData,
  extraDescription?: string
): GoogleCalendarEventInput | null {
  if (!parsed.scheduled_at) return null;

  const startDate = new Date(parsed.scheduled_at);
  // 종료 시간은 기본 1시간 뒤로 설정
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const categoryLabels: Record<string, string> = {
    WORK: "업무/회의",
    PLACE: "장소/방문",
    PERSON: "미팅/만남",
    TRAVEL: "출장/이동",
  };

  const descLines = [
    `[t.note 로컬 워크OS 자동 동기화 일정]`,
    `분류: ${categoryLabels[parsed.category] || "일반"}`,
  ];
  if (parsed.location) {
    descLines.push(`장소: ${parsed.location}`);
  }
  if (parsed.is_todo) {
    descLines.push(`상태: 필수 할 일(To-do)`);
  }
  if (extraDescription) {
    descLines.push(`\n메모:\n${extraDescription}`);
  }

  return {
    summary: parsed.title,
    description: descLines.join("\n"),
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    location: parsed.location || undefined,
    reminderMinutes: parsed.reminder_minutes ?? 10, // 10분 전 알림 기본 활성화
  };
}

/**
 * 2. 클라이언트 사이드 구글 캘린더 실시간 이벤트 동기화
 */
export async function syncScheduleToGoogleCalendar(
  payload: GoogleCalendarEventInput
): Promise<{
  success: boolean;
  sync_status: SyncStatus;
  eventResult?: GoogleCalendarEventResult;
  error?: string;
}> {
  try {
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        sync_status: "SYNCED",
        eventResult: data.event,
      };
    }

    return {
      success: false,
      sync_status: "LOCAL",
      error: data.error || "구글 캘린더 연동 실패 (로컬 일정으로 보존)",
    };
  } catch (err: any) {
    return {
      success: false,
      sync_status: "LOCAL",
      error: err?.message || "네트워크 오류로 캘린더 동기화 실패",
    };
  }
}

/**
 * 3. 티노트(today_notes) 저장 및 구글 캘린더 자동 동기화 통합 헬퍼
 */
export async function saveNoteWithCalendarSync(params: {
  userId?: string | null;
  parsed: ParsedNoteData;
  content?: string;
  kaptCode?: string | null;
}): Promise<{
  note: TodayNote;
  sync_status: SyncStatus;
  calendarLink?: string;
}> {
  const { userId, parsed, content = "", kaptCode } = params;

  let sync_status: SyncStatus = "LOCAL";
  let calendarLink: string | undefined = undefined;

  // scheduled_at이 지정된 경우 구글 캘린더 동기화 시도
  if (parsed.scheduled_at) {
    const calendarPayload = buildGoogleCalendarPayload(parsed, content);
    if (calendarPayload) {
      const syncRes = await syncScheduleToGoogleCalendar(calendarPayload);
      sync_status = syncRes.sync_status;
      if (syncRes.eventResult?.htmlLink) {
        calendarLink = syncRes.eventResult.htmlLink;
      }
    }
  }

  const notePayload: Partial<TodayNote> = {
    user_id: userId || null,
    title: parsed.title,
    content: content || parsed.raw_text,
    note_type: parsed.is_todo ? "TASK" : parsed.scheduled_at ? "SCHEDULE" : "MEMO",
    due_date: parsed.scheduled_at ? parsed.scheduled_at.slice(0, 10) : null,
    scheduled_at: parsed.scheduled_at,
    location: parsed.location,
    category: parsed.category,
    is_todo: parsed.is_todo,
    sync_status,
    linked_kapt_code: kaptCode || null,
  };

  // Supabase 원격 DB 저장 시도
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("today_notes")
        .insert(notePayload)
        .select()
        .single();

      if (!error && data) {
        return {
          note: data as TodayNote,
          sync_status,
          calendarLink,
        };
      }
    }
  } catch (err) {
    console.warn("Supabase direct insert error for today_notes:", err);
  }

  // API Route 또는 로컬 스토리지 안전 저장 폴백
  const fallbackNote: TodayNote = {
    id: `note-${Date.now()}`,
    user_id: userId || "guest",
    title: parsed.title,
    content: content || parsed.raw_text,
    note_type: parsed.is_todo ? "TASK" : parsed.scheduled_at ? "SCHEDULE" : "MEMO",
    due_date: parsed.scheduled_at ? parsed.scheduled_at.slice(0, 10) : null,
    scheduled_at: parsed.scheduled_at,
    location: parsed.location,
    category: parsed.category,
    is_todo: parsed.is_todo,
    sync_status,
    linked_notice_id: null,
    linked_kapt_code: kaptCode || null,
    created_at: new Date().toISOString(),
  };

  try {
    await fetch("/api/today-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallbackNote),
    });
  } catch {}

  return {
    note: fallbackNote,
    sync_status,
    calendarLink,
  };
}
