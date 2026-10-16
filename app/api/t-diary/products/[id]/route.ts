import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryProductById, updateDiaryProduct } from "@/lib/db/store";
import { calcSellPrice } from "@/lib/diary/catalogUtils";
import type { DiaryProduct } from "@/types/quote";

/**
 * 상품 단건 조회 (카탈로그 상세 페이지용)
 * GET /api/t-diary/products/[id]
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("diary_products").select("*").eq("id", id).maybeSingle();
      if (!error && data) {
        return NextResponse.json({ product: data as DiaryProduct });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary product fetch error, falling back to mock store:", err);
  }

  const product = getDiaryProductById(id);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

/**
 * 관리자 — 상품 수정 (cost_price 변경 시 sell_price 자동 재계산)
 * PATCH /api/t-diary/products/[id]
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await request.json();

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const updatePayload = { ...patch };
      if (typeof patch.cost_price === "number") {
        updatePayload.sell_price = calcSellPrice(patch.cost_price);
      }
      const { data, error } = await supabase
        .from("diary_products")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ product: data as DiaryProduct });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary product update error, falling back to mock store:", err);
  }

  const product = updateDiaryProduct(id, patch);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ product });
}
