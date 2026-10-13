import { NextRequest, NextResponse } from "next/server";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractAptShortName(fullName: string): string {
  // 예: "상계주공 14단지" -> "상계 14", "중계주공 3단지" -> "중계 3"
  const cleaned = fullName
    .replace(/주공/g, " ")
    .replace(/아파트/g, " ")
    .replace(/단지/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fullName;
}

/**
 * 공급자 맞춤형 PWA 동적 앱 아이콘 생성 API
 * GET /api/pwa/icon/[id]?type=APT|BIZ|CREATOR&name=...&size=512
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  // 1. 타입 파싱: 쿼리스트링 우선, 없을 시 ID 접두어로 추론
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

  // 2. 상호명 / 단지명 파싱
  let name = searchParams.get("name");
  if (!name) {
    if (id === "apt-sanggye14") name = "상계주공 14단지";
    else if (id === "apt-junggye03") name = "중계주공 3단지";
    else if (id === "store-nowon-roastery") name = "노원 로스터리";
    else if (id === "corp-topsonic") name = "(주)탑소닉";
    else if (id.startsWith("apt-")) {
      name = decodeURIComponent(id.replace("apt-", "")).toUpperCase() + " 단지";
    } else if (id.startsWith("store-") || id.startsWith("corp-")) {
      name = decodeURIComponent(id.replace("store-", "").replace("corp-", ""));
    } else {
      name = decodeURIComponent(id.replace(/^@/, ""));
    }
  }

  const safeName = escapeXml(name);
  const safeShortName = escapeXml(type === "APT" ? extractAptShortName(name) : name);

  let svgContent = "";

  if (type === "APT") {
    // =========================================================================
    // [APT 타입]
    // 다크 네이비(#0F172A) 배경 + 단지 약칭("상계 14") 중앙 화이트 볼드 타이포
    // + 골드 테두리(#F59E0B) + 하단 "공식 단지 홈" 캡션
    // =========================================================================
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- 다크 네이비(#0F172A) 배경 + 골드 테두리(stroke-width: 8) -->
  <rect width="512" height="512" rx="116" fill="#0F172A" stroke="url(#goldGrad)" stroke-width="8" />

  <!-- 상단 K-apt CERA 골드 뱃지 -->
  <g filter="url(#shadow)">
    <rect x="156" y="60" width="200" height="36" rx="18" fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" stroke-width="1.5" />
    <circle cx="178" cy="78" r="4.5" fill="#F59E0B" />
    <text x="262" y="84" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="14" font-weight="700" letter-spacing="1" text-anchor="middle">K-apt CERA 94 AAA</text>
  </g>

  <!-- 아파트 빌딩 미니 심볼 -->
  <g transform="translate(228, 122)" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <rect x="0" y="4" width="56" height="64" rx="4" />
    <line x1="14" y1="18" x2="22" y2="18" />
    <line x1="34" y1="18" x2="42" y2="18" />
    <line x1="14" y1="32" x2="22" y2="32" />
    <line x1="34" y1="32" x2="42" y2="32" />
    <line x1="22" y1="68" x2="34" y2="68" />
  </g>

  <!-- 중앙 단지 약칭 (예: "상계 14") 대형 화이트 볼드 타이포 -->
  <text x="256" y="275" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Malgun Gothic', sans-serif" font-size="58" font-weight="900" letter-spacing="-1.5" text-anchor="middle" filter="url(#shadow)">
    ${safeShortName}
  </text>

  <!-- 전체 단지 정식 명칭 서브 텍스트 -->
  <text x="256" y="322" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="20" font-weight="500" letter-spacing="0.5" text-anchor="middle">
    ${safeName}
  </text>

  <!-- 하단 "공식 단지 홈" 골드 캡션 -->
  <g transform="translate(146, 368)">
    <rect width="220" height="42" rx="21" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" stroke-width="1.5" />
    <text x="110" y="27" fill="#FBBF24" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="700" letter-spacing="2" text-anchor="middle">
      공식 단지 홈
    </text>
  </g>

  <!-- 최하단 서브 라벨 -->
  <text x="256" y="442" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="11" font-weight="600" letter-spacing="2" text-anchor="middle">
    TODAY LOCAL HYPERLINK
  </text>
</svg>`;
  } else if (type === "BIZ") {
    // =========================================================================
    // [BIZ 타입]
    // 퓨어 화이트(#FFFFFF) 배경 + 상호명/로고 심볼
    // + 우측 상단 녹색 인증(Verified) 체크 뱃지
    // =========================================================================
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="bizShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- 퓨어 화이트(#FFFFFF) 베이스 + 헤어라인 1줄 경계 -->
  <rect width="512" height="512" rx="116" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="4" />

  <!-- 중앙 상호명 로고 심볼 박스 -->
  <g filter="url(#bizShadow)">
    <rect x="196" y="96" width="120" height="120" rx="32" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2" />
    <text x="256" y="174" font-size="52" text-anchor="middle">🍽️</text>
  </g>

  <!-- 우측 상단 녹색 인증(Verified) 체크 뱃지 (#10B981) -->
  <g filter="url(#bizShadow)">
    <circle cx="410" cy="102" r="32" fill="#10B981" />
    <path d="M398 102l9 9 17-17" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- 상호명 중앙 볼드 타이포 -->
  <text x="256" y="286" fill="#0F172A" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', 'Malgun Gothic', sans-serif" font-size="40" font-weight="700" letter-spacing="-0.5" text-anchor="middle">
    ${safeName}
  </text>

  <!-- 캡션: 공식 비즈홈 -->
  <text x="256" y="334" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="19" font-weight="500" letter-spacing="2" text-anchor="middle">
    공식 비즈홈 · Verified
  </text>

  <!-- 하단 소진공·지자체 인허가 태그 -->
  <g transform="translate(146, 386)">
    <rect width="220" height="38" rx="19" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
    <circle cx="28" cy="19" r="4.5" fill="#059669" />
    <text x="124" y="24" fill="#047857" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="13" font-weight="600" text-anchor="middle">소진공 · 지자체 등록 완료</text>
  </g>
</svg>`;
  } else {
    // =========================================================================
    // [CREATOR 타입]
    // 웜그레이/소프트 배경(#F4F4F5) + 원형 프로필 프레임 + 👑 골드 엠버서더 미니 뱃지
    // =========================================================================
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- 웜그레이/소프트 배경(#F4F4F5) -->
  <rect width="512" height="512" rx="116" fill="#F4F4F5" stroke="#E4E4E7" stroke-width="4" />

  <!-- 원형 프로필 프레임 -->
  <g filter="url(#softShadow)">
    <circle cx="256" cy="184" r="84" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="4" />
    <circle cx="256" cy="184" r="72" fill="#E4E4E7" />
    <text x="256" y="202" font-size="48" text-anchor="middle">👤</text>
  </g>

  <!-- 👑 골드 엠버서더 미니 뱃지 (원형 프로필 우측 상단) -->
  <g filter="url(#softShadow)">
    <circle cx="316" cy="126" r="24" fill="#F59E0B" stroke="#FFFFFF" stroke-width="3.5" />
    <text x="316" y="134" font-size="16" text-anchor="middle">👑</text>
  </g>

  <!-- 크리에이터 닉네임 -->
  <text x="256" y="324" fill="#18181B" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="38" font-weight="700" letter-spacing="-0.5" text-anchor="middle">
    ${safeName}
  </text>

  <!-- 골드 엠버서더 캡션 -->
  <text x="256" y="366" fill="#D97706" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="18" font-weight="600" letter-spacing="1" text-anchor="middle">
    LinkPick 골드 엠버서더
  </text>

  <!-- 하단 1-Tap 모바일 허브 태그 -->
  <g transform="translate(156, 404)">
    <rect width="200" height="34" rx="17" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="1.5" />
    <text x="100" y="22" fill="#71717A" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="12" font-weight="600" letter-spacing="0.5" text-anchor="middle">1-TAP MOBILE HUB</text>
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
