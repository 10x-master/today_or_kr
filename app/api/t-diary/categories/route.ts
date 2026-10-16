import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryCategory, getDiaryBrandBySlug, getDiaryCategories } from "@/lib/db/store";
import type { DiaryCategory } from "@/types/quote";

/**
 * T.홈페이지 B2B 카탈로그 카테고리 목록 조회
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
          .from("diary_categories")
          .select("*")
          .eq("diary_id", brand.id)
          .order("sort_order", { ascending: true });
        if (!error && categories) {
          return NextResponse.json({ categories: categories as DiaryCategory[] });
        }
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary categories fetch error, falling back to mock store:", err);
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  const categories = brand ? getDiaryCategories(brand.id) : [];
  return NextResponse.json({ categories });
}

/**
 * 관리자 — 카테고리 신규 추가
 * POST /api/t-diary/categories { brand, name }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand: brandSlug, name } = body;
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
      const existing = getDiaryCategories(brand.id);
      const sortOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.sort_order)) + 1 : 1;
      const { data, error } = await supabase
        .from("diary_categories")
        .insert({ diary_id: brand.id, name, sort_order: sortOrder, is_visible: true })
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ category: data as DiaryCategory });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary category insert error, falling back to mock store:", err);
  }

  const category = createDiaryCategory({ diary_id: brand.id, name });
  return NextResponse.json({ category });
}
