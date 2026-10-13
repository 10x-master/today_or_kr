import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOfficialNotices } from "@/lib/db/store";
import type { LocalOfficialNotice } from "@/types/officialNotice";

/**
 * 공식 행정 고시 및 로컬 인프라/재개발 팩트 피드 조회
 * GET /api/official-notices?district_code=1135010500&category=REDEVELOP&role=RESIDENT
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const districtCode = searchParams.get("district_code") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const role = searchParams.get("role") ?? undefined;

  // 1. Supabase 원격 DB 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("local_official_notices")
        .select("*")
        .order("publish_date", { ascending: false });

      if (districtCode) {
        if (districtCode.length === 10) {
          query = query.or(
            `district_code.eq.${districtCode},district_code.like.${districtCode.slice(0, 5)}%`
          );
        } else {
          query = query.like("district_code", `${districtCode}%`);
        }
      }

      if (category && category !== "ALL") {
        query = query.eq("category", category);
      }

      if (role && role !== "ALL") {
        query = query.contains("target_roles", [role]);
      }

      const { data, error } = await query;

      if (!error && data) {
        // 만약 role 필터로 Supabase contains가 지원되거나 빈 배열이라도 정상 쿼리 반환
        return NextResponse.json({
          notices: data as LocalOfficialNotice[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase query fallback to mock store:", err);
  }

  // 2. Supabase 테이블이 아직 없거나 에러 시 로컬 목업 시드 데이터로 graceful fallback
  const notices = getOfficialNotices({
    districtCode,
    category,
    role,
  });

  return NextResponse.json({
    notices,
    source: "mock",
  });
}
