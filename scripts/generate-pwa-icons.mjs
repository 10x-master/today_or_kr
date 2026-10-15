/**
 * Today. 공식 PWA 앱 아이콘 생성 스크립트
 *
 * components/brand/TodayLogo.tsx 의 TodayAppIcon(theme="light")과 동일한 비율로
 * 스퀴클 배경(#0F172A) + 화이트 't' + 블루 닷(#3B82F6)을 192x192 / 512x512 PNG로 래스터화한다.
 * 브랜드가 바뀌면 이 스크립트를 다시 실행해 public/icons/today-*.png 를 갱신하면 된다.
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

// 32-unit viewBox 기준 비율 (components/brand/TodayLogo.tsx TodayAppIcon과 동일)
function buildSvg(size) {
  const scale = size / 32;
  const rx = 11 * scale;
  const textX = 11.5 * scale;
  const textY = 22.5 * scale;
  const fontSize = 17 * scale;
  const dotCx = 21.5 * scale;
  const dotCy = 20.5 * scale;
  const dotR = 2.4 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${BG}" />
  <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-weight="800" font-size="${fontSize}" fill="${FG}" text-anchor="middle">t</text>
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
