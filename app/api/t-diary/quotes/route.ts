import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createQuoteRequest, getDiaryBrandBySlug, getQuoteRequests } from "@/lib/db/store";
import type { QuoteItem, QuoteRequest } from "@/types/quote";

/**
 * B2B 견적 요청 목록 조회 / 접수
 * GET  /api/t-diary/quotes?diary_id=xxx  (관리자 콘솔)
 * POST /api/t-diary/quotes  { brand, company_name, contact_name, contact_phone, items, print_options }
 */
export async function GET(request: NextRequest) {
  const diaryId = request.nextUrl.searchParams.get("diary_id") || undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("diary_quote_requests").select("*").order("created_at", { ascending: false });
      if (diaryId) query = query.eq("diary_id", diaryId);
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ quotes: data as QuoteRequest[] });
      }
    }
  } catch (err) {
    console.warn("Supabase quotes fetch error, falling back to mock store:", err);
  }

  return NextResponse.json({ quotes: getQuoteRequests(diaryId) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const brandSlug = body?.brand as string | undefined;
  const companyName = String(body?.company_name || "").trim();
  const contactName = String(body?.contact_name || "").trim();
  const contactPhone = String(body?.contact_phone || "").trim();
  const items = Array.isArray(body?.items) ? (body.items as QuoteItem[]) : [];

  if (!brandSlug || !companyName || !contactName || !contactPhone || items.length === 0) {
    return NextResponse.json(
      { error: "brand, company_name, contact_name, contact_phone, items가 모두 필요합니다." },
      { status: 400 }
    );
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  const mockQuote = createQuoteRequest({
    diary_id: brand.id,
    company_name: companyName,
    contact_name: contactName,
    contact_phone: contactPhone,
    items,
    print_options: body?.print_options || null,
  });

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_quote_requests")
        .insert({
          diary_id: brand.id,
          company_name: companyName,
          contact_name: contactName,
          contact_phone: contactPhone,
          items,
          print_options: body?.print_options || null,
          status: "REQUESTED",
          subtotal: mockQuote.subtotal,
          final_amount: mockQuote.final_amount,
        })
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quote: data as QuoteRequest });
      }
    }
  } catch (err) {
    console.warn("Supabase quote insert error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, quote: mockQuote });
}
