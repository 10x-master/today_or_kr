import { NextRequest, NextResponse } from "next/server";
import { getFinancialLeadCandidates } from "@/lib/db/store";

/** 5대 업종 전문직 제휴 리드 동의 완료 회원 추출 (GET /api/admin/leads?dong=&minAge=&maxAge=) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const registeredDong = searchParams.get("dong") ?? undefined;
  const minAgeParam = searchParams.get("minAge");
  const maxAgeParam = searchParams.get("maxAge");

  const minAge = minAgeParam !== null ? Number(minAgeParam) : undefined;
  const maxAge = maxAgeParam !== null ? Number(maxAgeParam) : undefined;

  if (minAge !== undefined && Number.isNaN(minAge)) {
    return NextResponse.json({ error: "minAge는 숫자여야 합니다." }, { status: 400 });
  }
  if (maxAge !== undefined && Number.isNaN(maxAge)) {
    return NextResponse.json({ error: "maxAge는 숫자여야 합니다." }, { status: 400 });
  }

  const leads = getFinancialLeadCandidates({ registeredDong, minAge, maxAge });
  return NextResponse.json({ leads });
}
