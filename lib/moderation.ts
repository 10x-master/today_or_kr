/** 기본 금칙어 1차 필터링 (성인/대출/도박 등) */
const BANNED_WORDS = [
  "성인",
  "대출",
  "도박",
  "조건만남",
  "불법촬영",
  "카지노",
  "토토",
  "불법대출",
  "성매매",
];

export function containsBannedWords(...texts: string[]): boolean {
  const combined = texts.join(" ");
  return BANNED_WORDS.some((word) => combined.includes(word));
}
