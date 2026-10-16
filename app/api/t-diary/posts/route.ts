import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDiaryPost, getDiaryPosts } from "@/lib/db/store";
import type { DiaryMemberRole, DiaryPost } from "@/types/diary";

/**
 * 우리 반/우리 그룹 커뮤니티 피드 조회 API
 * GET /api/t-diary/posts?diary_id=xxx
 */
export async function GET(request: NextRequest) {
  const diaryId = request.nextUrl.searchParams.get("diary_id");
  if (!diaryId) {
    return NextResponse.json({ posts: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_posts")
        .select("*")
        .eq("diary_id", diaryId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return NextResponse.json({ posts: data as DiaryPost[] });
      }
    }
  } catch (err) {
    console.warn("Supabase diary posts fetch error, falling back to mock store:", err);
  }

  return NextResponse.json({ posts: getDiaryPosts(diaryId) });
}

/**
 * 선생님/관리자의 알림장·활동 게시글 작성
 * POST /api/t-diary/posts  { diary_id, author_id, author_role, title, content, media_urls, target_grades }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const diary_id = body?.diary_id as string | undefined;
  const author_id = body?.author_id as string | undefined;
  const author_role = body?.author_role as DiaryMemberRole | undefined;
  const title = String(body?.title || "").trim();

  if (!diary_id || !author_id || !author_role || !title) {
    return NextResponse.json(
      { error: "diary_id, author_id, author_role, title이 필요합니다." },
      { status: 400 }
    );
  }

  const content = body?.content ? String(body.content).trim() : null;
  const media_urls: string[] = Array.isArray(body?.media_urls) ? body.media_urls.filter(Boolean) : [];
  const target_grades: string[] = Array.isArray(body?.target_grades) && body.target_grades.length ? body.target_grades : ["ALL"];

  const mockPost = createDiaryPost({ diary_id, author_id, author_role, title, content, media_urls, target_grades });

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("diary_posts")
        .insert({ diary_id, author_id, author_role, title, content, media_urls, target_grades })
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, post: data as DiaryPost });
      }
    }
  } catch (err) {
    console.warn("Supabase diary post insert error, using mock store result:", err);
  }

  return NextResponse.json({ success: true, post: mockPost });
}
