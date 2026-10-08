/**
 * 전국 로컬 피드(GPS/카카오톡 2-트랙) 관련 타입 정의
 */

/** 행정동 메타데이터 (법정동코드 기반) */
export interface Region {
  sido: string;
  gugun: string;
  dong: string;
  /** 법정동코드 (10자리) */
  code: string;
  lat: number;
  lng: number;
}

/** 로컬 피드 카테고리 */
export type LocalPickCategory =
  | "notice" // 지자체 공지/행정 안내
  | "festival" // 축제/행사
  | "spot" // 명소/여행
  | "food" // 특산물/맛집
  | "activity" // 체험/공방
  | "welfare" // 안심복지
  | "repair" // 동네수리
  | "business"; // 소상공인

/** 게시글 유입 채널 (2-트랙: GPS 기반 모바일 웹 / 카카오톡 제보) */
export type LocalPostSourceChannel =
  | "kakao_channel" // 카톡 제보
  | "mobile_web" // 웹 직접등록
  | "official_gov"; // 지자체 공공

export interface LocalPostAuthor {
  id: string;
  name: string;
  /** 협회회원사 여부 */
  isPartner: boolean;
  badge?: string;
}

export interface LocalPost {
  id: string;
  region: Region;
  category: LocalPickCategory;
  title: string;
  content: string;
  /** WebP 압축 이미지 URL */
  images: string[];
  sourceChannel: LocalPostSourceChannel;
  author: LocalPostAuthor;
  /** 접수 마감일 또는 진행 기간 표시용 (예: "~10/31 접수", "10/18(일) 1일") */
  noticePeriod?: string;
  /** 누적 신고수 */
  reportCount: number;
  /** reportCount >= 3 이면 true (자동 블라인드 플래그) */
  isBlinded: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
}
