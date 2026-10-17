import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTnoteCard, getTnoteCards } from "@/lib/db/store";
import type { TnoteCard } from "@/types/note";

/**
 * t.노트(tnote_cards) — Google Keep 스타일 2-Tap 캡처 카드 조회/생성
 * GET  /api/t-note/cards?user_id=user-001
 * GET  /api/t-note/cards?public_feed=1        (공개 투데이노트 피드)
 * POST /api/t-note/cards
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("user_id") || undefined;
  const publicFeedOnly = searchParams.get("public_feed") === "1";

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("tnote_cards").select("*").order("created_at", { ascending: false });
      if (publicFeedOnly) {
        query = query.eq("is_public_feed", true);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ cards: data as TnoteCard[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tnote_cards query fallback to mock store:", err);
  }

  const cards = getTnoteCards({ userId, publicFeedOnly });
  return NextResponse.json({ cards, source: "mock" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id = "user-001",
      tenant_id = null,
      card_type = "NOTE",
      title = "",
      content = "",
      photo_url = null,
      voice_audio_url = null,
      voice_duration_sec = null,
      youtube_url = null,
      short_link = null,
      sourcing_item = null,
      todo_items = [],
      color = "#FFFFFF",
      is_private,
      is_public_feed,
      is_anonymous = false,
    } = body;

    if (!title && !content && !photo_url && !voice_audio_url) {
      return NextResponse.json(
        { error: "title, content, photo_url, voice_audio_url 중 최소 하나는 필요합니다." },
        { status: 400 }
      );
    }

    // 투데이노트 2-Tap 캡처는 LinkPick 숏링크와 함께 공개 피드로 발행되는 것이 기본 동작이다.
    const resolvedIsPublicFeed = typeof is_public_feed === "boolean" ? is_public_feed : true;
    const resolvedIsPrivate = typeof is_private === "boolean" ? is_private : !resolvedIsPublicFeed;

    const payload = {
      tenant_id,
      user_id,
      card_type,
      title: title || content.slice(0, 30) || "새 t.노트 기록",
      content,
      photo_url,
      voice_audio_url,
      voice_duration_sec,
      youtube_url,
      short_link: short_link || `today.to/p/${Math.random().toString(36).slice(2, 7)}`,
      sourcing_item,
      todo_items,
      color,
      is_private: resolvedIsPrivate,
      is_public_feed: resolvedIsPublicFeed,
      is_anonymous: Boolean(is_anonymous),
    };

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.from("tnote_cards").insert(payload).select().single();
        if (!error && data) {
          return NextResponse.json({ success: true, card: data as TnoteCard, source: "supabase" });
        }
      }
    } catch (err) {
      console.warn("Supabase tnote_cards insert fallback to mock store:", err);
    }

    const card = createTnoteCard(payload);
    return NextResponse.json({ success: true, card, source: "mock" });
  } catch (err) {
    console.error("Failed to create tnote card:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
