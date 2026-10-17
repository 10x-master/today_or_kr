import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTsignContract, getTsignContracts } from "@/lib/db/store";
import type { TsignContract, TsignContractType } from "@/types/tsign";

const VALID_CONTRACT_TYPES: TsignContractType[] = [
  "LABOR_STANDARD",
  "LABOR_PART_TIME",
  "CLINIC_CONSENT",
  "SECURITY_PLEDGE",
  "NDA",
  "B2B_SUPPLY",
  "OUTSOURCING",
];

// 현장 음성 녹음/통화 파일을 data URL로 받아 그대로 저장한다 (tnote_cards의 photo_url과 동일한 방식).
// DB 행이 과도하게 커지지 않도록 용량을 제한한다.
const MAX_AUDIO_DATA_URL_LENGTH = 2_000_000;
// MediaRecorder가 만드는 "data:audio/webm;codecs=opus;base64,..." 같은 부가 파라미터도 허용한다.
const AUDIO_DATA_URL_PATTERN = /^data:audio\/[a-z0-9.+-]+(;[-\w=]+)*;base64,[A-Za-z0-9+/]+=*$/i;

/**
 * t.싸인(tsign_contracts) — 음성 조판 전자계약 전자보관함 조회/초안 생성
 * GET  /api/t-sign/contracts?user_id=user-001
 * POST /api/t-sign/contracts  (AI 파싱 결과 확정 후 DRAFT 계약서 생성)
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id") || undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("tsign_contracts").select("*").order("created_at", { ascending: false });
      if (userId) query = query.eq("created_by_user_id", userId);
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ contracts: data as TsignContract[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsign_contracts query fallback to mock store:", err);
  }

  const contracts = getTsignContracts({ userId });
  return NextResponse.json({ contracts, source: "mock" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      created_by_user_id = "user-001",
      tenant_id = null,
      workforce_id = null,
      contract_type,
      title,
      employer_name,
      employee_name,
      employee_phone,
      contract_body = {},
      ai_parsed_fields = {},
      source_audio_url = null,
      effective_start_date,
      effective_end_date = null,
    } = body;

    if (!VALID_CONTRACT_TYPES.includes(contract_type)) {
      return NextResponse.json(
        { error: `contract_type은 ${VALID_CONTRACT_TYPES.join(", ")} 중 하나여야 합니다.` },
        { status: 400 }
      );
    }
    if (!title || !employer_name || !employee_name || !employee_phone) {
      return NextResponse.json(
        { error: "title, employer_name, employee_name, employee_phone은 필수입니다." },
        { status: 400 }
      );
    }
    if (
      source_audio_url &&
      (typeof source_audio_url !== "string" ||
        source_audio_url.length > MAX_AUDIO_DATA_URL_LENGTH ||
        !AUDIO_DATA_URL_PATTERN.test(source_audio_url))
    ) {
      return NextResponse.json(
        { error: "음성 파일 형식이 올바르지 않거나 용량이 너무 큽니다." },
        { status: 400 }
      );
    }

    const resolvedStartDate = effective_start_date || new Date().toISOString().slice(0, 10);
    const sha256Hash = createHash("sha256")
      .update(JSON.stringify({ title, employer_name, employee_name, contract_body, ts: Date.now() }))
      .digest("hex");

    const payload = {
      tenant_id,
      workforce_id,
      created_by_user_id,
      contract_type: contract_type as TsignContractType,
      title,
      employer_name,
      employer_sign_svg: null,
      employer_signed_at: null,
      employee_name,
      employee_phone,
      employee_sign_svg: null,
      employee_signed_at: null,
      contract_body,
      contract_pdf_url: null,
      sha256_hash: sha256Hash,
      effective_start_date: resolvedStartDate,
      effective_end_date,
      source_audio_url,
      ai_parsed_fields,
      identity_verify_provider: "NONE" as const,
    };

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("tsign_contracts")
          .insert({ ...payload, status: "DRAFT" })
          .select()
          .single();
        if (!error && data) {
          return NextResponse.json({ success: true, contract: data as TsignContract, source: "supabase" });
        }
      }
    } catch (err) {
      console.warn("Supabase tsign_contracts insert fallback to mock store:", err);
    }

    const contract = createTsignContract(payload);
    return NextResponse.json({ success: true, contract, source: "mock" });
  } catch (err) {
    console.error("Failed to create tsign contract:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
