// 파트너 멀티링크(user_links) 관련 타입과 순수 함수. DB 접근은 각 컴포넌트에서 한다.
// (LinkPick 프로젝트에서 이식)

export const PLATFORM_TYPES = ["coupang", "tiktok", "smartstore", "deal", "custom"] as const;
export type PlatformType = (typeof PLATFORM_TYPES)[number];

export const platformTypeLabel: Record<PlatformType, string> = {
  coupang: "쿠팡",
  tiktok: "틱톡",
  smartstore: "스마트스토어",
  deal: "B2B 딜",
  custom: "기타 링크",
};

export type UserLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  // 썸네일 이미지 주소와 표시용 가격 문구. 없으면 null이고, 카드는 텍스트 중심으로 그린다.
  image_url: string | null;
  price: string | null;
  platform_type: PlatformType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

// 공개 페이지에 노출되는 필드만 가진 링크 한 줄 (partner_page 함수의 결과).
export type PublicLink = Pick<
  UserLink,
  "id" | "title" | "url" | "description" | "image_url" | "price" | "platform_type"
> & {
  // 카테고리 탭 필터와 추천픽 코너에 쓴다. 없으면 null·false.
  category: string | null;
  is_featured: boolean;
};

export type PartnerPage = {
  name: string | null;
  links: PublicLink[];
};

export const LINK_TITLE_MAX = 40;
export const LINK_DESCRIPTION_MAX = 80;
export const LINK_URL_MAX = 500;

export function isPlatformType(value: unknown): value is PlatformType {
  return typeof value === "string" && (PLATFORM_TYPES as readonly string[]).includes(value);
}

// 링크 카드의 href는 http(s)만 허용한다. javascript: 같은 주소가 들어와도 열리지 않게 막는다.
// 직접 올린 이미지는 썸네일용으로 줄인 data URL로 저장한다. 용량을 제한해서 DB 행이 커지지 않게 한다.
export const MAX_DATA_IMAGE_LENGTH = 300_000;
const DATA_IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

// 썸네일 주소: http(s) 주소이거나, 제한 크기 안의 이미지 data URL이어야 한다.
export function isSafeImageSrc(value: string): boolean {
  if (value.startsWith("data:")) {
    return value.length <= MAX_DATA_IMAGE_LENGTH && DATA_IMAGE.test(value);
  }
  return isSafeHttpUrl(value);
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// 사용자가 "쿠팡"처럼 도메인만 적어도 열리도록 https://를 붙인다.
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// RPC·테이블에서 받은 값을 검사해 PublicLink로 바꾼다. 형식이 맞지 않으면 null (그 줄만 건너뛴다).
export function parsePublicLink(value: unknown): PublicLink | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.url !== "string") {
    return null;
  }
  if (!isPlatformType(value.platform_type)) return null;

  return {
    id: value.id,
    title: value.title,
    url: value.url,
    description: typeof value.description === "string" ? value.description : null,
    // 컬럼 추가 전 행이나 응답에 없는 필드는 null로 본다.
    image_url: typeof value.image_url === "string" && value.image_url ? value.image_url : null,
    price: typeof value.price === "string" && value.price ? value.price : null,
    platform_type: value.platform_type,
    category: typeof value.category === "string" && value.category ? value.category : null,
    is_featured: value.is_featured === true,
  };
}

// partner_page 함수의 jsonb 결과를 검사한다. 객체가 아니거나 null이면 null을 돌려준다.
export function parsePartnerPage(value: unknown): PartnerPage | null {
  if (!isRecord(value)) return null;

  const rawLinks = Array.isArray(value.links) ? value.links : [];
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name : null,
    links: rawLinks.flatMap((item) => {
      const link = parsePublicLink(item);
      return link ? [link] : [];
    }),
  };
}
