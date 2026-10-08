import { NextRequest, NextResponse } from "next/server";
import { getCivicNotices } from "@/lib/db/store";

/** 지자체 공식 고시공고/새소식 조회 (GET /api/civic?dong=) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dong = searchParams.get("dong") ?? undefined;

  const notices = getCivicNotices({ dong });
  return NextResponse.json({ notices });
}
