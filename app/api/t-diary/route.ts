import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDiaryBrandBySlug,
  getDiaryEventsForMember,
  getDiaryMemberForUser,
  isDiaryEventVisibleToMember,
} from "@/lib/db/store";
import type { DiaryBrand, DiaryEvent, DiaryMember } from "@/types/diary";

/**
 * t.다이어리 브랜드 및 공식 행사 일정 조회 API
 * GET /api/t-diary?brand=donghwa-av&userId=user-001
 *
 * userId가 주어지고 해당 다이어리의 승인된 멤버(선생님/학부모/학생)인 경우,
 * 폐쇄형 커뮤니티 일정까지 역할·학년 타깃에 맞게 필터링되어 노출된다.
 * 비회원/미승인 멤버는 공개(is_public && target_roles 전체) 일정만 볼 수 있다.
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");
  const userId = request.nextUrl.searchParams.get("userId");

  if (!brandSlug) {
    return NextResponse.json({ brand: null, events: [], membership: null });
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

        let membership: DiaryMember | null = null;
        if (userId) {
          const { data: memberRow } = await supabase
            .from("diary_members")
            .select("*")
            .eq("diary_id", brand.id)
            .eq("user_id", userId)
            .maybeSingle();
          membership = (memberRow as DiaryMember) || null;
        }

        const visibleEvents = ((events || []) as DiaryEvent[]).filter((e) =>
          isDiaryEventVisibleToMember(e, membership)
        );

        return NextResponse.json({
          brand: brand as DiaryBrand,
          events: visibleEvents,
          membership,
        });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary fetch error, falling back to mock store:", err);
  }

  // 2. 목(mock) 데이터 폴백
  const brand = getDiaryBrandBySlug(brandSlug);
  const membership = brand && userId ? getDiaryMemberForUser(brand.id, userId) : null;
  const events = brand ? getDiaryEventsForMember(brand.id, membership) : [];
  return NextResponse.json({ brand, events, membership });
}
