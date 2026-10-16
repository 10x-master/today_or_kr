import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryBrandBySlug, getDiaryProducts } from "@/lib/db/store";
import type { DiaryProduct } from "@/types/quote";

/**
 * T.홈페이지 B2B 카탈로그 상품 목록 조회
 * GET /api/t-diary/products?brand=sme-transform
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");
  if (!brandSlug) {
    return NextResponse.json({ products: [], brand: null });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: brand } = await supabase.from("diaries").select("*").eq("brand_slug", brandSlug).maybeSingle();
      if (brand) {
        const { data: products, error } = await supabase
          .from("diary_products")
          .select("*")
          .eq("diary_id", brand.id)
          .order("category", { ascending: true });
        if (!error && products) {
          return NextResponse.json({ products: products as DiaryProduct[], brand });
        }
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary products fetch error, falling back to mock store:", err);
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  const products = brand ? getDiaryProducts(brand.id) : [];
  return NextResponse.json({ products, brand });
}
