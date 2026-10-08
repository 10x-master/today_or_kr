import { NextRequest, NextResponse } from "next/server";
import { createLocalPost } from "@/lib/db/store";
import { mockRegions } from "@/lib/db/mockSeed";
import { containsBannedWords } from "@/lib/moderation";
import { LOCAL_PICK_CATEGORIES } from "@/lib/localPickCategory";
import type { LocalPickCategory, Region } from "@/types/local";

interface KakaoDetailParam {
  origin?: string;
  value?: string;
}

/** 카카오 i 오픈빌더 스킬 서버 요청 본문 (필요한 필드만 정의) */
interface KakaoSkillPayload {
  userRequest?: {
    utterance?: string;
    user?: { id?: string };
  };
  action?: {
    params?: Record<string, string>;
    detailParams?: Record<string, KakaoDetailParam>;
  };
}

function isValidCategory(value: unknown): value is LocalPickCategory {
  return (
    typeof value === "string" &&
    LOCAL_PICK_CATEGORIES.includes(value as LocalPickCategory)
  );
}

const IMAGE_URL_PATTERN = /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i;

/** 스킬 서버 params/detailParams에서 이미지 블록 URL 추출 */
function extractImageUrls(payload: KakaoSkillPayload): string[] {
  const candidates: string[] = [];

  const paramImage = payload.action?.params?.image;
  if (paramImage) candidates.push(paramImage);

  const detailParams = payload.action?.detailParams ?? {};
  for (const detail of Object.values(detailParams)) {
    if (detail.value && IMAGE_URL_PATTERN.test(detail.value)) {
      candidates.push(detail.value);
    }
    if (detail.origin && IMAGE_URL_PATTERN.test(detail.origin)) {
      candidates.push(detail.origin);
    }
  }

  return Array.from(new Set(candidates));
}

/** 발화문/파라미터에서 구-동 명칭을 찾아 행정동에 매핑, 실패 시 기본 지역으로 매핑 */
function resolveRegion(payload: KakaoSkillPayload): Region {
  const locationHint =
    payload.action?.params?.region ??
    payload.action?.params?.dong ??
    payload.userRequest?.utterance ??
    "";

  const matched = mockRegions.find(
    (region) =>
      locationHint.includes(region.dong) || locationHint.includes(region.gugun)
  );

  return matched ?? mockRegions[0];
}

function kakaoSimpleTextResponse(text: string) {
  return NextResponse.json({
    version: "2.0",
    template: {
      outputs: [{ simpleText: { text } }],
    },
  });
}

/** 카카오톡 채널 웹훅 수신 (POST /api/feed/kakao-webhook) */
export async function POST(request: NextRequest) {
  let payload: KakaoSkillPayload;
  try {
    payload = await request.json();
  } catch {
    return kakaoSimpleTextResponse("요청을 처리할 수 없습니다.");
  }

  const utterance = payload.userRequest?.utterance?.trim();
  if (!utterance) {
    return kakaoSimpleTextResponse("내용을 입력해 주세요.");
  }

  if (containsBannedWords(utterance)) {
    return kakaoSimpleTextResponse("등록할 수 없는 내용이 포함되어 있습니다.");
  }

  const images = extractImageUrls(payload);
  const region = resolveRegion(payload);
  const categoryParam = payload.action?.params?.category;
  const category: LocalPickCategory = isValidCategory(categoryParam)
    ? categoryParam
    : "talk";

  createLocalPost({
    title: utterance.length > 30 ? `${utterance.slice(0, 30)}...` : utterance,
    content: utterance,
    images,
    category,
    region,
    sourceChannel: "kakao_channel",
    author: {
      id: payload.userRequest?.user?.id ?? "kakao-guest",
      name: "카카오톡 제보자",
      isPartner: false,
      role: "user",
    },
  });

  return kakaoSimpleTextResponse("정상 등록되었습니다.");
}
