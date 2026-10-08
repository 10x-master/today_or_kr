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

/** 로컬 피드 채널 (블라인드 스타일 하이퍼로컬 커뮤니티 채널) */
export type LocalPickCategory =
  | "notice" // 📢 지자체·공지
  | "meetup" // 👥 동네소모임·클럽
  | "talk" // ☕ 자유토크·잡담
  | "flash" // ⚡ 번개·나눔
  | "tip"; // 💡 동네질문·꿀팁

/** 게시글 유입 채널 (2-트랙: GPS 기반 모바일 웹 / 카카오톡 제보) */
export type LocalPostSourceChannel =
  | "kakao_channel" // 카톡 제보
  | "mobile_web" // 웹 직접등록
  | "official_gov"; // 지자체 공공

/** 등록 주체(게시자) 카테고리 */
export type AuthorRole =
  | "gov" // 지자체·공공기관
  | "ngo" // 시민·사회단체
  | "biz" // 기업·소상공인
  | "club" // 동호회·소모임
  | "user"; // 개인·주민

export interface LocalPostAuthor {
  id: string;
  name: string;
  /** 협회회원사 여부 */
  isPartner: boolean;
  badge?: string;
  role: AuthorRole;
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
  commentCount: number;
  createdAt: string;
}
