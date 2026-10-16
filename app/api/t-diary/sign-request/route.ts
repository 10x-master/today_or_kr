import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestDiaryEventSign } from "@/lib/db/store";
import type { DiaryEvent } from "@/types/diary";

/**
 * [✍️ t.sign] 상황별 전자계약/동의서 카카오톡 발송 요청 (데모: 실제 알림톡 발송 대신 상태만 전이)
 * POST /api/t-diary/sign-request  { event_id, doc_type, recipient_ids }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const eventId = body?.event_id as string | undefined;

  if (!eventId) {
    return NextResponse.json({ error: "event_id가 필요합니다." }, { status: 400 });
  }

  const mockUpdated = requestDiaryEventSign(eventId);
  const signDocId = mockUpdated?.t_sign_doc_id || `sign-doc-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_events")
        .update({ t_sign_doc_id: signDocId, sign_status: "REQUESTED" })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, event: data as DiaryEvent, recipients: body?.recipient_ids?.length || 0 });
      }
    }
  } catch (err) {
    console.warn("Supabase sign-request update error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "해당 일정을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, event: mockUpdated, recipients: body?.recipient_ids?.length || 0 });
}
