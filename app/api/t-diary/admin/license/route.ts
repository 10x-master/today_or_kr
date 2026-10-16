import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateDiaryLicense } from "@/lib/db/store";
import type { DiaryBrand, DiaryLicenseStatus, DiaryPlan } from "@/types/diary";

const VALID_STATUSES: DiaryLicenseStatus[] = ["ACTIVE", "GRACE_PERIOD", "EXPIRED", "SUSPENDED"];
const VALID_PLANS: DiaryPlan[] = ["BUNDLE", "PRO", "ENTERPRISE"];

/**
 * 관리자 CRM — 라이선스(플랜/만료일/최대 회원수/상태) 즉시 연장·수정
 * PATCH /api/t-diary/admin/license  { diary_id, plan?, valid_until?, max_members?, license_status? }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const diary_id = body?.diary_id as string | undefined;
  if (!diary_id) {
    return NextResponse.json({ error: "diary_id가 필요합니다." }, { status: 400 });
  }

  const patch: {
    plan?: DiaryPlan;
    valid_until?: string | null;
    max_members?: number;
    license_status?: DiaryLicenseStatus;
  } = {};

  if (body.plan !== undefined && VALID_PLANS.includes(body.plan)) patch.plan = body.plan;
  if (body.valid_until !== undefined) patch.valid_until = body.valid_until;
  if (body.max_members !== undefined) patch.max_members = Number(body.max_members);
  if (body.license_status !== undefined && VALID_STATUSES.includes(body.license_status)) {
    patch.license_status = body.license_status;
  }

  const mockUpdated = updateDiaryLicense(diary_id, patch);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diaries")
        .update(patch)
        .eq("id", diary_id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, brand: data as DiaryBrand });
      }
    }
  } catch (err) {
    console.warn("Supabase diary license update error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "해당 다이어리를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, brand: mockUpdated });
}
