import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateDiaryCategory } from "@/lib/db/store";
import type { DiaryCategory } from "@/types/quote";

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
      const { data, error } = await supabase
        .from("diary_categories")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ category: data as DiaryCategory });
      }
    }
  } catch (err) {
    console.warn("Supabase t-diary category update error, falling back to mock store:", err);
  }

  const category = updateDiaryCategory(id, patch);
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ category });
}
