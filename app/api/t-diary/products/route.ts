import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryProduct, getDiaryBrandBySlug, getDiaryProducts } from "@/lib/db/store";
import { normalizeImageUrl, suggestSellPrice } from "@/lib/diary/catalogUtils";
import type { DiaryProduct } from "@/types/quote";

/**
 * t.홈페이지 B2B 카탈로그 상품 목록 조회
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
          .order("created_at", { ascending: true });
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

/**
 * 관리자 — 상품 신규 등록. sell_price를 직접 지정하지 않으면 cost_price 기반 제안가가 사용됨
 * POST /api/t-diary/products { brand, category_id, product_code, name, spec?, cost_price, sell_price?, color_hex, image_url?, cover_size?, page_count?, material_info? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand: brandSlug, category_id, product_code, name, cost_price, color_hex } = body;
  if (!brandSlug || !category_id || !product_code || !name || typeof cost_price !== "number" || !color_hex) {
    return NextResponse.json(
      { error: "brand, category_id, product_code, name, cost_price, color_hex는 필수입니다." },
      { status: 400 }
    );
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  const sellPrice = typeof body.sell_price === "number" ? body.sell_price : suggestSellPrice(cost_price);
  const imageUrl = normalizeImageUrl(body.image_url);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_products")
        .insert({
          diary_id: brand.id,
          category_id,
          product_code,
          name,
          spec: body.spec || null,
          cost_price,
          sell_price: sellPrice,
          color_hex,
          image_url: imageUrl,
          cover_size: body.cover_size || "커버 124×180mm / 123×185mm",
          page_count: body.page_count ?? 256,
          material_info: body.material_info || "이태리 습식 원단",
        })
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ product: data as DiaryProduct });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary product insert error, falling back to mock store:", err);
  }

  const product = createDiaryProduct({
    diary_id: brand.id,
    category_id,
    product_code,
    name,
    spec: body.spec,
    cost_price,
    sell_price: sellPrice,
    color_hex,
    image_url: imageUrl,
    cover_size: body.cover_size,
    page_count: body.page_count,
    material_info: body.material_info,
  });
  return NextResponse.json({ product });
}
