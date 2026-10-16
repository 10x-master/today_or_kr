import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createOrUpdateDiaryMembership,
  getDiaryMemberForUser,
  getDiaryMembersByDiaryId,
  getDiaryMembersForUser,
  updateDiaryMemberStatus,
} from "@/lib/db/store";
import type { DiaryMember, DiaryMemberRole, DiaryMemberStatus } from "@/types/diary";

const VALID_ROLES: DiaryMemberRole[] = ["OWNER", "TEACHER", "PARENT", "STUDENT"];
const VALID_STATUSES: DiaryMemberStatus[] = ["APPROVED", "PENDING"];

/**
 * t.다이어리 폐쇄형 커뮤니티 멤버십 조회 API
 * GET /api/t-diary/members?diary_id=xxx            → 해당 다이어리의 전체 구성원 (선생님 승인 패널용)
 * GET /api/t-diary/members?diary_id=xxx&userId=yyy  → 해당 다이어리에서 특정 유저의 멤버십 단건
 * GET /api/t-diary/members?userId=yyy               → 유저가 속한 전체 커뮤니티 멤버십 목록
 */
export async function GET(request: NextRequest) {
  const diaryId = request.nextUrl.searchParams.get("diary_id");
  const userId = request.nextUrl.searchParams.get("userId");

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      if (diaryId && userId) {
        const { data, error } = await supabase
          .from("diary_members")
          .select("*")
          .eq("diary_id", diaryId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!error) return NextResponse.json({ member: (data as DiaryMember) || null });
      } else if (diaryId) {
        const { data, error } = await supabase.from("diary_members").select("*").eq("diary_id", diaryId);
        if (!error && data) return NextResponse.json({ members: data as DiaryMember[] });
      } else if (userId) {
        const { data, error } = await supabase.from("diary_members").select("*").eq("user_id", userId);
        if (!error && data) return NextResponse.json({ members: data as DiaryMember[] });
      }
    }
  } catch (err) {
    console.warn("Supabase diary members fetch error, falling back to mock store:", err);
  }

  if (diaryId && userId) {
    return NextResponse.json({ member: getDiaryMemberForUser(diaryId, userId) });
  }
  if (diaryId) {
    return NextResponse.json({ members: getDiaryMembersByDiaryId(diaryId) });
  }
  if (userId) {
    return NextResponse.json({ members: getDiaryMembersForUser(userId) });
  }
  return NextResponse.json({ members: [] });
}

/**
 * 커뮤니티 가입 신청 — 항상 status='PENDING'으로 생성 (선생님 승인 필요)
 * POST /api/t-diary/members  { diary_id, user_id, role, grade_tags }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const diary_id = body?.diary_id as string | undefined;
  const user_id = body?.user_id as string | undefined;
  const role: DiaryMemberRole = VALID_ROLES.includes(body?.role) ? body.role : "PARENT";
  const grade_tags: string[] = Array.isArray(body?.grade_tags) && body.grade_tags.length ? body.grade_tags : ["ALL"];

  if (!diary_id || !user_id) {
    return NextResponse.json({ error: "diary_id와 user_id가 필요합니다." }, { status: 400 });
  }

  // 1. 로컬 mock store 즉시 반영
  const mockMember = createOrUpdateDiaryMembership({ diary_id, user_id, role, grade_tags });

  // 2. Supabase 동기화 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_members")
        .upsert(
          { diary_id, user_id, role, grade_tags, status: "PENDING" },
          { onConflict: "diary_id,user_id", ignoreDuplicates: true }
        )
        .select()
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, member: data as DiaryMember });
      }
    }
  } catch (err) {
    console.warn("Supabase diary member join error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, member: mockMember });
}

/**
 * 선생님/관리자의 가입 승인 처리
 * PATCH /api/t-diary/members  { id, status }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as DiaryMemberStatus | undefined;

  if (!id || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "id와 유효한 status가 필요합니다." }, { status: 400 });
  }

  const mockUpdated = updateDiaryMemberStatus(id, status);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_members")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, member: data as DiaryMember });
      }
    }
  } catch (err) {
    console.warn("Supabase diary member status update error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "해당 멤버를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, member: mockUpdated });
}
