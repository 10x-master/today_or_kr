import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 유저별 t.다이어리 구독(user_diary_subscriptions) 조회/토글 API
 * GET  /api/t-diary/subscriptions?userId=user-001
 * POST /api/t-diary/subscriptions  { userId, diary_id, action: "subscribe" | "unsubscribe" }
 *
 * localStorage가 항상 1차 저장소이므로, Supabase 연결 실패 시에도
 * 클라이언트는 빈 배열/낙관적 성공 응답을 받아 정상 동작을 보장한다.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ diaryIds: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("user_diary_subscriptions")
        .select("diary_id")
        .eq("user_id", userId);

      if (!error && data) {
        return NextResponse.json({ diaryIds: data.map((row) => row.diary_id) });
      }
    }
  } catch (err) {
    console.warn("Supabase subscriptions fetch error, falling back to empty list:", err);
  }

  return NextResponse.json({ diaryIds: [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, diary_id, action } = body as {
      userId?: string;
      diary_id?: string;
      action?: "subscribe" | "unsubscribe";
    };

    if (!userId || !diary_id || !action) {
      return NextResponse.json({ error: "userId, diary_id, action이 필요합니다." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (supabase) {
      if (action === "subscribe") {
        await supabase
          .from("user_diary_subscriptions")
          .upsert({ user_id: userId, diary_id }, { onConflict: "user_id,diary_id" });
      } else {
        await supabase
          .from("user_diary_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("diary_id", diary_id);
      }
    }
  } catch (err) {
    console.warn("Supabase subscriptions write error (client-side localStorage remains source of truth):", err);
  }

  // Supabase 연동 여부와 무관하게 낙관적 성공 응답 — 클라이언트는 localStorage로 이미 반영 완료
  return NextResponse.json({ success: true });
}
