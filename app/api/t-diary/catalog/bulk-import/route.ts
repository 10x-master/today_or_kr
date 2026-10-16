import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryBrandBySlug, getDiaryProducts, resolveLeafCategoryStrict, upsertDiaryProductByCode } from "@/lib/db/store";
import { normalizeImageUrl } from "@/lib/diary/catalogUtils";
import type { CatalogExcelRow } from "@/lib/diary/catalogExcel";

/**
 * 엑셀/CSV/구글시트 파싱 결과를 일괄 등록 (품목코드 upsert).
 * 대/중/소 카테고리는 더 이상 즉석 자동 생성하지 않는다 — 관리자가 /admin/diaries/catalog/categories에서
 * 사전에 만들어 둔 카테고리 경로(l1/l2/l3명 정확히 일치)로만 매핑하며, 매칭 실패 행은 건너뛰고
 * `unmatched`로 함께 보고한다.
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
  const unmatched: string[] = [];
  const supabase = await createSupabaseServerClient().catch(() => null);

  for (const row of rows) {
    try {
      if (!row.product_code || !row.name) {
        errors.push(`${row.product_code || "(코드없음)"}: 품목코드/품목명 누락`);
        continue;
      }

      if (supabase) {
        // 대/중/소 카테고리 경로가 사전에 정의되어 있는지 "조회만" 한다 — 즉석 생성하지 않음
        const findExisting = async (parentId: string | null, name: string) => {
          const { data } = await supabase
            .from("catalog_categories")
            .select("*")
            .eq("diary_id", brand.id)
            .eq("parent_id", parentId)
            .eq("name", name)
            .maybeSingle();
          return data;
        };

        const l1 = await findExisting(null, row.l1_name);
        const l2 = l1 ? await findExisting(l1.id, row.l2_name) : null;
        const l3 = l2 ? await findExisting(l2.id, row.l3_name) : null;

        if (!l3) {
          unmatched.push(`${row.product_code}: "${row.l1_name}/${row.l2_name}/${row.l3_name}" 카테고리가 사전 정의되어 있지 않아 건너뜀`);
          continue;
        }

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

      // Supabase 미사용 또는 실패 시 mock 스토어로 폴백 — 역시 사전 정의된 카테고리로만 매핑
      const leaf = resolveLeafCategoryStrict(brand.id, row.l1_name, row.l2_name, row.l3_name);
      if (!leaf) {
        unmatched.push(`${row.product_code}: "${row.l1_name}/${row.l2_name}/${row.l3_name}" 카테고리가 사전 정의되어 있지 않아 건너뜀`);
        continue;
      }
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

  return NextResponse.json({ created, updated, errors, unmatched, total: rows.length });
}
