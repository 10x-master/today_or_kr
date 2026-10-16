import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteCatalogCategory, updateCatalogCategory } from "@/lib/db/store";
import type { CatalogCategory } from "@/types/quote";

/**
 * 관리자 — 카테고리 이름/순서/노출여부 수정
 * PATCH /api/t-diary/categories/[id] { name?, sort_order?, is_visible? }
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await request.json();

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const updatePayload: Record<string, unknown> = { ...patch };
      if (typeof patch.name === "string") {
        updatePayload.slug = patch.name.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, "-");
      }
      const { data, error } = await supabase
        .from("catalog_categories")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ category: data as CatalogCategory });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary category update error, falling back to mock store:", err);
  }

  const category = updateCatalogCategory(id, patch);
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ category });
}

/**
 * 관리자 — 카테고리 삭제. 하위 카테고리나 연결된 상품이 있으면 409로 거부한다.
 * DELETE /api/t-diary/categories/[id]
 */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: children } = await supabase.from("catalog_categories").select("id").eq("parent_id", id).limit(1);
      if (children && children.length > 0) {
        return NextResponse.json(
          { error: "하위 카테고리가 남아 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제해주세요." },
          { status: 409 }
        );
      }
      const { data: productsInCategory } = await supabase
        .from("diary_products")
        .select("id")
        .eq("category_id", id)
        .limit(1);
      if (productsInCategory && productsInCategory.length > 0) {
        return NextResponse.json(
          { error: "이 카테고리에 등록된 상품이 있어 삭제할 수 없습니다. 먼저 상품을 다른 카테고리로 이동하거나 삭제해주세요." },
          { status: 409 }
        );
      }
      const { error } = await supabase.from("catalog_categories").delete().eq("id", id);
      if (!error) {
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary category delete error, falling back to mock store:", err);
  }

  const result = deleteCatalogCategory(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason || "삭제에 실패했습니다." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
