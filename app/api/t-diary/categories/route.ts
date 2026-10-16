import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCatalogCategory, getCatalogCategories, getDiaryBrandBySlug } from "@/lib/db/store";
import type { CatalogCategory } from "@/types/quote";

/**
 * t.홈페이지 B2B 카탈로그 3단 카테고리 트리 조회 (대분류/중분류/소분류 전체를 평탄한 배열로)
 * GET /api/t-diary/categories?brand=sme-transform
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");
  if (!brandSlug) {
    return NextResponse.json({ categories: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: brand } = await supabase.from("diaries").select("*").eq("brand_slug", brandSlug).maybeSingle();
      if (brand) {
        const { data: categories, error } = await supabase
          .from("catalog_categories")
          .select("*")
          .eq("diary_id", brand.id)
          .order("depth", { ascending: true })
          .order("sort_order", { ascending: true });
        if (!error && categories) {
          return NextResponse.json({ categories: categories as CatalogCategory[] });
        }
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary categories fetch error, falling back to mock store:", err);
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  const categories = brand ? getCatalogCategories(brand.id) : [];
  return NextResponse.json({ categories });
}

/**
 * 관리자 — 카테고리 신규 추가 (parent_id 없으면 대분류로 생성)
 * POST /api/t-diary/categories { brand, name, parent_id? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand: brandSlug, name, parent_id } = body;
  if (!brandSlug || !name) {
    return NextResponse.json({ error: "brand, name은 필수입니다." }, { status: 400 });
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const existing = getCatalogCategories(brand.id).filter((c) => c.parent_id === (parent_id || null));
      const parent = parent_id ? getCatalogCategories(brand.id).find((c) => c.id === parent_id) : null;
      const depth = parent ? parent.depth + 1 : 1;
      const sortOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.sort_order)) + 1 : 1;
      const { data, error } = await supabase
        .from("catalog_categories")
        .insert({
          diary_id: brand.id,
          parent_id: parent_id || null,
          depth,
          name,
          slug: name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, "-"),
          sort_order: sortOrder,
          is_visible: true,
        })
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ category: data as CatalogCategory });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary category insert error, falling back to mock store:", err);
  }

  const category = createCatalogCategory({ diary_id: brand.id, parent_id: parent_id || null, name });
  return NextResponse.json({ category });
}
