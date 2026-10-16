import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getQuoteRequestById, updateQuoteRequest } from "@/lib/db/store";
import type { QuoteItem, QuoteRequest, QuoteStatus } from "@/types/quote";

/**
 * 견적 요청 단건 조회 / 관리자 확정 수정
 * GET   /api/t-diary/quotes/[id]
 * PATCH /api/t-diary/quotes/[id]  { items?, packaging_fee?, shipping_fee?, admin_memo?, status? }
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("diary_quote_requests").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return NextResponse.json({ quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote fetch error, falling back to mock store:", err);
  }

  const quote = getQuoteRequestById(id);
  if (!quote) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ quote });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const patch: {
    items?: QuoteItem[];
    packaging_fee?: number;
    shipping_fee?: number;
    admin_memo?: string | null;
    status?: QuoteStatus;
  } = {};
  if (Array.isArray(body?.items)) patch.items = body.items;
  if (body?.packaging_fee !== undefined) patch.packaging_fee = Number(body.packaging_fee);
  if (body?.shipping_fee !== undefined) patch.shipping_fee = Number(body.shipping_fee);
  if (body?.admin_memo !== undefined) patch.admin_memo = body.admin_memo;
  if (body?.status) patch.status = body.status;

  const mockUpdated = updateQuoteRequest(id, patch);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const updatePayload: Record<string, unknown> = { ...patch };
      if (mockUpdated) {
        updatePayload.subtotal = mockUpdated.subtotal;
        updatePayload.final_amount = mockUpdated.final_amount;
      }
      const { data, error } = await supabase
        .from("diary_quote_requests")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote update error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, quote: mockUpdated });
}
