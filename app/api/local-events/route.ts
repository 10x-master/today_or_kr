import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocalComplexEvents } from "@/lib/db/store";
import type { LocalComplexEvent } from "@/types/officialNotice";

/**
 * 로컬 단지 제휴 이벤트 목록 조회 API
 * GET /api/local-events?district_code=1135010500
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const districtCode = searchParams.get("district_code") ?? undefined;

  // 1. Supabase 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("local_complex_events")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (districtCode) {
        query = query.like("district_code", `${districtCode.slice(0, 5)}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          events: data as LocalComplexEvent[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase local_complex_events query fallback:", err);
  }

  // 2. Mock store fallback
  const events = getLocalComplexEvents(districtCode);

  return NextResponse.json({
    events,
    source: "mock",
  });
}
