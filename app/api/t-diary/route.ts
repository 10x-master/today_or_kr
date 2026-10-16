import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryBrandBySlug, getDiaryEvents } from "@/lib/db/store";
import type { DiaryBrand, DiaryEvent } from "@/types/diary";

/**
 * t.다이어리 브랜드 및 공식 행사 일정 조회 API
 * GET /api/t-diary?brand=donghwa-av
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");

  if (!brandSlug) {
    return NextResponse.json({ brand: null, events: [] });
  }

  // 1. Supabase 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: brand } = await supabase
        .from("diaries")
        .select("*")
        .eq("brand_slug", brandSlug)
        .maybeSingle();

      if (brand) {
        const { data: events } = await supabase
          .from("diary_events")
          .select("*")
          .eq("diary_id", brand.id)
          .order("event_date", { ascending: true });

        return NextResponse.json({
          brand: brand as DiaryBrand,
          events: (events || []) as DiaryEvent[],
        });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary fetch error, falling back to mock store:", err);
  }

  // 2. 목(mock) 데이터 폴백
  const brand = getDiaryBrandBySlug(brandSlug);
  const events = getDiaryEvents(brand?.id);
  return NextResponse.json({ brand, events });
}
