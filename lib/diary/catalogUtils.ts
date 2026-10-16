/** T.홈페이지 B2B 카탈로그 — 공급가(원가) → 판매가(200%) 계산 및 기본 스펙 상수 */

/** 판매가 = 공급가 * 2.0 (200%) */
export function calcSellPrice(costPrice: number): number {
  return Math.round(costPrice * 2);
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
