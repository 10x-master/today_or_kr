import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHeroRollingProducts, getPlatformProducts, updatePlatformProduct } from "@/lib/db/store";
import type { PlatformProduct } from "@/types/officialNotice";

/**
 * 취급제품 및 메인 롤링 제품 마스터 API
 * GET /api/platform-products?hero_only=true&category=INTERIOR&include_private=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const heroOnly = searchParams.get("hero_only") === "true";
  const category = searchParams.get("category");
  const includePrivate =
    searchParams.get("include_private") === "true" ||
    searchParams.get("admin") === "true";

  // 1. Supabase 원격 DB 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("platform_products")
        .select("*")
        .order("rolling_order", { ascending: true });

      if (!includePrivate) {
        query = query.eq("is_public", true);
      }

      if (heroOnly) {
        query = query.eq("is_hero_rolling", true);
      }

      if (category && category !== "ALL") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          products: data as PlatformProduct[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase platform_products query fallback to mock store:", err);
  }

  // 2. Mock fallback
  let products = heroOnly ? getHeroRollingProducts() : getPlatformProducts();
  if (!includePrivate) {
    products = products.filter((p) => p.is_public !== false);
  }
  if (category && category !== "ALL") {
    products = products.filter((p) => p.category === category);
  }

  return NextResponse.json({
    products,
    source: "mock",
  });
}

/**
 * 최고관리자 원클릭 제품 노출 및 공개 설정 변경
 * PATCH /api/platform-products
 * Body: { id: string, is_public?: boolean, is_hero_rolling?: boolean, min_partner_grade?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_public, is_hero_rolling, min_partner_grade } = body;

    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const updates: Partial<PlatformProduct> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof is_public === "boolean") updates.is_public = is_public;
    if (typeof is_hero_rolling === "boolean") updates.is_hero_rolling = is_hero_rolling;
    if (min_partner_grade) updates.min_partner_grade = min_partner_grade;

    // 1. Supabase 원격 DB 업데이트
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("platform_products")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          // 로컬 스토어도 동기화
          updatePlatformProduct(id, updates);
          return NextResponse.json({
            success: true,
            product: data as PlatformProduct,
            source: "supabase",
          });
        }
      }
    } catch (err) {
      console.warn("Supabase platform_products update fallback to mock store:", err);
    }

    // 2. Mock store fallback 업데이트
    const updated = updatePlatformProduct(id, updates);
    return NextResponse.json({
      success: true,
      product: updated,
      source: "mock",
    });
  } catch (err) {
    console.error("PATCH /api/platform-products error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
