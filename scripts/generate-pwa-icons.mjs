/**
 * today. 공식 모바일(PWA) 앱 아이콘 생성 스크립트 v5
 *
 * 블루 라운드 큐브 배경(#3B82F6) + 중앙의 화이트 소문자 't' + 하단 우측 오렌지 체크(✓) 뱃지를
 * 192x192 / 512x512 PNG로 래스터화한다. 이전 버전(v4)의 다크 배경 + 골드 발광 링 + 대문자 'T'
 * 디자인은 공식 CI가 아니므로 전면 폐기하고, 공식 소문자 CI로 복원한 버전.
 *
 * 실행: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

const BG = "#3B82F6";
const FG = "#FFFFFF";
const BADGE_BG = "#F97316";
const BADGE_CHECK = "#FFFFFF";

// 32-unit viewBox 기준 비율
function buildSvg(size) {
  const scale = size / 32;
  const rx = 11 * scale;
  const fontSize = 20 * scale;
  const textX = 12.5 * scale;
  const textY = 23 * scale;
  const badgeCx = 24 * scale;
  const badgeCy = 23.5 * scale;
  const badgeR = 6 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- 블루 라운드 큐브 배경 -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${BG}" />
  <!-- 중앙 화이트 소문자 't' -->
  <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-weight="800" font-size="${fontSize}" fill="${FG}" text-anchor="middle">t</text>
  <!-- 하단 우측 오렌지 체크(완료/인증) 뱃지 -->
  <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="${BADGE_BG}" stroke="${BG}" stroke-width="${1.6 * scale}" />
  <path d="M ${badgeCx - 2.9 * scale} ${badgeCy} L ${badgeCx - 0.8 * scale} ${badgeCy + 2 * scale} L ${badgeCx + 3.2 * scale} ${badgeCy - 2.6 * scale}" stroke="${BADGE_CHECK}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

async function main() {
  for (const size of [192, 512]) {
    const svg = buildSvg(size);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = path.join(OUT_DIR, `today-${size}.png`);
    writeFileSync(outPath, png);
    console.log(`생성 완료: ${outPath} (${png.length} bytes)`);
  }
}

main();
