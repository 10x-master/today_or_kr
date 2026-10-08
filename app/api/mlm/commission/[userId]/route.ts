import { NextRequest, NextResponse } from "next/server";
import { getCommissionDashboard } from "@/lib/db/store";

/** 10X 추천 조직도 및 수당 대시보드 조회 (GET /api/mlm/commission/[userId]) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const dashboard = getCommissionDashboard(userId);

  if (!dashboard) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(dashboard);
}
