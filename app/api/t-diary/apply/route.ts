import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryApplication } from "@/lib/db/store";
import type { DiaryBrand, DiaryProviderType } from "@/types/diary";

const VALID_PROVIDER_TYPES: DiaryProviderType[] = ["ENTERPRISE", "LOCAL_BIZ", "PUBLIC", "CREATOR"];

/**
 * t.다이어리 제공자 등록 신청 API — 항상 approval_status='PENDING'으로 생성
 * POST /api/t-diary/apply
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const brand_name = String(body.brand_name || "").trim();
  const contact_info = String(body.contact_info || "").trim();
  const region_code = String(body.region_code || "").trim();
  const provider_type: DiaryProviderType = VALID_PROVIDER_TYPES.includes(body.provider_type)
    ? body.provider_type
    : "LOCAL_BIZ";
  const business_reg_no = body.business_reg_no ? String(body.business_reg_no).trim() : null;
  const intro = body.intro ? String(body.intro).trim() : null;
  const youtube_channel = body.youtube_channel ? String(body.youtube_channel).trim() : null;
  const website_url = body.website_url ? String(body.website_url).trim() : null;

  if (!brand_name || !contact_info || !region_code) {
    return NextResponse.json(
      { error: "상호명, 담당자 연락처, 활동 지역은 필수 입력 항목입니다." },
      { status: 400 }
    );
  }

  // 1. 로컬 mock store 즉시 반영 (Supabase 미설정/실패 시에도 100% 정상 동작 보장)
  const mockBrand = createDiaryApplication({
    brand_name,
    contact_info,
    region_code,
    provider_type,
    business_reg_no,
    intro,
    youtube_channel,
    website_url,
  });

  // 2. Supabase 동기화 시도 (성공 시 실제 DB 레코드를 우선 반환)
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diaries")
        .insert({
          brand_slug: mockBrand.brand_slug,
          brand_name,
          contact_info,
          approval_status: "PENDING",
          provider_type,
          region_code,
          youtube_channel,
          business_reg_no,
          intro,
          website_url,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, brand: data as DiaryBrand });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary apply insert error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, brand: mockBrand });
}
