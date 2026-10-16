import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markQuoteSigned } from "@/lib/db/store";
import type { QuoteRequest } from "@/types/quote";

/**
 * [✍️ t.싸인 전자계약 체결하기] (데모 모바일 간편 서명) — QUOTED → SIGNED 전이
 * POST /api/t-diary/quotes/[id]/sign
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const mockUpdated = markQuoteSigned(id);
  const signDocId = mockUpdated?.t_sign_doc_id || `sign-doc-quote-${Date.now()}`;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_quote_requests")
        .update({ status: "SIGNED", sign_status: "COMPLETED", t_sign_doc_id: signDocId })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote sign error, using mock store result:", err);
  }

  if (!mockUpdated) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, quote: mockUpdated });
}
