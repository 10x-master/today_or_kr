import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTsalesLead, getTsalesLeads } from "@/lib/db/store";
import type { TsalesLead, TsalesLeadStatus } from "@/types/tsales";

const VALID_STATUSES: TsalesLeadStatus[] = ["UNCONTACTED", "IN_PROGRESS", "CONTRACTED", "REJECTED"];

function isValidStatus(value: unknown): value is TsalesLeadStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as TsalesLeadStatus);
}

/**
 * t.세일즈(tsales_leads) — 지도-리스트-상세 3분할 관제의 리드 목록/등록
 * GET  /api/t-sales/leads?user_id=user-001&status=IN_PROGRESS
 * POST /api/t-sales/leads
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id") || undefined;
  const statusParam = request.nextUrl.searchParams.get("status");
  const status = isValidStatus(statusParam) ? statusParam : undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("tsales_leads").select("*").order("updated_at", { ascending: false });
      if (userId) query = query.eq("created_by_user_id", userId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ leads: data as TsalesLead[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tsales_leads query fallback to mock store:", err);
  }

  const leads = getTsalesLeads({ userId, status });
  return NextResponse.json({ leads, source: "mock" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      created_by_user_id = "user-001",
      tenant_id = null,
      business_name,
      contact_name = null,
      contact_phone = null,
      address = null,
      lat,
      lng,
      status = "UNCONTACTED",
      memo = null,
      estimated_deal_value_krw = null,
      proposal_items = [],
    } = body;

    if (typeof business_name !== "string" || !business_name.trim()) {
      return NextResponse.json({ error: "business_name은 필수입니다." }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "lat, lng는 숫자여야 합니다." }, { status: 400 });
    }
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: `status는 ${VALID_STATUSES.join(", ")} 중 하나여야 합니다.` },
        { status: 400 }
      );
    }

    const payload = {
      tenant_id,
      created_by_user_id,
      business_name,
      contact_name,
      contact_phone,
      address,
      lat,
      lng,
      status,
      memo,
      estimated_deal_value_krw,
      proposal_items,
      tsign_contract_id: null,
    };

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.from("tsales_leads").insert(payload).select().single();
        if (!error && data) {
          return NextResponse.json({ success: true, lead: data as TsalesLead, source: "supabase" });
        }
      }
    } catch (err) {
      console.warn("Supabase tsales_leads insert fallback to mock store:", err);
    }

    const lead = createTsalesLead(payload);
    return NextResponse.json({ success: true, lead, source: "mock" });
  } catch (err) {
    console.error("Failed to create tsales lead:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
