import { NextRequest, NextResponse } from "next/server";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 공급자별 PWA 동적 앱 아이콘 생성 API
 * GET /api/pwa/icon/[id]?type=APT|BIZ|CREATOR&name=...&size=512
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  // 타입 결정: 쿼리 파라미터 우선, 없을 시 id 접두어로 추론
  let type = searchParams.get("type")?.toUpperCase();
  if (!type || !["APT", "BIZ", "CREATOR"].includes(type)) {
    if (id.startsWith("apt-")) {
      type = "APT";
    } else if (id.startsWith("creator-") || id.startsWith("ambassador-") || id.startsWith("@")) {
      type = "CREATOR";
    } else {
      type = "BIZ";
    }
  }

  // 상호명/단지명 결정
  let name = searchParams.get("name");
  if (!name) {
    if (id === "apt-sanggye14") name = "상계주공 14단지";
    else if (id === "apt-junggye03") name = "중계주공 3단지";
    else if (id === "store-nowon-roastery") name = "노원 로스터리";
    else if (id === "corp-topsonic") name = "(주)탑소닉";
    else if (id.startsWith("apt-")) {
      name = decodeURIComponent(id.replace("apt-", "")).toUpperCase();
    } else if (id.startsWith("store-") || id.startsWith("corp-")) {
      name = decodeURIComponent(id.replace("store-", "").replace("corp-", ""));
    } else {
      name = decodeURIComponent(id.replace(/^@/, ""));
    }
  }

  const safeName = escapeXml(name);
  const safeId = escapeXml(id);

  let svgContent = "";

  if (type === "APT") {
    // [A형: 아파트 단지 공식 앱 아이콘]
    // 다크 네이비 배경 + 단지명 중앙 배치 + '공식 단지 홈' 캡션
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- 다크 네이비 라운드 스퀘어 배경 -->
  <rect width="512" height="512" rx="116" fill="url(#navyGrad)" />

  <!-- 건축 그리드 엠블럼 백그라운드 라인 -->
  <g opacity="0.12" stroke="#ffffff" stroke-width="1.5">
    <line x1="80" y1="180" x2="432" y2="180" />
    <line x1="80" y1="360" x2="432" y2="360" />
    <line x1="160" y1="120" x2="160" y2="420" />
    <line x1="352" y1="120" x2="352" y2="420" />
  </g>

  <!-- 상단 CERA 공인 단지 뱃지 -->
  <g filter="url(#shadow)">
    <rect x="156" y="68" width="200" height="38" rx="19" fill="#0f172a" stroke="url(#goldAccent)" stroke-width="2" />
    <circle cx="178" cy="87" r="5" fill="#f59e0b" />
    <text x="262" y="93" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="15" font-weight="700" letter-spacing="1" text-anchor="middle">K-apt CERA 94 AAA</text>
  </g>

  <!-- 중앙 아파트 단지 아이콘 -->
  <g transform="translate(224, 136)" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <rect x="0" y="8" width="64" height="72" rx="4" />
    <line x1="16" y1="24" x2="24" y2="24" />
    <line x1="40" y1="24" x2="48" y2="24" />
    <line x1="16" y1="40" x2="24" y2="40" />
    <line x1="40" y1="40" x2="48" y2="40" />
    <line x1="24" y1="80" x2="40" y2="80" />
  </g>

  <!-- 단지명 텍스트 -->
  <text x="256" y="292" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Malgun Gothic', sans-serif" font-size="44" font-weight="700" letter-spacing="-1" text-anchor="middle" filter="url(#shadow)">
    ${safeName}
  </text>

  <!-- 캡션: 공식 단지 홈 -->
  <text x="256" y="342" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="500" letter-spacing="3" text-anchor="middle">
    공식 단지 홈
  </text>

  <!-- 하단 Today 로컬 OS 서브 라벨 -->
  <g transform="translate(166, 396)">
    <rect width="180" height="32" rx="16" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
    <text x="90" y="21" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="600" letter-spacing="1.5" text-anchor="middle">TODAY. HYPERLOCAL</text>
  </g>
</svg>`;
  } else if (type === "BIZ") {
    // [B형: 일반 상점 및 회원사 비즈 홈 아이콘]
    // 화이트 배경 + 상호명/로고 + 우측 상단 녹색 인증(Verified) 뱃지
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="bizShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.08" />
    </filter>
    <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
  </defs>

  <!-- 화이트 베이스 + 미세 테두리 -->
  <rect width="512" height="512" rx="116" fill="url(#whiteGrad)" stroke="#e2e8f0" stroke-width="4" />

  <!-- 중앙 엠블럼 박스 -->
  <g filter="url(#bizShadow)">
    <rect x="196" y="96" width="120" height="120" rx="32" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2" />
    <text x="256" y="174" font-size="52" text-anchor="middle">🍽️</text>
  </g>

  <!-- 우측 상단 녹색 공식 인증(Verified) 뱃지 -->
  <g filter="url(#bizShadow)">
    <circle cx="410" cy="102" r="32" fill="#10b981" />
    <path d="M398 102l9 9 17-17" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- 상호명 -->
  <text x="256" y="286" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Malgun Gothic', sans-serif" font-size="38" font-weight="700" letter-spacing="-0.5" text-anchor="middle">
    ${safeName}
  </text>

  <!-- 캡션: 공식 비즈홈 -->
  <text x="256" y="334" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="19" font-weight="500" letter-spacing="2" text-anchor="middle">
    공식 비즈홈 · Verified
  </text>

  <!-- 하단 지자체 인허가 인증 태그 -->
  <g transform="translate(146, 386)">
    <rect width="220" height="36" rx="18" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5" />
    <circle cx="28" cy="18" r="4" fill="#059669" />
    <text x="124" y="23" fill="#047857" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="600" text-anchor="middle">소진공 · 지자체 등록 완료</text>
  </g>
</svg>`;
  } else {
    // [C형: 크리에이터 및 엠버서더 LinkPick 아이콘]
    // 프로필 원형 프레임 + 👑 엠버서더 뱃지 + 네온 앰버 그라디언트
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="creatorBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#creatorBg)" />

  <!-- 외부 그라디언트 링 -->
  <circle cx="256" cy="180" r="92" fill="none" stroke="url(#crownGrad)" stroke-width="6" opacity="0.8" />
  <circle cx="256" cy="180" r="82" fill="#27272a" />

  <!-- 👑 엠버서더 뱃지 & 아이콘 -->
  <text x="256" y="196" font-size="64" text-anchor="middle" filter="url(#glow)">👑</text>

  <!-- 크리에이터 닉네임 / 핸들 -->
  <text x="256" y="320" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="40" font-weight="700" letter-spacing="-0.5" text-anchor="middle">
    ${safeName}
  </text>

  <!-- 공식 캡션 -->
  <text x="256" y="366" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="600" letter-spacing="1" text-anchor="middle">
    LinkPick 공식 엠버서더
  </text>

  <!-- 하단 1-Tap 허브 태그 -->
  <g transform="translate(156, 404)">
    <rect width="200" height="34" rx="17" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="1.5" />
    <text x="100" y="22" fill="#fde68a" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="600" letter-spacing="0.5" text-anchor="middle">1-TAP MOBILE HUB</text>
  </g>
</svg>`;
  }

  return new NextResponse(svgContent, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
