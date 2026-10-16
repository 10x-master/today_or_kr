import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markQuoteSent } from "@/lib/db/store";
import type { QuoteRequest } from "@/types/quote";

/**
 * [💬 카카오 알림톡 견적서 푸시 발송] (데모) — REQUESTED → QUOTED 전이
 * POST /api/t-diary/quotes/[id]/alimtalk
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const mockUpdated = markQuoteSent(id);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_quote_requests")
        .update({ status: "QUOTED" })
        .eq("id", id)
        .eq("status", "REQUESTED")
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote alimtalk send error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, quote: mockUpdated });
}
