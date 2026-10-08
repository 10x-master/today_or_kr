import type { CivicCategory, CivicNotice } from "@/types/civic";
import type { Region } from "@/types/local";
import { DEMO_REGIONS } from "@/lib/demoRegions";

const [SANGGYE_DONG, DOLSAN_EUP] = DEMO_REGIONS;

/**
 * 지자체 공식 게시판 소스 설정.
 * 아래 URL은 2026-10-08 기준 직접 접속하여 확인한 실제 게시판 경로입니다.
 *  - 노원구청(nowon.kr): 전자정부프레임워크 기반 게시판으로 상세글은
 *    `BD_selectBbs.do?q_bbsCode=<보드코드>&q_bbscttSn=<글ID>` 형식입니다.
 *  - 여수시청(yeosu.go.kr): `www/govt/news/<보드명>?idx=<글ID>&mode=view` 형식입니다.
 * 두 사이트 모두 공식 RSS/OpenAPI 엔드포인트는 확인되지 않아(서울 열린데이터광장에도
 * 노원구 고시공고 전용 OpenAPI가 등록되어 있지 않음), 우선 HTML 게시판 목록을
 * 직접 파싱하는 방식으로 구현했습니다. RSS 엔드포인트가 확보되면
 * `fetchCivicNoticesFromRss`로 손쉽게 전환할 수 있도록 분리해 두었습니다.
 */
export interface CivicFeedSource {
  id: string;
  siteName: string;
  region: Region;
  category: CivicCategory;
  /** 게시판 목록 페이지 URL (HTML) */
  listUrl: string;
  /** 상세글 딥링크를 조립할 때 쓰는 base, 글 ID만 알고 안전하게 조립 가능한 경우에만 사용 */
  detailUrlBuilder?: (postId: string) => string;
}

export const CIVIC_FEED_SOURCES: CivicFeedSource[] = [
  {
    id: "nowon-notice",
    siteName: "노원구청",
    region: SANGGYE_DONG,
    category: "행정복지",
    listUrl: "https://www.nowon.kr/www/user/bbs/BD_selectBbsList.do?q_bbsCode=1001&q_estnColumn1=11",
    detailUrlBuilder: (postId) =>
      `https://www.nowon.kr/www/user/bbs/BD_selectBbs.do?q_bbsCode=1001&q_bbscttSn=${postId}`,
  },
  {
    id: "nowon-gosi",
    siteName: "노원구청",
    region: SANGGYE_DONG,
    category: "생활안전",
    listUrl:
      "https://www.nowon.kr/www/user/bbs/BD_selectBbsList.do?q_bbsCode=1003&q_clCode=0&q_estnColumn1=11&q_ntceSiteCode=11",
  },
  {
    id: "yeosu-notice",
    siteName: "여수시청",
    region: DOLSAN_EUP,
    category: "문화체육",
    listUrl: "https://www.yeosu.go.kr/www/govt/news/notice",
    detailUrlBuilder: (postId) => `https://www.yeosu.go.kr/www/govt/news/notice?idx=${postId}&mode=view`,
  },
];

/** HTML 목록 페이지에서 추출한 한 건의 원시 게시글 정보 */
export interface ScrapedListItem {
  postId: string;
  title: string;
  department?: string;
  publishedAt: string;
}

/**
 * 노원구청 게시판(BD_selectBbs.do 계열) HTML에서 글 목록을 추출합니다.
 * 전자정부프레임워크 표준 게시판 마크업을 가정한 정규식 기반 파서이며,
 * 사이트 마크업이 바뀌면 조정이 필요할 수 있습니다.
 */
function parseNowonBoardHtml(html: string): ScrapedListItem[] {
  const items: ScrapedListItem[] = [];
  const rowPattern =
    /q_bbscttSn=(\d{14,})[^"']*["'][^>]*>\s*([^<]{2,200})<[\s\S]{0,400}?(\d{4}-\d{2}-\d{2})/g;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const [, postId, rawTitle, publishedAt] = match;
    items.push({
      postId,
      title: rawTitle.trim(),
      publishedAt,
    });
  }

  return items;
}

/** 여수시청 게시판(www/govt/news/*) HTML에서 글 목록을 추출합니다. */
function parseYeosuBoardHtml(html: string): ScrapedListItem[] {
  const items: ScrapedListItem[] = [];
  const rowPattern = /idx=(\d+)&amp;mode=view["'][^>]*>\s*([^<]{2,200})</g;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const [, postId, rawTitle] = match;
    items.push({
      postId,
      title: rawTitle.trim(),
      publishedAt: new Date().toISOString().slice(0, 10),
    });
  }

  return items;
}

/** 지자체 HTML 게시판을 호출하여 CivicNotice 목록으로 변환 */
export async function fetchCivicNoticesFromHtmlBoard(
  source: CivicFeedSource
): Promise<CivicNotice[]> {
  const res = await fetch(source.listUrl, {
    headers: { "User-Agent": "TodayPickCivicScraper/1.0" },
  });

  if (!res.ok) {
    throw new Error(`${source.siteName} 게시판 응답 실패: ${res.status}`);
  }

  const html = await res.text();
  const parsed = source.id.startsWith("nowon")
    ? parseNowonBoardHtml(html)
    : parseYeosuBoardHtml(html);

  return parsed.map((item) => ({
    id: `${source.id}-${item.postId}`,
    region: source.region,
    category: source.category,
    title: item.title,
    department: item.department ?? source.siteName,
    publishedAt: item.publishedAt,
    originUrl: source.detailUrlBuilder?.(item.postId) ?? source.listUrl,
  }));
}

/**
 * RSS 2.0 피드(예: 서울 열린데이터광장 또는 지자체가 추후 RSS를 제공할 경우)를
 * 파싱하는 범용 함수. 현재 두 지자체 모두 확인 가능한 RSS 엔드포인트가 없어
 * 기본 소스 목록에는 연결되어 있지 않지만, 엔드포인트가 확보되면 바로 사용할 수
 * 있도록 미리 구현해 둡니다.
 */
export async function fetchCivicNoticesFromRss(
  rssUrl: string,
  region: Region,
  category: CivicCategory,
  siteName: string
): Promise<CivicNotice[]> {
  const res = await fetch(rssUrl);
  if (!res.ok) {
    throw new Error(`RSS 응답 실패: ${res.status}`);
  }

  const xml = await res.text();
  const items: CivicNotice[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;

  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];
    const title = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(block)?.[1]?.trim();
    const link = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/.exec(block)?.[1]?.trim();
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim();

    if (title && link) {
      items.push({
        id: `rss-${index++}`,
        region,
        category,
        title,
        department: siteName,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        originUrl: link,
      });
    }
  }

  return items;
}

/** 설정된 모든 지자체 소스를 호출하여 결과를 합칩니다. 개별 소스 실패는 무시하고 계속 진행합니다. */
export async function fetchAllCivicNotices(
  sources: CivicFeedSource[] = CIVIC_FEED_SOURCES
): Promise<CivicNotice[]> {
  const results = await Promise.allSettled(sources.map((source) => fetchCivicNoticesFromHtmlBoard(source)));

  return results
    .filter((result): result is PromiseFulfilledResult<CivicNotice[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);
}
