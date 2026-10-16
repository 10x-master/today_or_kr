import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllDiaryProviders, updateDiaryApprovalStatus } from "@/lib/db/store";
import type { DiaryApprovalStatus, DiaryBrand } from "@/types/diary";

const VALID_STATUSES: DiaryApprovalStatus[] = ["APPROVED", "PENDING", "CONDITIONAL", "REJECTED"];

/**
 * 관리자 심사 대시보드 — 전체 제공자 조회 (승인 상태 무관)
 * GET /api/t-diary/admin/providers
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ providers: data as DiaryBrand[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase admin providers fetch error, falling back to mock store:", err);
  }

  return NextResponse.json({ providers: getAllDiaryProviders(), source: "mock" });
}

/**
 * 관리자 심사 — 승인(APPROVED)/조건부승인(CONDITIONAL)/반려(REJECTED) 원클릭 전환
 * PATCH /api/t-diary/admin/providers  { id, approval_status }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const approval_status = body?.approval_status as DiaryApprovalStatus | undefined;

  if (!id || !approval_status || !VALID_STATUSES.includes(approval_status)) {
    return NextResponse.json({ error: "id와 유효한 approval_status가 필요합니다." }, { status: 400 });
  }

  // 1. 로컬 mock store 동기화 (항상 수행)
  const mockUpdated = updateDiaryApprovalStatus(id, approval_status);

  // 2. Supabase 동기화 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diaries")
        .update({ approval_status })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, brand: data as DiaryBrand });
      }
    }
  } catch (err) {
    console.warn("Supabase admin providers update error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "해당 제공자를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, brand: mockUpdated });
}
