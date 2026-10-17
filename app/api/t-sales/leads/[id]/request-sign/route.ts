import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTsalesActivity, createTsignContract, getTsalesLeadById, updateTsalesLead } from "@/lib/db/store";
import type { TsalesLead } from "@/types/tsales";
import type { TsignContract, TsignContractType } from "@/types/tsign";

/**
 * t.세일즈 → t.싸인 연동: 리드를 전자계약 DRAFT로 즉시 발행해 비대면 체결 요청을 보낸다.
 * tsign_contracts에 생성된 계약서 id를 리드에 역참조로 저장(tsign_contract_id)하고,
 * SIGN_REQUESTED 활동 로그를 남긴다.
 * POST /api/t-sales/leads/[id]/request-sign { employer_name?, contract_type?, requested_by_user_id? }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const employerName: string = body.employer_name || "투데이 영업 파트너";
  const contractType: TsignContractType = body.contract_type || "B2B_SUPPLY";
  const requestedByUserId: string | null = body.requested_by_user_id || null;

  let lead: TsalesLead | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsales_leads").select("*").eq("id", id).maybeSingle();
      if (!error && data) lead = data as TsalesLead;
    }
  } catch (err) {
    console.warn("Supabase tsales_leads fetch (request-sign) fallback to mock store:", err);
  }
  if (!lead) lead = getTsalesLeadById(id);

  if (!lead) {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!lead.contact_phone) {
    return NextResponse.json(
      { error: "전자계약을 요청하려면 리드에 연락처(contact_phone)가 먼저 등록되어 있어야 합니다." },
      { status: 400 }
    );
  }

  const items =
    lead.proposal_items && lead.proposal_items.length > 0
      ? lead.proposal_items
      : [{ name: "제안 상품/서비스", qty: 1, unitPriceKrw: lead.estimated_deal_value_krw || 0 }];

  const sha256Hash = createHash("sha256")
    .update(JSON.stringify({ leadId: lead.id, employerName, items, ts: Date.now() }))
    .digest("hex");

  const contractPayload = {
    tenant_id: lead.tenant_id ?? null,
    workforce_id: null,
    created_by_user_id: requestedByUserId || lead.created_by_user_id || "user-001",
    contract_type: contractType,
    title: `${lead.business_name} 공급계약서`,
    employer_name: employerName,
    employer_sign_svg: null,
    employer_signed_at: null,
    employee_name: lead.business_name,
    employee_phone: lead.contact_phone,
    employee_sign_svg: null,
    employee_signed_at: null,
    contract_body: { items, estimated_deal_value_krw: lead.estimated_deal_value_krw ?? null },
    contract_pdf_url: null,
    sha256_hash: sha256Hash,
    effective_start_date: new Date().toISOString().slice(0, 10),
    effective_end_date: null,
    source_audio_url: null,
    ai_parsed_fields: {},
    identity_verify_provider: "NONE" as const,
  };

  let contract: TsignContract | null = null;
  let source: "supabase" | "mock" = "mock";
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("tsign_contracts")
        .insert({ ...contractPayload, status: "DRAFT" })
        .select()
        .single();
      if (!error && data) {
        contract = data as TsignContract;
        source = "supabase";
      }
    }
  } catch (err) {
    console.warn("Supabase tsign_contracts insert (from tsales) fallback to mock store:", err);
  }
  if (!contract) {
    contract = createTsignContract(contractPayload);
    source = "mock";
  }

  const signRequestedNote = `전자계약 DRAFT가 생성되어 ${lead.contact_phone}로 체결 요청을 보냈습니다.`;
  let updatedLead: TsalesLead = { ...lead, tsign_contract_id: contract.id };

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("tsales_leads")
        .update({ tsign_contract_id: contract.id })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) updatedLead = data as TsalesLead;

      await supabase.from("tsales_activity_logs").insert({
        lead_id: id,
        user_id: requestedByUserId,
        activity_type: "SIGN_REQUESTED",
        content: signRequestedNote,
      });
    } else {
      updatedLead = updateTsalesLead(id, { tsign_contract_id: contract.id }) || updatedLead;
      createTsalesActivity({
        lead_id: id,
        user_id: requestedByUserId,
        activity_type: "SIGN_REQUESTED",
        content: signRequestedNote,
      });
    }
  } catch (err) {
    console.warn("Supabase tsales_leads/activity update (request-sign) fallback to mock store:", err);
    updatedLead = updateTsalesLead(id, { tsign_contract_id: contract.id }) || updatedLead;
    createTsalesActivity({
      lead_id: id,
      user_id: requestedByUserId,
      activity_type: "SIGN_REQUESTED",
      content: signRequestedNote,
    });
  }

  return NextResponse.json({ success: true, lead: updatedLead, contract, source });
}
