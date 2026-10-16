import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCategoryPathNames, getDiaryBrandBySlug, getDiaryProducts } from "@/lib/db/store";
import { buildCatalogExportXlsx } from "@/lib/diary/catalogExcel";
import type { DiaryProduct } from "@/types/quote";

/**
 * 현재 등록된 전체 카탈로그 상품을 표준 XLSX로 다운로드
 * GET /api/t-diary/catalog/export?brand=sme-transform
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");
  if (!brandSlug) {
    return NextResponse.json({ error: "brand는 필수입니다." }, { status: 400 });
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  let products: DiaryProduct[] = getDiaryProducts(brand.id);
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("diary_products").select("*").eq("diary_id", brand.id);
      if (!error && data) products = data as DiaryProduct[];
    }
  } catch (err) {
    console.warn("Supabase t-diary catalog export fetch error, falling back to mock store:", err);
  }

  const rows = products.map((p) => {
    const path = getCategoryPathNames(p.category_id);
    return {
      product_code: p.product_code,
      name: p.name,
      l1_name: path.l1,
      l2_name: path.l2,
      l3_name: path.l3,
      cover_size: p.cover_size,
      sell_price: p.sell_price,
      cost_price: p.cost_price,
      image_url: p.image_url,
      spec: p.spec,
    };
  });

  const buffer = buildCatalogExportXlsx(rows);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="catalog_${brandSlug}.xlsx"`,
    },
  });
}
