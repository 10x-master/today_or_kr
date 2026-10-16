import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markQuotePaymentRequested } from "@/lib/db/store";
import type { QuoteRequest } from "@/types/quote";

/**
 * [💳 결제 / 전자세금계산서 발행 요청] (데모) — SIGNED → PAID 전이
 * POST /api/t-diary/quotes/[id]/payment
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const mockUpdated = markQuotePaymentRequested(id);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_quote_requests")
        .update({ status: "PAID", payment_requested: true })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote payment request error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, quote: mockUpdated });
}
