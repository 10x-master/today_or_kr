export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/** 유튜브 단축(youtu.be)/일반/shorts/embed 링크 모두에서 video id를 추출 */
export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** 본문 텍스트에서 첫 번째 URL을 "신청 링크" CTA 용으로 추출 */
export function extractFirstUrl(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s)]+/);
  return m ? m[0] : null;
}
