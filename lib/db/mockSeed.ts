import type { LocalPost, Region } from "@/types/local";
import type { DonationCampaign, LinkPickProduct } from "@/types/commerce";
import type { CommissionLedgerEntry, UserProfile } from "@/types/auth";

/** 법정동코드 기반 샘플 행정동 */
export const mockRegions: Region[] = [
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

const [sanggyeDong, dolsanEup] = mockRegions;

export const mockUsers: UserProfile[] = [
  {
    id: "user-001",
    kakaoId: "kakao-10234567",
    name: "박노원",
    phone: "010-1234-5678",
    email: "nowon.park@example.com",
    registeredDong: "상계동",
    age: 58,
    referrerCode: "NOWON001",
    pathHierarchy: [],
    consents: {
      terms: true,
      thirdPartyFinancialLead: false,
    },
    membershipTier: "association_regular",
    tenXPoints: 0,
  },
  {
    id: "user-002",
    kakaoId: "kakao-10987654",
    name: "이돌산",
    phone: "010-9876-5432",
    email: "dolsan.lee@example.com",
    registeredDong: "돌산읍",
    age: 45,
    referrerCode: "DOLSAN002",
    pathHierarchy: ["user-001"],
    consents: {
      terms: true,
      thirdPartyFinancialLead: true,
    },
    membershipTier: "free",
    tenXPoints: 0,
  },
];

/** 10X 연계 수당 적립 내역 (초기 비어있음) */
export const mockCommissionLedger: CommissionLedgerEntry[] = [];

/** 카톡 제보, 웹 직접등록, 지자체 공공 게시글 샘플 */
export const mockLocalPosts: LocalPost[] = [
  {
    id: "post-001",
    region: sanggyeDong,
    category: "welfare",
    title: "상계동 독거노인 안심복지 방문 서비스 안내",
    content:
      "노원구청과 협회가 협력하여 상계동 독거노인 가정을 대상으로 안심복지 방문 서비스를 운영합니다. 신청은 주민센터를 통해 접수 가능합니다.",
    images: ["https://cdn.todaypick.kr/posts/post-001-1.webp"],
    sourceChannel: "official_gov",
    author: {
      id: "user-001",
      name: "노원구청 복지과",
      isPartner: true,
      badge: "공공기관",
    },
    reportCount: 0,
    isBlinded: false,
    viewCount: 1240,
    likeCount: 58,
    createdAt: "2026-09-12T09:00:00+09:00",
  },
  {
    id: "post-002",
    region: dolsanEup,
    category: "food",
    title: "돌산읍 갓김치 축제 - 반건조 갈치 시식회",
    content:
      "여수 돌산읍 특산물인 갓김치와 반건조 갈치를 맛볼 수 있는 가을 축제가 열립니다. 지역 어촌계와 함께하는 시식회도 준비되어 있어요.",
    images: [
      "https://cdn.todaypick.kr/posts/post-002-1.webp",
      "https://cdn.todaypick.kr/posts/post-002-2.webp",
    ],
    sourceChannel: "kakao_channel",
    author: {
      id: "user-002",
      name: "이돌산",
      isPartner: false,
    },
    reportCount: 0,
    isBlinded: false,
    viewCount: 892,
    likeCount: 103,
    createdAt: "2026-09-20T14:30:00+09:00",
  },
  {
    id: "post-003",
    region: sanggyeDong,
    category: "repair",
    title: "상계동 동네수리 - 우산/소형가전 무료 수리 데이입니다",
    content:
      "상계동 주민자치회 주관으로 매월 둘째 주 토요일 우산, 소형가전 무료 수리 행사를 진행합니다. 선착순 접수입니다.",
    images: ["https://cdn.todaypick.kr/posts/post-003-1.webp"],
    sourceChannel: "mobile_web",
    author: {
      id: "user-001",
      name: "박노원",
      isPartner: true,
      badge: "협회회원사",
    },
    reportCount: 1,
    isBlinded: false,
    viewCount: 340,
    likeCount: 21,
    createdAt: "2026-09-25T08:15:00+09:00",
  },
  {
    id: "post-004",
    region: dolsanEup,
    category: "business",
    title: "[카톡제보] 돌산대교 앞 신규 생선구이 식당 오픈",
    content:
      "돌산대교 인근에 지역 수산물을 활용한 생선구이 식당이 새로 문을 열었다는 제보입니다. 사장님이 직접 돌산 갓을 재배하신다고 해요.",
    images: ["https://cdn.todaypick.kr/posts/post-004-1.webp"],
    sourceChannel: "kakao_channel",
    author: {
      id: "user-002",
      name: "익명제보자",
      isPartner: false,
    },
    reportCount: 3,
    isBlinded: true,
    viewCount: 112,
    likeCount: 4,
    createdAt: "2026-10-01T19:45:00+09:00",
  },
];

/** 링크픽형 제휴 커머스 상품 샘플 */
export const mockLinkPickProducts: LinkPickProduct[] = [
  {
    id: "product-001",
    sellerId: "seller-coupang-001",
    productType: "coupang_affiliate",
    title: "휴대용 적외선 온도계 (쿠팡 제휴)",
    price: 15900,
    priceDisplayMode: "show_price",
    originalUrl: "https://www.coupang.com/vp/products/0000000001",
    affiliateUrl: "https://link.coupang.com/a/0000000001",
    thumbnail: "https://cdn.todaypick.kr/products/product-001.webp",
  },
  {
    id: "product-002",
    sellerId: "seller-dolsan-002",
    productType: "local_specialty",
    title: "여수 돌산 반건조 갈치 (2kg 세트)",
    priceDisplayMode: "lowest_price_btn",
    originalUrl: "https://dolsan-market.kr/products/half-dried-hairtail",
    affiliateUrl: "https://link.todaypick.kr/a/product-002",
    thumbnail: "https://cdn.todaypick.kr/products/product-002.webp",
    donationPerSale: 1000,
  },
  {
    id: "product-003",
    sellerId: "seller-welfare-003",
    productType: "welfare_device",
    title: "초음파 세척기 맥케어(McKare) 가정용",
    priceDisplayMode: "special_deal_btn",
    originalUrl: "https://mckare.co.kr/products/ultrasonic-washer",
    affiliateUrl: "https://link.todaypick.kr/a/product-003",
    thumbnail: "https://cdn.todaypick.kr/products/product-003.webp",
    donationPerSale: 5000,
  },
];

/** 착한소비 펀딩 캠페인 샘플 (반건조 생선 펀딩 -> 복지기기 기부) */
export const mockDonationCampaigns: DonationCampaign[] = [
  {
    id: "campaign-001",
    targetRegion: "서울특별시 노원구 상계동",
    title: "상계동 독거노인 맥케어 기부 펀딩",
    targetAmount: 3000000,
    currentAmount: 1850000,
    beneficiaryDevice: "mckare",
    isAchieved: false,
    completedReports: [
      {
        id: "report-001",
        reportNo: "제18호",
        title: "상계동 어르신 댁 맥케어 설치 완료",
        installDate: "2026-08-15",
        photoUrl: "https://cdn.todaypick.kr/campaigns/campaign-001-1.webp",
        byline: "투데이픽협회 노원지사",
      },
    ],
  },
  {
    id: "campaign-002",
    targetRegion: "전라남도 여수시 돌산읍",
    title: "돌산읍 반건조 갈치 판매 수익 - 초음파세척기 기부 펀딩",
    targetAmount: 2000000,
    currentAmount: 2000000,
    beneficiaryDevice: "ultrasonic_washer",
    isAchieved: true,
    completedReports: [
      {
        id: "report-002",
        reportNo: "제07호",
        title: "돌산읍 어르신 복지센터 초음파세척기 설치 완료",
        installDate: "2026-09-30",
        photoUrl: "https://cdn.todaypick.kr/campaigns/campaign-002-1.webp",
        byline: "투데이픽협회 여수지사",
      },
    ],
  },
];
