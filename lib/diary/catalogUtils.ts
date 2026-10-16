/** T.홈페이지 B2B 카탈로그 — 내부 원가 기반 권장판매가 제안, 구글드라이브 이미지 변환, 기본 스펙 상수 */

/**
 * 관리자 콘솔에서 원가 입력 시 띄워주는 "제안 판매가" 계산용 (내부 전용).
 * 실제 저장되는 sell_price(권장소비자가)는 관리자가 이 값을 그대로 쓰거나 직접 수정할 수 있다.
 * 고객/딜러 화면에는 이 배율이나 원가가 절대 노출되지 않는다.
 */
export function suggestSellPrice(costPrice: number): number {
  return Math.round(costPrice * 2);
}

/**
 * 구글 드라이브 공유 링크를 고화질 직접 호스팅 URL로 변환.
 * https://drive.google.com/file/d/{FILE_ID}/view... -> https://lh3.googleusercontent.com/d/{FILE_ID}
 * https://drive.google.com/open?id={FILE_ID} -> 위와 동일하게 변환
 * 그 외 URL(또는 빈 값)은 그대로 반환.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  return trimmed;
}

export const DEFAULT_COVER_SIZE = "커버 124×180mm / 123×185mm";
export const DEFAULT_PAGE_COUNT = 256;
export const DEFAULT_MATERIAL_INFO = "이태리 습식 원단";
export const PRINT_METHOD_INFO =
  "금박 · 은박 · 형압(박) 인쇄 지원 — 200부 이상 주문 시 로고 각인 비용 무료";

/** hex 색상을 ratio(0~1)만큼 어둡게 */
export function darkenHex(hex: string, ratio: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.substring(0, 2), 16);
  const g = parseInt(n.substring(2, 4), 16);
  const b = parseInt(n.substring(4, 6), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r * (1 - ratio))}${toHex(g * (1 - ratio))}${toHex(b * (1 - ratio))}`;
}

/** hex 색상을 ratio(0~1)만큼 밝게 */
export function lightenHex(hex: string, ratio: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.substring(0, 2), 16);
  const g = parseInt(n.substring(2, 4), 16);
  const b = parseInt(n.substring(4, 6), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r + (255 - r) * ratio)}${toHex(g + (255 - g) * ratio)}${toHex(b + (255 - b) * ratio)}`;
}
