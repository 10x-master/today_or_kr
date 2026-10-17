import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteTnoteCard, updateTnoteCard } from "@/lib/db/store";
import type { TnoteCard } from "@/types/note";

/**
 * t.노트(tnote_cards) 단건 수정 — 고정/보관/공개상태 전환 등
 * PATCH /api/t-note/cards/[id]
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await request.json();

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tnote_cards").update(patch).eq("id", id).select().single();
      if (!error && data) {
        return NextResponse.json({ success: true, card: data as TnoteCard, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tnote_cards update fallback to mock store:", err);
  }

  const card = updateTnoteCard(id, patch);
  if (!card) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ success: true, card, source: "mock" });
}

/**
 * t.노트(tnote_cards) 삭제
 * DELETE /api/t-note/cards/[id]
 */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("tnote_cards").delete().eq("id", id);
      if (!error) {
        return NextResponse.json({ ok: true, source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tnote_cards delete fallback to mock store:", err);
  }

  const ok = deleteTnoteCard(id);
  if (!ok) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, source: "mock" });
}
