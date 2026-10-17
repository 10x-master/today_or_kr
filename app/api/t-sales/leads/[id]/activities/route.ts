import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTsalesActivity, getTsalesActivities } from "@/lib/db/store";
import type { TsalesActivityLog, TsalesActivityType } from "@/types/tsales";

const VALID_ACTIVITY_TYPES: TsalesActivityType[] = [
  "CALL",
  "VISIT",
  "NOTE",
  "STATUS_CHANGE",
  "PROPOSAL_SENT",
  "SIGN_REQUESTED",
];

/**
 * t.세일즈 리드별 영업 활동 로그(전화/방문/메모 등)
 * GET  /api/t-sales/leads/[id]/activities
 * POST /api/t-sales/leads/[id]/activities
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("tsales_activity_logs")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return NextResponse.json({ activities: data as TsalesActivityLog[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsales_activity_logs query fallback to mock store:", err);
  }

  return NextResponse.json({ activities: getTsalesActivities(id), source: "mock" });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { activity_type, content = null, user_id = null } = body;

  if (!VALID_ACTIVITY_TYPES.includes(activity_type)) {
    return NextResponse.json(
      { error: `activity_type은 ${VALID_ACTIVITY_TYPES.join(", ")} 중 하나여야 합니다.` },
      { status: 400 }
    );
  }

  const payload = { lead_id: id, user_id, activity_type: activity_type as TsalesActivityType, content };

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsales_activity_logs").insert(payload).select().single();
      if (!error && data) {
        return NextResponse.json({ success: true, activity: data as TsalesActivityLog, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsales_activity_logs insert fallback to mock store:", err);
  }

  const activity = createTsalesActivity(payload);
  return NextResponse.json({ success: true, activity, source: "mock" });
}
