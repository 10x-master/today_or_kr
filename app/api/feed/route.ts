import { NextRequest, NextResponse } from "next/server";
import { createLocalPost, getVisibleLocalPosts } from "@/lib/db/store";
import { containsBannedWords } from "@/lib/moderation";
import type { LocalPickCategory, LocalPostAuthor, Region } from "@/types/local";

const VALID_CATEGORIES: LocalPickCategory[] = [
  "festival",
  "spot",
  "food",
  "activity",
  "welfare",
  "repair",
  "business",
];

function isValidCategory(value: unknown): value is LocalPickCategory {
  return (
    typeof value === "string" &&
    VALID_CATEGORIES.includes(value as LocalPickCategory)
  );
}

function isValidRegion(value: unknown): value is Region {
  if (!value || typeof value !== "object") return false;
  const region = value as Record<string, unknown>;
  return (
    typeof region.sido === "string" &&
    typeof region.gugun === "string" &&
    typeof region.dong === "string" &&
    typeof region.code === "string" &&
    typeof region.lat === "number" &&
    typeof region.lng === "number"
  );
}

/** 동네별 로컬 피드 조회 (GET /api/feed?sido=&gugun=&dong=&category=) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");

  const posts = getVisibleLocalPosts({
    sido: searchParams.get("sido") ?? undefined,
    gugun: searchParams.get("gugun") ?? undefined,
    dong: searchParams.get("dong") ?? undefined,
    category: isValidCategory(category) ? category : undefined,
  });

  return NextResponse.json({ posts });
}

interface CreateFeedPostBody {
  title?: unknown;
  content?: unknown;
  images?: unknown;
  category?: unknown;
  region?: unknown;
  author?: {
    id?: unknown;
    name?: unknown;
    isPartner?: unknown;
    badge?: unknown;
  };
}

function resolveAuthor(author: CreateFeedPostBody["author"]): LocalPostAuthor {
  return {
    id: typeof author?.id === "string" ? author.id : "guest",
    name: typeof author?.name === "string" ? author.name : "익명",
    isPartner: typeof author?.isPartner === "boolean" ? author.isPartner : false,
    badge: typeof author?.badge === "string" ? author.badge : undefined,
  };
}

/** 모바일 웹 간편 등록 (POST /api/feed) */
export async function POST(request: NextRequest) {
  let body: CreateFeedPostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { title, content, images, category, region, author } = body;

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title은 필수입니다." }, { status: 400 });
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content는 필수입니다." }, { status: 400 });
  }
  if (!Array.isArray(images) || !images.every((image) => typeof image === "string")) {
    return NextResponse.json(
      { error: "images는 문자열 배열이어야 합니다." },
      { status: 400 }
    );
  }
  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "유효하지 않은 category입니다." }, { status: 400 });
  }
  if (!isValidRegion(region)) {
    return NextResponse.json({ error: "유효하지 않은 region입니다." }, { status: 400 });
  }
  if (containsBannedWords(title, content)) {
    return NextResponse.json(
      { error: "금칙어가 포함되어 있어 등록할 수 없습니다." },
      { status: 400 }
    );
  }

  const post = createLocalPost({
    title,
    content,
    images,
    category,
    region,
    sourceChannel: "mobile_web",
    author: resolveAuthor(author),
  });

  return NextResponse.json({ post }, { status: 201 });
}
