import { NextRequest, NextResponse } from "next/server";
import { getGoogleClient, insertCalendarEvent } from "@/lib/calendar/googleCalendar";

/**
 * 구글 캘린더 일정 등록 API
 * POST /api/calendar/events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = "user-001",
      summary,
      description,
      startDateTime,
      endDateTime,
      reminderMinutes = 30,
      location,
    } = body;

    if (!summary || !startDateTime) {
      return NextResponse.json(
        { error: "summary and startDateTime are required" },
        { status: 400 }
      );
    }

    const client = await getGoogleClient(userId);
    if (!client) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      );
    }

    const result = await insertCalendarEvent(userId, {
      summary,
      description,
      startDateTime,
      endDateTime,
      reminderMinutes,
      location,
    });

    return NextResponse.json({
      success: true,
      event: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to insert calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
