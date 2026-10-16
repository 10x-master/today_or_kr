import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const SITE_ORIGIN = "https://today.or.kr";

/**
 * B2B 인쇄용 QR 생성 API — 오프라인 인쇄 다이어리/탁상달력에 부착할 today.or.kr/t-diary?brand=xxx QR 발급
 * GET /api/t-diary/qr?brand=aptlink&format=svg|png&size=1200&download=1
 *
 * - format=svg(기본): 인쇄 시 무한 확대해도 깨지지 않는 벡터 QR
 * - format=png: size px 정사각형 래스터 QR (기본 1200px = 300DPI 기준 4×4inch/10.16cm 인쇄 규격)
 */
export async function GET(request: NextRequest) {
  const brandSlug = request.nextUrl.searchParams.get("brand");
  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const size = Math.min(Math.max(Number(request.nextUrl.searchParams.get("size")) || 1200, 200), 4000);
  const download = request.nextUrl.searchParams.get("download") === "1";

  if (!brandSlug) {
    return NextResponse.json({ error: "brand가 필요합니다." }, { status: 400 });
  }

  const targetUrl = `${SITE_ORIGIN}/t-diary?brand=${encodeURIComponent(brandSlug)}`;
  const fileBase = `${brandSlug}-tdiary-qr`;

  try {
    if (format === "png") {
      const buffer = await QRCode.toBuffer(targetUrl, {
        type: "png",
        margin: 2,
        width: size,
        errorCorrectionLevel: "H",
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          ...(download ? { "Content-Disposition": `attachment; filename="${fileBase}-300dpi.png"` } : {}),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin: 2,
      width: size,
      errorCorrectionLevel: "H",
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        ...(download ? { "Content-Disposition": `attachment; filename="${fileBase}.svg"` } : {}),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("QR generation failed:", err);
    return NextResponse.json({ error: "QR 코드 생성에 실패했습니다." }, { status: 500 });
  }
}
