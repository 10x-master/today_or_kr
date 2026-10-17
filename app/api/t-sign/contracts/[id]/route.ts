import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTsignContractById, updateTsignContract } from "@/lib/db/store";
import type { TsignContract } from "@/types/tsign";

/**
 * t.싸인(tsign_contracts) 단건 조회
 * GET /api/t-sign/contracts/[id]
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsign_contracts").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return NextResponse.json({ contract: data as TsignContract, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsign_contracts fetch fallback to mock store:", err);
  }

  const contract = getTsignContractById(id);
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ contract, source: "mock" });
}

/**
 * t.싸인(tsign_contracts) 수정 — 발송 상태 전환(DRAFT → SENT) 등
 * PATCH /api/t-sign/contracts/[id]
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await request.json();

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsign_contracts").update(patch).eq("id", id).select().single();
      if (!error && data) {
        return NextResponse.json({ success: true, contract: data as TsignContract, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsign_contracts update fallback to mock store:", err);
  }

  const contract = updateTsignContract(id, patch);
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, contract, source: "mock" });
}
