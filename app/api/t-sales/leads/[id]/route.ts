import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTsalesActivity, getTsalesActivities, getTsalesLeadById, updateTsalesLead } from "@/lib/db/store";
import type { TsalesLead } from "@/types/tsales";

/**
 * t.세일즈 상세 패널 — 리드 단건 조회(+활동 로그) / 수정
 * GET   /api/t-sales/leads/[id]
 * PATCH /api/t-sales/leads/[id]
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: lead, error } = await supabase.from("tsales_leads").select("*").eq("id", id).maybeSingle();
      if (!error && lead) {
        const { data: activities } = await supabase
          .from("tsales_activity_logs")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false });
        return NextResponse.json({ lead: lead as TsalesLead, activities: activities || [], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsales_leads fetch fallback to mock store:", err);
  }

  const lead = getTsalesLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ lead, activities: getTsalesActivities(id), source: "mock" });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await request.json();
  const userId: string | undefined = patch.updated_by_user_id;
  const nextStatus: string | undefined = patch.status;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsales_leads").update(patch).eq("id", id).select().single();
      if (!error && data) {
        if (nextStatus) {
          await supabase.from("tsales_activity_logs").insert({
            lead_id: id,
            user_id: userId || null,
            activity_type: "STATUS_CHANGE",
            content: `상태가 ${nextStatus}로 변경되었습니다.`,
          });
        }
        return NextResponse.json({ success: true, lead: data as TsalesLead, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsales_leads update fallback to mock store:", err);
  }

  const lead = updateTsalesLead(id, patch);
  if (!lead) {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }
  if (nextStatus) {
    createTsalesActivity({
      lead_id: id,
      user_id: userId || null,
      activity_type: "STATUS_CHANGE",
      content: `상태가 ${nextStatus}로 변경되었습니다.`,
    });
  }
  return NextResponse.json({ success: true, lead, source: "mock" });
}
