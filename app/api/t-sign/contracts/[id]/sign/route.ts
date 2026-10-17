import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signTsignContract } from "@/lib/db/store";
import type { TsignContract } from "@/types/tsign";

/**
 * [✍️ 본인인증 원클릭 동의 체결] 카카오/네이버 간편인증 → 서명 완료 → 전자금고 보관.
 * 실제 카카오/네이버 인증 연동 전까지는 요청받은 identity_provider를 그대로
 * VERIFIED 처리하는 스켈레톤이며, 추후 실제 인증 SDK 콜백으로 교체한다.
 * POST /api/t-sign/contracts/[id]/sign { identity_provider: "KAKAO" | "NAVER", employee_phone? }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const identityProvider: "KAKAO" | "NAVER" = body.identity_provider === "NAVER" ? "NAVER" : "KAKAO";
  const employeePhone: string | undefined = body.employee_phone;

  const now = new Date().toISOString();

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("tsign_contracts")
        .update({
          status: "SIGNED",
          identity_verify_provider: identityProvider,
          identity_verify_status: "VERIFIED",
          employee_phone: employeePhone,
          employee_signed_at: now,
          vault_stored_at: now,
        })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ success: true, contract: data as TsignContract, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsign_contracts sign fallback to mock store:", err);
  }

  const contract = signTsignContract(id, { identityProvider, employeePhone });
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, contract, source: "mock" });
}
