import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { LINK_DESCRIPTION_MAX, LINK_TITLE_MAX, normalizeUrl } from "@/lib/linkpick/links";

// 외부 페이지 가져오기 전체(리다이렉트 + 본문 읽기)에 쓰는 시간 제한.
const TIMEOUT_MS = 5000;
// 쿠팡 상품 페이지는 head의 og 태그와 JSON-LD가 본문 뒤쪽에 있을 수 있어서 여유 있게 읽는다.
const MAX_BODY_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const PRICE_MAX = 30;
// 최신 iPhone Safari User-Agent. 데스크톱 봇 차단에 걸리는 경우를 줄인다.
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

type ScrapedProduct = {
  title: string | null;
  description: string | null;
  image_url: string | null;
  price: string | null;
  // 페이지를 못 받아 주소에서만 얻은 기본값일 때 true.
  partial?: boolean;
};

class ScrapeError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

// 로그인한 파트너만 쓸 수 있다. 서버가 외부 주소를 대신 가져오므로 익명 사용을 막는다.
export async function POST(request: Request) {
  try {
    if (!(await isSignedIn(request))) throw new ScrapeError("unauthorized", 401);

    const body: unknown = await request.json().catch(() => null);
    const rawUrl = isRecord(body) && typeof body.url === "string" ? body.url : "";
    const target = parseTargetUrl(rawUrl);
    const data = await scrapeProduct(target);

    return Response.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ScrapeError) {
      return Response.json({ ok: false, error: error.code }, { status: error.status });
    }
    return Response.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}

async function isSignedIn(request: Request): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return false;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

function parseTargetUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) throw new ScrapeError("invalid_url", 400);

  let url: URL;
  try {
    url = new URL(normalizeUrl(trimmed));
  } catch {
    throw new ScrapeError("invalid_url", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ScrapeError("invalid_url", 400);
  if (url.username || url.password) throw new ScrapeError("invalid_url", 400);
  if (url.port && url.port !== "80" && url.port !== "443") throw new ScrapeError("invalid_url", 400);
  return url;
}

// 내부망·로컬 주소로 요청이 새지 않도록, 연결 전에 호스트가 공인 IP인지 확인한다.
async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new ScrapeError("blocked_url", 400);
  }

  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = (await lookup(host, { all: true })).map((entry) => entry.address);
    } catch {
      throw new ScrapeError("fetch_failed", 502);
    }
  }

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ScrapeError("blocked_url", 400);
  }
}

function isPrivateAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));

  if (isIP(lower) === 4) {
    const [a, b] = lower.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }

  if (isIP(lower) === 6) {
    return lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || /^fe[89ab]/.test(lower);
  }

  // 형식을 알 수 없는 주소는 막는다.
  return true;
}

async function scrapeProduct(start: URL): Promise<ScrapedProduct> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const page = await fetchPage(start, controller.signal);
    const product = extractProduct(page.html, page.url);
    // 차단 페이지를 200으로 줘도 쓸 만한 값이 하나도 없으면 쿠팡은 기본값으로 대체한다.
    if (isCoupangHost(start) && !product.title && !product.image_url && !product.price) {
      return coupangFallback(start);
    }
    // 쿠팡 설명은 상품번호 문구로 통일한다. 페이지 설명은 대부분 일반 문구라 도움이 적다.
    return isCoupangHost(start) ? { ...product, description: coupangNumberText(start) } : product;
  } catch (error) {
    // 쿠팡의 차단(403), 타임아웃, 비HTML 응답은 오류로 끊지 않고 주소에서 얻은 기본값을 돌려준다.
    if (isCoupangHost(start) && !isRejectedInput(error)) return coupangFallback(start);

    if (error instanceof ScrapeError) throw error;
    // 그 밖의 연결 실패도 같은 코드로 돌려준다. 시스템 전체는 계속 동작한다.
    throw new ScrapeError("fetch_failed", 502);
  } finally {
    clearTimeout(timer);
  }
}

// 입력 자체가 잘못된 경우(형식 오류, 내부망 주소)는 기본값으로 바꾸지 않는다.
function isRejectedInput(error: unknown): boolean {
  return error instanceof ScrapeError && (error.code === "invalid_url" || error.code === "blocked_url");
}

// 쿠팡 상품 주소의 productId를 뽑는다. /vp/products/123 또는 ?productId=123 형태를 본다.
function coupangProductId(url: URL): string | null {
  const match = /\/products\/(\d+)/.exec(url.pathname) ?? /[?&](?:productId|product_id)=(\d+)/.exec(url.search);
  return match ? match[1] : null;
}

// 페이지를 가져오지 못했을 때 쓰는 최소한의 상품 정보. 제목은 productId로 만든 임시 이름이다.
function coupangFallback(url: URL): ScrapedProduct {
  const id = coupangProductId(url);
  return {
    title: id ? `쿠팡 상품 #${id}` : "쿠팡 상품",
    description: coupangNumberText(url),
    image_url: null,
    price: null,
    partial: true,
  };
}

// "쿠팡상품번호: 상품ID - 옵션ID" 문구. 상품ID를 못 찾으면 "미확인"으로 적는다.
function coupangNumberText(url: URL): string {
  const productId = coupangProductId(url) ?? "미확인";
  const vendorItemId = /[?&](?:vendorItemId|itemId)=([0-9]+)/.exec(url.search)?.[1] ?? null;
  return `쿠팡상품번호: ${productId}${vendorItemId ? ` - ${vendorItemId}` : ""}`;
}

function isCoupangHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host === "coupang.com" || host.endsWith(".coupang.com");
}

