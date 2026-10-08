import { NextRequest, NextResponse } from "next/server";
import { reportLocalPost } from "@/lib/db/store";

/** 주민 자율 신고 접수 (POST /api/feed/[id]/report) - 3회 누적 시 자동 블라인드 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = reportLocalPost(id);

  if (!post) {
    return NextResponse.json(
      { error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ post });
}
