import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryBrandBySlug, getDiaryProducts, resolveOrCreateLeafCategory, upsertDiaryProductByCode } from "@/lib/db/store";
import { normalizeImageUrl } from "@/lib/diary/catalogUtils";
import type { CatalogExcelRow } from "@/lib/diary/catalogExcel";

/**
 * 엑셀/CSV/구글시트 파싱 결과를 일괄 등록 (카테고리 3단 경로 자동 생성 + 품목코드 upsert)
 * POST /api/t-diary/catalog/bulk-import { brand, rows: CatalogExcelRow[] }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand: brandSlug, rows } = body as { brand: string; rows: CatalogExcelRow[] };
  if (!brandSlug || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "brand, rows(1건 이상)는 필수입니다." }, { status: 400 });
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  const supabase = await createSupabaseServerClient().catch(() => null);

  for (const row of rows) {
    try {
      if (!row.product_code || !row.name) {
        errors.push(`${row.product_code || "(코드없음)"}: 품목코드/품목명 누락`);
        continue;
      }

      if (supabase) {
        // 대/중/소 카테고리 체인 확인 또는 생성
        const findOrCreate = async (parentId: string | null, depth: number, name: string) => {
          const { data: existing } = await supabase
            .from("catalog_categories")
            .select("*")
            .eq("diary_id", brand.id)
            .eq("parent_id", parentId)
            .eq("name", name)
            .maybeSingle();
          if (existing) return existing;
          const { data: siblings } = await supabase
            .from("catalog_categories")
            .select("sort_order")
            .eq("diary_id", brand.id)
            .eq("parent_id", parentId);
          const sortOrder = siblings && siblings.length > 0 ? Math.max(...siblings.map((s) => s.sort_order)) + 1 : 1;
          const { data: inserted } = await supabase
            .from("catalog_categories")
            .insert({
              diary_id: brand.id,
              parent_id: parentId,
              depth,
              name,
              slug: name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, "-"),
              sort_order: sortOrder,
              is_visible: true,
            })
            .select()
            .single();
          return inserted;
        };

        const l1 = await findOrCreate(null, 1, row.l1_name);
        const l2 = l1 ? await findOrCreate(l1.id, 2, row.l2_name) : null;
        const l3 = l2 ? await findOrCreate(l2.id, 3, row.l3_name) : null;

        if (l3) {
          const { data: existingProduct } = await supabase
            .from("diary_products")
            .select("id")
            .eq("diary_id", brand.id)
            .eq("product_code", row.product_code)
            .maybeSingle();

          const payload = {
            diary_id: brand.id,
            category_id: l3.id,
            product_code: row.product_code,
            name: row.name,
            spec: row.spec || null,
            cost_price: row.cost_price || 0,
            sell_price: row.sell_price || row.cost_price * 2 || 0,
            color_hex: "#1B3A5C",
            image_url: normalizeImageUrl(row.image_url),
            cover_size: row.cover_size || "커버 124×180mm / 123×185mm",
            page_count: 256,
            material_info: "이태리 습식 원단",
          };

          if (existingProduct) {
            await supabase.from("diary_products").update(payload).eq("id", existingProduct.id);
            updated += 1;
          } else {
            await supabase.from("diary_products").insert(payload);
            created += 1;
          }
          continue;
        }
      }

      // Supabase 미사용 또는 실패 시 mock 스토어로 폴백
      const leaf = resolveOrCreateLeafCategory(brand.id, row.l1_name, row.l2_name, row.l3_name);
      const alreadyExists = getDiaryProducts(brand.id).some((p) => p.product_code === row.product_code);
      upsertDiaryProductByCode(brand.id, row.product_code, {
        category_id: leaf.id,
        name: row.name,
        spec: row.spec || null,
        cost_price: row.cost_price || 0,
        sell_price: row.sell_price || undefined,
        image_url: row.image_url || null,
      });
      if (alreadyExists) updated += 1;
      else created += 1;
    } catch (err) {
      errors.push(`${row.product_code}: ${err instanceof Error ? err.message : "처리 실패"}`);
    }
  }

  return NextResponse.json({ created, updated, errors, total: rows.length });
}