// 모바일 Safari처럼 보이는 요청 헤더. 쿠팡(link.coupang.com 포함)에는 쿠팡 메인을 Referer로 붙인다.
function buildHeaders(url: URL): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
  };
  if (isCoupangHost(url)) headers.Referer = "https://www.coupang.com/";
  return headers;
}

async function fetchPage(start: URL, signal: AbortSignal): Promise<{ url: URL; html: string }> {
  let current = start;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current);

    const response = await fetch(current, {
      redirect: "manual",
      signal,
      headers: buildHeaders(current),
    });

    // 리다이렉트는 직접 따라가면서 매 단계마다 공인 주소인지 다시 확인한다.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new ScrapeError("fetch_failed", 502);
      current = new URL(location, current);
      continue;
    }

    if (!response.ok) throw new ScrapeError("fetch_failed", 502);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) throw new ScrapeError("not_html", 422);

    return { url: current, html: await readLimited(response, MAX_BODY_BYTES) };
  }

  throw new ScrapeError("fetch_failed", 502);
}

// 본문은 상한까지만 읽는다. 큰 파일을 통째로 받지 않기 위해서다.
async function readLimited(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Buffer[] = [];
  let total = 0;
  while (total < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);

  return Buffer.concat(chunks).subarray(0, limit).toString("utf8");
}

function extractProduct(html: string, baseUrl: URL): ScrapedProduct {
  return {
    title: clip(metaContent(html, ["og:title", "twitter:title"]) ?? titleTag(html), LINK_TITLE_MAX),
    description: clip(
      metaContent(html, ["og:description", "twitter:description", "description"]),
      LINK_DESCRIPTION_MAX,
    ),
    // 이미지: og → twitter → JSON-LD image 순서. 상대 경로는 최종 도착 주소(리다이렉트 이후) 기준으로 푼다.
    image_url:
      resolveHttpUrl(
        metaContent(html, ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]),
        baseUrl,
      ) ?? findJsonLdImage(html, baseUrl),
    price: clip(findPrice(html), PRICE_MAX),
  };
}

const META_TAG = /<meta\b[^>]*>/gi;

function metaContent(html: string, keys: string[]): string | null {
  for (const tag of html.match(META_TAG) ?? []) {
    const id = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (!keys.includes(id)) continue;
    const content = attr(tag, "content")?.trim();
    if (content) return content;
  }
  return null;
}

function attr(tag: string, name: string): string | null {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? "");
}

function titleTag(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? decodeEntities(match[1]).trim() : null;
}

// 가격: 메타 태그 → JSON-LD → 본문의 "원" 표기 순서로 찾는다. 본문 추정은 정확도가 낮으므로 사용자가 고칠 수 있게 한다.
function findPrice(html: string): string | null {
  const amount = metaContent(html, ["product:price:amount", "og:price:amount"]);
  if (amount) {
    return formatPrice(amount, metaContent(html, ["product:price:currency", "og:price:currency"]));
  }

  const jsonLd = findJsonLdPrice(html);
  if (jsonLd) return jsonLd;

  return findWonText(html);
}

const JSON_LD = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// 깨진 JSON 블록은 건너뛴다. 한 블록이 망가져도 나머지는 읽는다.
function readJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  for (const match of html.matchAll(JSON_LD)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // 무시
    }
  }
  return blocks;
}

function findJsonLdPrice(html: string): string | null {
  for (const block of readJsonLd(html)) {
    const price = priceFromJsonLd(block, 0);
    if (price) return price;
  }
  return null;
}

function findJsonLdImage(html: string, baseUrl: URL): string | null {
  for (const block of readJsonLd(html)) {
    const image = resolveHttpUrl(imageFromJsonLd(block, 0), baseUrl);
    if (image) return image;
  }
  return null;
}

// Product.image는 문자열, 배열, ImageObject(url/contentUrl) 중 하나일 수 있다. @graph 안쪽도 본다.
function imageFromJsonLd(node: unknown, depth: number): string | null {
  if (depth > 6) return null;

  if (typeof node === "string") return node;

  if (Array.isArray(node)) {
    for (const item of node) {
      const image = imageFromJsonLd(item, depth + 1);
      if (image) return image;
    }
    return null;
  }

  if (!isRecord(node)) return null;

  if (node["@type"] === "ImageObject") {
    const url = typeof node.url === "string" ? node.url : typeof node.contentUrl === "string" ? node.contentUrl : null;
    if (url) return url;
  }

  for (const key of ["image", "@graph"]) {
    if (!(key in node)) continue;
    const image = imageFromJsonLd(node[key], depth + 1);
    if (image) return image;
  }
  return null;
}

function priceFromJsonLd(node: unknown, depth: number): string | null {
  if (depth > 6) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const price = priceFromJsonLd(item, depth + 1);
      if (price) return price;
    }
    return null;
  }

  if (!isRecord(node)) return null;

  if (typeof node.price === "string" || typeof node.price === "number") {
    return formatPrice(String(node.price), typeof node.priceCurrency === "string" ? node.priceCurrency : null);
  }

  for (const value of Object.values(node)) {
    const price = priceFromJsonLd(value, depth + 1);
    if (price) return price;
  }
  return null;
}

function findWonText(html: string): string | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const match = /₩\s?(\d{1,3}(?:,\d{3})+|\d{4,})|(\d{1,3}(?:,\d{3})+|\d{4,})\s?원/.exec(text);
  if (!match) return null;
  return formatPrice(match[1] ?? match[2], "KRW");
}

function formatPrice(amount: string, currency: string | null): string | null {
  const value = Number(amount.replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;

  const code = currency?.trim().toUpperCase();
  if (!code || code === "KRW") return `${value.toLocaleString("ko-KR")}원`;
  return `${value.toLocaleString("en-US")} ${code}`;
}

function resolveHttpUrl(value: string | null, base: URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function clip(value: string | null, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
