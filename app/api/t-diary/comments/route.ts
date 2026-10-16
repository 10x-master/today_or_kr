import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryComment, getDiaryComments } from "@/lib/db/store";
import type { DiaryComment } from "@/types/diary";

/**
 * 커뮤니티 게시글 비밀 댓글(안심 소통창구) 조회 API
 * GET /api/t-diary/comments?post_id=xxx
 */
export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("post_id");
  if (!postId) {
    return NextResponse.json({ comments: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!error && data) {
        return NextResponse.json({ comments: data as DiaryComment[] });
      }
    }
  } catch (err) {
    console.warn("Supabase diary comments fetch error, falling back to mock store:", err);
  }

  return NextResponse.json({ comments: getDiaryComments(postId) });
}

/**
 * 커뮤니티 구성원의 비밀 댓글 작성
 * POST /api/t-diary/comments  { post_id, author_id, content }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const post_id = body?.post_id as string | undefined;
  const author_id = body?.author_id as string | undefined;
  const content = String(body?.content || "").trim();

  if (!post_id || !author_id || !content) {
    return NextResponse.json({ error: "post_id, author_id, content이 필요합니다." }, { status: 400 });
  }

  const mockComment = createDiaryComment({ post_id, author_id, content });

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_comments")
        .insert({ post_id, author_id, content })
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, comment: data as DiaryComment });
      }
    }
  } catch (err) {
    console.warn("Supabase diary comment insert error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, comment: mockComment });
}
