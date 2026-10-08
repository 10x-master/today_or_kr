import { NextRequest, NextResponse } from "next/server";
import { distributeCommission } from "@/lib/db/store";

interface DistributeBody {
  userId?: unknown;
  contractAmount?: unknown;
  contractType?: unknown;
}

/** 10X 연계 10단계 각 2% 수당 자동 배분 트리거 (POST /api/mlm/commission/distribute) */
export async function POST(request: NextRequest) {
  let body: DistributeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { userId, contractAmount, contractType } = body;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    return NextResponse.json({ error: "userId는 필수입니다." }, { status: 400 });
  }
  if (typeof contractAmount !== "number" || contractAmount <= 0) {
    return NextResponse.json(
      { error: "contractAmount는 양수여야 합니다." },
      { status: 400 }
    );
  }
  if (typeof contractType !== "string" || contractType.trim().length === 0) {
    return NextResponse.json({ error: "contractType은 필수입니다." }, { status: 400 });
  }

  const result = distributeCommission({ userId, contractAmount, contractType });
  if (!result) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ distributions: result.entries }, { status: 201 });
}
