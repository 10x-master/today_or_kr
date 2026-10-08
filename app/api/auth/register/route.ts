import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/db/store";

interface RegisterBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  kakaoId?: unknown;
  registeredDong?: unknown;
  referrerCode?: unknown;
  age?: unknown;
  consents?: {
    terms?: unknown;
    thirdPartyFinancialLead?: unknown;
  };
}

/** 카카오 간편 가입 및 10단계 추천인 트리 연결 (POST /api/auth/register) */
export async function POST(request: NextRequest) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { name, phone, email, kakaoId, registeredDong, referrerCode, age, consents } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name은 필수입니다." }, { status: 400 });
  }
  if (typeof phone !== "string" || phone.trim().length === 0) {
    return NextResponse.json({ error: "phone은 필수입니다." }, { status: 400 });
  }
  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json({ error: "email은 필수입니다." }, { status: 400 });
  }
  if (typeof kakaoId !== "string" || kakaoId.trim().length === 0) {
    return NextResponse.json({ error: "kakaoId는 필수입니다." }, { status: 400 });
  }
  if (typeof registeredDong !== "string" || registeredDong.trim().length === 0) {
    return NextResponse.json({ error: "registeredDong은 필수입니다." }, { status: 400 });
  }
  if (referrerCode !== undefined && typeof referrerCode !== "string") {
    return NextResponse.json(
      { error: "referrerCode는 문자열이어야 합니다." },
      { status: 400 }
    );
  }
  if (age !== undefined && typeof age !== "number") {
    return NextResponse.json({ error: "age는 숫자여야 합니다." }, { status: 400 });
  }
  if (
    !consents ||
    typeof consents.terms !== "boolean" ||
    typeof consents.thirdPartyFinancialLead !== "boolean"
  ) {
    return NextResponse.json(
      { error: "consents.terms, consents.thirdPartyFinancialLead는 필수입니다." },
      { status: 400 }
    );
  }
  if (!consents.terms) {
    return NextResponse.json({ error: "이용약관에 동의해야 합니다." }, { status: 400 });
  }
  if (!consents.thirdPartyFinancialLead) {
    return NextResponse.json(
      {
        error:
          "보험/자동차/부동산/결혼정보/정책자금 5대 맞춤 혜택 제공 동의가 필요합니다.",
      },
      { status: 400 }
    );
  }

  const user = registerUser({
    name,
    phone,
    email,
    kakaoId,
    registeredDong,
    referrerCode: typeof referrerCode === "string" ? referrerCode : undefined,
    age,
    consents: {
      terms: consents.terms,
      thirdPartyFinancialLead: consents.thirdPartyFinancialLead,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
