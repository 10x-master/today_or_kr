import { NextResponse } from "next/server";
import { getCompletedDonationReports } from "@/lib/db/store";

/** 투명 설치 인증 리포트 조회 (GET /api/commerce/funding/reports) */
export async function GET() {
  const reports = getCompletedDonationReports();
  return NextResponse.json({ reports });
}
