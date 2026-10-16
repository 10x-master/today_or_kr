/**
 * Today. 공식 모바일(PWA) 앱 아이콘 생성 스크립트 v4
 *
 * 다크 배경(#0F172A) + 외곽 옐로우/골드 발광 링(#FACC15 → #F59E0B) +
 * 중앙에 크게 부각되는 볼드 화이트 대문자 'T' + 시그니처 블루 닷(#3B82F6)을
 * 192x192 / 512x512 PNG로 래스터화한다. 이 아이콘은 모바일 홈 화면 바로가기(PWA) 전용이며,
 * 앱 내 데스크톱 헤더/사이드바에는 사용하지 않는다(워드마크만 노출).
 *
 * 실행: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

const BG = "#0F172A";
const FG = "#FFFFFF";
const DOT = "#3B82F6";
const GLOW_FROM = "#FACC15";
const GLOW_TO = "#F59E0B";

// 32-unit viewBox 기준 비율
function buildSvg(size) {
  const scale = size / 32;
  const rxOuter = 11 * scale;
  const ringThickness = 1.6 * scale;
  const rxInner = Math.max(rxOuter - ringThickness, 0);
  // 대문자 'T'를 더 크고 볼드하게 중앙 부각
  const fontSize = 27 * scale;
  const textX = 13.5 * scale;
  const textY = 24.5 * scale;
  const dotCx = 24 * scale;
  const dotCy = 22.5 * scale;
  const dotR = 3.4 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GLOW_FROM}" />
      <stop offset="100%" stop-color="${GLOW_TO}" />
    </linearGradient>
  </defs>
  <!-- 외곽 옐로우/골드 그라데이션 발광 링 (스마트폰 화면 시인성 강화) -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rxOuter}" fill="url(#glowRing)" />
  <!-- 다크 배경 (링 안쪽으로 살짝 인셋되어 테두리 링이 드러나도록) -->
  <rect x="${ringThickness}" y="${ringThickness}" width="${size - 2 * ringThickness}" height="${size - 2 * ringThickness}" rx="${rxInner}" fill="${BG}" />
  <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-weight="800" font-size="${fontSize}" fill="${FG}" text-anchor="middle">T</text>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="${DOT}" />
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
