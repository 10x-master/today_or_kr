import { NextRequest, NextResponse } from "next/server";

/**
 * 관리자 타깃 CRM — 필터링된 구성원 대상 카카오 알림톡 일괄 발송 (데모 시뮬레이션)
 * POST /api/t-diary/crm/alimtalk  { diary_id, member_ids, message }
 *
 * 실제 카카오 알림톡 발신 프로필/템플릿 연동은 되어 있지 않으며,
 * 데모 환경에서는 발송 대상 수만 집계해 성공 응답으로 돌려준다.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const memberIds = Array.isArray(body?.member_ids) ? body.member_ids : [];
  const message = String(body?.message || "").trim();

  if (!memberIds.length || !message) {
    return NextResponse.json({ error: "member_ids와 message가 필요합니다." }, { status: 400 });
  }

  console.log(`[mock alimtalk] ${memberIds.length}명에게 발송: "${message}"`);

  return NextResponse.json({
    success: true,
    sent_count: memberIds.length,
  });
}
