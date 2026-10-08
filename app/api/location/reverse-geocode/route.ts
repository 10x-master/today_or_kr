import { NextRequest, NextResponse } from "next/server";
import { findNearestRegion } from "@/lib/geo";

/** GPS 좌표 -> 행정동 변환 목업 (GET /api/location/reverse-geocode?lat=&lng=) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const lat = latParam !== null ? Number(latParam) : NaN;
  const lng = lngParam !== null ? Number(lngParam) : NaN;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat, lng 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const region = findNearestRegion(lat, lng);
  return NextResponse.json({ region });
}
