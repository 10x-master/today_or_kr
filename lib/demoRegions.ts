import type { Region } from "@/types/local";

/** 모바일 데모 화면에서 선택 가능한 행정동 목록 (노원구 핵심 생활권 및 주요 지역) */
export const DEMO_REGIONS: Region[] = [
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "상계동",
    code: "1135010500",
    lat: 37.6598,
    lng: 127.0774,
  },
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "중계동",
    code: "1135010600",
    lat: 37.6495,
    lng: 127.0768,
  },
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "하계동",
    code: "1135010300",
    lat: 37.6366,
    lng: 127.0673,
  },
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "공릉동",
    code: "1135010200",
    lat: 37.6257,
    lng: 127.0729,
  },
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "월계동",
    code: "1135010100",
    lat: 37.6225,
    lng: 127.0589,
  },
  {
    sido: "전라남도",
    gugun: "여수시",
    dong: "돌산읍",
    code: "4613025000",
    lat: 34.6797,
    lng: 127.7483,
  },
];

export const DEFAULT_REGION: Region = DEMO_REGIONS[0];

/** 동 이름으로 Region 객체 조회 또는 동적 생성 */
export function getRegionByDongName(rawDong: string): Region {
  if (!rawDong) return DEFAULT_REGION;
  let decoded = "";
  try {
    decoded = decodeURIComponent(rawDong).trim();
  } catch {
    decoded = rawDong.trim();
  }

  // 정확한 매칭
  const exact = DEMO_REGIONS.find((r) => r.dong === decoded);
  if (exact) return exact;

  // '동', '읍', '면' 접미사 유무 매칭 (예: '상계' -> '상계동')
  const partial = DEMO_REGIONS.find(
    (r) => r.dong.replace(/(동|읍|면)$/, "") === decoded.replace(/(동|읍|면)$/, "")
  );
  if (partial) return partial;

  // 동적 생성 (기본 서울특별시 노원구)
  const normalizedDong =
    decoded.endsWith("동") || decoded.endsWith("읍") || decoded.endsWith("면")
      ? decoded
      : `${decoded}동`;

  return {
    sido: "서울특별시",
    gugun: "노원구",
    dong: normalizedDong,
    code: "1135010500",
    lat: 37.6598,
    lng: 127.0774,
  };
}
