import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 500_000;

function extractMeta(html: string, prop: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

/**
 * 웹페이지 URL OpenGraph(타이틀/썸네일/요약) 자동 추출 — t.note 링크 스크랩 & 아카이빙
 * POST /api/t-note/scrape-link  { url }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawUrl = body?.url as string | undefined;

  if (!rawUrl) {
    return NextResponse.json({ error: "url이 필요합니다." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "유효하지 않은 URL입니다." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "http(s) URL만 지원됩니다." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TodayNoteBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`fetch failed with status ${res.status}`);
    }

    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (bytesRead < MAX_HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.length;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    } else {
      html = await res.text();
    }

    const title = extractMeta(html, "og:title") || extractTitleTag(html) || parsed.hostname;
    const description = extractMeta(html, "og:description") || extractMeta(html, "description");
    const image = extractMeta(html, "og:image");

    return NextResponse.json({
      success: true,
      bookmark: {
        url: parsed.toString(),
        title: title.trim().slice(0, 200),
        description: description ? description.trim().slice(0, 300) : undefined,
        image: image || undefined,
      },
    });
  } catch (err) {
    console.warn("Link scrape failed, returning hostname fallback:", err);
    // 스크랩 실패 시에도 100% 폴백 — 최소한의 북마크 카드는 항상 생성됨
    return NextResponse.json({
      success: true,
      bookmark: {
        url: parsed.toString(),
        title: parsed.hostname,
        description: undefined,
        image: undefined,
      },
    });
  }
}
