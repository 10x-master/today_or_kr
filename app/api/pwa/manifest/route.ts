import { NextRequest, NextResponse } from "next/server";

/**
 * 공급자/비즈홈 맞춤 동적 PWA Web App Manifest API
 * GET /api/pwa/manifest?bizId={id}&ref={userId}
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bizId = searchParams.get("bizId") || searchParams.get("id") || "today-main";
  const ref = searchParams.get("ref") || "";

  const isApt = bizId.startsWith("apt-");
  const isCreator =
    bizId.startsWith("creator-") || bizId.startsWith("ambassador-") || bizId.startsWith("@");
  const type = isApt ? "APT" : isCreator ? "CREATOR" : "BIZ";

  // 기본 상호명/단지명 결정
  let rawName = searchParams.get("name");
  if (!rawName) {
    if (bizId === "apt-sanggye14") rawName = "상계주공 14단지";
    else if (bizId === "apt-junggye03") rawName = "중계주공 3단지";
    else if (bizId === "store-nowon-roastery") rawName = "노원 로스터리";
    else if (bizId === "corp-topsonic") rawName = "(주)탑소닉";
    else if (isApt) {
      rawName = decodeURIComponent(bizId.replace("apt-", "")).toUpperCase() + " 단지";
    } else if (isCreator) {
      rawName = decodeURIComponent(bizId.replace(/^@/, "")) + " 파트너";
    } else {
      rawName = decodeURIComponent(bizId.replace("store-", "").replace("corp-", ""));
    }
  }

  const name = `${rawName} 공식 비즈홈`;
  const shortName = rawName.slice(0, 12);

  const startUrl = isCreator
    ? `/p/${encodeURIComponent(bizId)}?ref=${encodeURIComponent(ref)}&subId=${encodeURIComponent(ref)}&installed=pwa`
    : `/biz/${encodeURIComponent(bizId)}?ref=${encodeURIComponent(ref)}&subId=${encodeURIComponent(ref)}&installed=pwa`;

  const icon192 = `/api/pwa/icon/${encodeURIComponent(bizId)}?size=192&name=${encodeURIComponent(rawName)}&type=${type}`;
  const icon512 = `/api/pwa/icon/${encodeURIComponent(bizId)}?size=512&name=${encodeURIComponent(rawName)}&type=${type}`;

  const manifest = {
    name,
    short_name: shortName,
    description: `${rawName}의 실시간 공지, 공구 현황 및 맞춤 견적 서비스를 홈 화면에서 1-Tap으로 이용하세요.`,
    start_url: startUrl,
    display: "standalone",
    orientation: "portrait",
    background_color: isApt ? "#0f172a" : "#ffffff",
    theme_color: isApt ? "#0f172a" : "#ffffff",
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable any",
      },
    ],
    categories: ["business", "productivity", "shopping"],
    shortcuts: [
      {
        name: "맞춤 견적서 신청",
        short_name: "견적 신청",
        url: `${startUrl}&action=estimate`,
        icons: [{ src: icon192, sizes: "192x192" }],
      },
      {
        name: "단지 공구 리스트",
        short_name: "공구 리스트",
        url: `${startUrl}&action=groupbuy`,
        icons: [{ src: icon192, sizes: "192x192" }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
