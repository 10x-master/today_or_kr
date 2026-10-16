import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryProviders } from "@/lib/db/store";
import type { DiaryBrand } from "@/types/diary";

/**
 * t.다이어리 제공자 탐색 API — 승인완료(APPROVED)/조건부승인(CONDITIONAL) 제공자만 노출
 * GET /api/t-diary/providers?region=노원구&category=LOCAL_BIZ
 */
export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region");
  const category = request.nextUrl.searchParams.get("category") as DiaryBrand["provider_type"] | null;

  // 1. Supabase 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("diaries")
        .select("*")
        .in("approval_status", ["APPROVED", "CONDITIONAL"]);

      if (region) query = query.eq("region_code", region);
      if (category) query = query.eq("provider_type", category);

      const { data, error } = await query.order("brand_name", { ascending: true });
      if (!error && data) {
        return NextResponse.json({ providers: data as DiaryBrand[] });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary providers fetch error, falling back to mock store:", err);
  }

  // 2. 목(mock) 데이터 폴백
  const providers = getDiaryProviders({ region, category });
  return NextResponse.json({ providers });
}
