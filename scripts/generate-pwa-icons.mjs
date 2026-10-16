/**
 * today. 공식 웹아이콘(파비콘/PWA/애플 터치 아이콘) 생성 스크립트 v6
 *
 * 순백색 배경(#FFFFFF) 중앙에 [차콜 소문자 't' (#1E232E) + 원본 비례 블루닷 (#2066FF)]를
 * 단독 배치한 공식 심볼을 192/512 PWA 아이콘, apple-touch-icon(180x180), favicon.ico(16/32/48)로
 * 래스터화한다. 이전 버전(v4 다크+골드링+대문자T, v5 블루배경+오렌지체크뱃지)은 공식 CI가
 * 아니므로 전면 폐기하고, components/brand/TodayLogo.tsx의 TodayAppIcon과 동일한 좌표/비율로
 * 구현한 버전.
 *
 * 실행: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "..", "public", "icons");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const BG = "#FFFFFF";
const FG = "#1E232E";
const DOT = "#2066FF";
/** 블루닷 직경 / 't' 높이(fontSize) 비율 — components/brand/TodayLogo.tsx와 동일한 원본 비례 */
const DOT_DIAMETER_RATIO = 0.3;

// 32-unit viewBox 기준 비율 (TodayAppIcon.tsx와 동일 좌표계)
function buildSvg(size) {
  const scale = size / 32;
  const rx = 11 * scale;
  const fontSize = 20 * scale;
  const textX = 12.5 * scale;
  const textY = 23 * scale;
  const dotR = (fontSize * DOT_DIAMETER_RATIO) / 2;
  const dotCx = 21.2 * scale;
  const dotCy = 19.4 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${BG}" />
  <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-weight="800" font-size="${fontSize}" fill="${FG}" text-anchor="middle">t</text>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="${DOT}" />
</svg>`;
}

// apple-touch-icon: iOS가 자체적으로 마스킹하므로 모서리 없이 풀블리드 정사각으로 생성
function buildAppleSvg(size) {
  const scale = size / 32;
  const fontSize = 20 * scale;
  const textX = 12.5 * scale;
  const textY = 23 * scale;
  const dotR = (fontSize * DOT_DIAMETER_RATIO) / 2;
  const dotCx = 21.2 * scale;
  const dotCy = 19.4 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" fill="${BG}" />
  <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-weight="800" font-size="${fontSize}" fill="${FG}" text-anchor="middle">t</text>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="${DOT}" />
</svg>`;
}

async function main() {
  // 1. PWA 아이콘 (192 / 512) — 기존 참조 경로(public/icons/today-*.png) 유지
  for (const size of [192, 512]) {
    const svg = buildSvg(size);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = path.join(ICONS_DIR, `today-${size}.png`);
    writeFileSync(outPath, png);
    console.log(`생성 완료: ${outPath} (${png.length} bytes)`);
  }

  // 2. apple-touch-icon.png (180x180, iOS 표준 사이즈)
  const appleSvg = buildAppleSvg(180);
  const applePng = await sharp(Buffer.from(appleSvg)).png().toBuffer();
  const applePath = path.join(PUBLIC_DIR, "apple-touch-icon.png");
  writeFileSync(applePath, applePng);
  console.log(`생성 완료: ${applePath} (${applePng.length} bytes)`);

  // 3. favicon.ico (16 / 32 / 48 멀티 해상도)
  const faviconPngs = await Promise.all(
    [16, 32, 48].map(async (size) => sharp(Buffer.from(buildSvg(size))).png().toBuffer())
  );
  const icoBuffer = await pngToIco(faviconPngs);
  const icoPath = path.join(PUBLIC_DIR, "favicon.ico");
  writeFileSync(icoPath, icoBuffer);
  console.log(`생성 완료: ${icoPath} (${icoBuffer.length} bytes)`);
}

main();
