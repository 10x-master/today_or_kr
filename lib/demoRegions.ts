import type { Region } from "@/types/local";

/** 모바일 데모 화면에서 선택 가능한 행정동 목록 (목업 시드와 동일) */
export const DEMO_REGIONS: Region[] = [
  {
    sido: "서울특별시",
    gugun: "노원구",
    dong: "상계동",
    code: "1135010300",
    lat: 37.6598,
    lng: 127.0774,
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
