import {
  mockCommissionLedger,
  mockDonationCampaigns,
  mockLinkPickProducts,
  mockLocalPosts,
  mockUsers,
} from "@/lib/db/mockSeed";
import type {
  LocalPickCategory,
  LocalPost,
  LocalPostAuthor,
  LocalPostSourceChannel,
  Region,
} from "@/types/local";
import type {
  DonationCampaign,
  LinkPickProduct,
  PriceDisplayMode,
  ProductType,
} from "@/types/commerce";
import type { CommissionLedgerEntry, UserConsents, UserProfile } from "@/types/auth";

const AUTO_BLIND_THRESHOLD = 3;

export interface LocalFeedFilter {
  sido?: string;
  gugun?: string;
  dong?: string;
  category?: LocalPickCategory;
}

/** 블라인드 처리되지 않은 게시글만 동네/카테고리 필터로 조회 */
export function getVisibleLocalPosts(filter: LocalFeedFilter = {}): LocalPost[] {
  return mockLocalPosts.filter((post) => {
    if (post.isBlinded) return false;
    if (filter.sido && post.region.sido !== filter.sido) return false;
    if (filter.gugun && post.region.gugun !== filter.gugun) return false;
    if (filter.dong && post.region.dong !== filter.dong) return false;
    if (filter.category && post.category !== filter.category) return false;
    return true;
  });
}

export interface CreateLocalPostInput {
  title: string;
  content: string;
  images: string[];
  category: LocalPickCategory;
  region: Region;
  sourceChannel: LocalPostSourceChannel;
  author: LocalPostAuthor;
}

export function createLocalPost(input: CreateLocalPostInput): LocalPost {
  const post: LocalPost = {
    id: `post-${crypto.randomUUID()}`,
    region: input.region,
    category: input.category,
    title: input.title,
    content: input.content,
    images: input.images,
    sourceChannel: input.sourceChannel,
    author: input.author,
    reportCount: 0,
    isBlinded: false,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  };

  mockLocalPosts.push(post);
  return post;
}

/** 신고 접수: reportCount 증가 및 임계치(3회) 도달 시 자동 블라인드 처리 */
export function reportLocalPost(id: string): LocalPost | null {
  const post = mockLocalPosts.find((item) => item.id === id);
  if (!post) return null;

  post.reportCount += 1;
  if (post.reportCount >= AUTO_BLIND_THRESHOLD) {
    post.isBlinded = true;
  }

  return post;
}

export interface ProductFilter {
  productType?: ProductType;
  sellerId?: string;
}

/** 조건에 맞는 링크픽형 상품 목록 조회 */
export function getLinkPickProducts(filter: ProductFilter = {}): LinkPickProduct[] {
  return mockLinkPickProducts.filter((product) => {
    if (filter.productType && product.productType !== filter.productType) return false;
    if (filter.sellerId && product.sellerId !== filter.sellerId) return false;
    return true;
  });
}

export function findLinkPickProductById(id: string): LinkPickProduct | undefined {
  return mockLinkPickProducts.find((product) => product.id === id);
}

export interface CreateLinkPickProductInput {
  sellerId: string;
  productType: ProductType;
  title: string;
  price?: number;
  priceDisplayMode: PriceDisplayMode;
  originalUrl: string;
  affiliateUrl: string;
  thumbnail: string;
  donationPerSale?: number;
}

/** 원판매자/크리에이터가 내 링크에 상품을 담아 등록 */
export function createLinkPickProduct(
  input: CreateLinkPickProductInput
): LinkPickProduct {
  const product: LinkPickProduct = {
    id: `product-${crypto.randomUUID()}`,
    ...input,
  };

  mockLinkPickProducts.push(product);
  return product;
}

export function getDonationCampaigns(): DonationCampaign[] {
  return mockDonationCampaigns;
}

export function findDonationCampaignById(id: string): DonationCampaign | undefined {
  return mockDonationCampaigns.find((campaign) => campaign.id === id);
}

export interface ApplyDonationResult {
  campaign: DonationCampaign;
  donatedAmount: number;
  /** 이번 적립으로 목표 금액을 새로 달성했는지 여부 */
  justAchieved: boolean;
}

const DEVICE_LABEL: Record<DonationCampaign["beneficiaryDevice"], string> = {
  mckare: "맥케어",
  ultrasonic_washer: "초음파세척기",
};

/** 가상 구매/적립 트리거: currentAmount 누적, 목표 달성 시 설치 예정 알림 생성 */
export function applyDonation(
  campaignId: string,
  donationAmount: number
): ApplyDonationResult | null {
  const campaign = mockDonationCampaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;

  const wasAchieved = campaign.isAchieved;
  campaign.currentAmount += donationAmount;

  let justAchieved = false;
  if (!wasAchieved && campaign.currentAmount >= campaign.targetAmount) {
    campaign.isAchieved = true;
    campaign.installNotice = {
      message: `${campaign.targetRegion} 수혜 가정에 ${
        DEVICE_LABEL[campaign.beneficiaryDevice]
      } 설치가 예정되었습니다. 협회 대리점에서 곧 연락드립니다.`,
      scheduledDevice: campaign.beneficiaryDevice,
      notifiedAt: new Date().toISOString(),
    };
    justAchieved = true;
  }

  return { campaign, donatedAmount: donationAmount, justAchieved };
}

/** 전체 캠페인의 투명 설치 인증 리포트를 평탄화하여 조회 */
export function getCompletedDonationReports() {
  return mockDonationCampaigns.flatMap((campaign) =>
    campaign.completedReports.map((report) => ({
      ...report,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      targetRegion: campaign.targetRegion,
      beneficiaryDevice: campaign.beneficiaryDevice,
    }))
  );
}

const MAX_MLM_LEVELS = 10;
const COMMISSION_RATE = 0.02;

export function findUserById(id: string): UserProfile | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function findUserByReferrerCode(code: string): UserProfile | undefined {
  return mockUsers.find((user) => user.referrerCode === code);
}

function generateUniqueReferrerCode(): string {
  let code: string;
  do {
    code = `TP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (mockUsers.some((user) => user.referrerCode === code));
  return code;
}

export interface RegisterUserInput {
  name: string;
  phone: string;
  email: string;
  kakaoId: string;
  registeredDong: string;
  referrerCode?: string;
  age?: number;
  consents: UserConsents;
}

/** 카카오 간편가입 처리 및 추천인 코드 기반 10단계 pathHierarchy 생성 */
export function registerUser(input: RegisterUserInput): UserProfile {
  const referrer = input.referrerCode
    ? findUserByReferrerCode(input.referrerCode)
    : undefined;

  const pathHierarchy = referrer
    ? [referrer.id, ...referrer.pathHierarchy].slice(0, MAX_MLM_LEVELS)
    : [];

  const user: UserProfile = {
    id: `user-${crypto.randomUUID()}`,
    kakaoId: input.kakaoId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    registeredDong: input.registeredDong,
    age: input.age,
    referrerCode: generateUniqueReferrerCode(),
    pathHierarchy,
    consents: input.consents,
    membershipTier: "free",
    tenXPoints: 0,
  };

  mockUsers.push(user);
  return user;
}

export interface DistributeCommissionInput {
  userId: string;
  contractAmount: number;
  contractType: string;
}

export interface DistributeCommissionResult {
  entries: CommissionLedgerEntry[];
}

/** 실적 발생자의 pathHierarchy를 역순 추적하여 1~10단계 추천인에게 2%씩 적립 */
export function distributeCommission(
  input: DistributeCommissionInput
): DistributeCommissionResult | null {
  const sourceUser = findUserById(input.userId);
  if (!sourceUser) return null;

  const createdAt = new Date().toISOString();
  const entries: CommissionLedgerEntry[] = [];

  sourceUser.pathHierarchy.slice(0, MAX_MLM_LEVELS).forEach((beneficiaryId, index) => {
    const beneficiary = findUserById(beneficiaryId);
    if (!beneficiary) return;

    const amount = Math.round(input.contractAmount * COMMISSION_RATE);
    const entry: CommissionLedgerEntry = {
      id: `ledger-${crypto.randomUUID()}`,
      beneficiaryUserId: beneficiary.id,
      sourceUserId: sourceUser.id,
      level: index + 1,
      contractAmount: input.contractAmount,
      contractType: input.contractType,
      amount,
      createdAt,
    };

    beneficiary.tenXPoints += amount;
    mockCommissionLedger.push(entry);
    entries.push(entry);
  });

  return { entries };
}

export interface CommissionLevelBreakdown {
  level: number;
  contributionCount: number;
  totalAmount: number;
}

export interface CommissionDashboard {
  user: UserProfile;
  /** 산하 추천 조직 전체 규모 (pathHierarchy에 본인이 포함된 하위 회원 수) */
  totalDownlineCount: number;
  tenXPoints: number;
  levelBreakdown: CommissionLevelBreakdown[];
  ledgerEntries: CommissionLedgerEntry[];
}

/** 특정 사용자의 10X 추천 조직도 및 단계별 수당 대시보드 조회 */
export function getCommissionDashboard(userId: string): CommissionDashboard | null {
  const user = findUserById(userId);
  if (!user) return null;

  const totalDownlineCount = mockUsers.filter((candidate) =>
    candidate.pathHierarchy.includes(userId)
  ).length;

  const ledgerEntries = mockCommissionLedger.filter(
    (entry) => entry.beneficiaryUserId === userId
  );

  const levelBreakdown: CommissionLevelBreakdown[] = Array.from(
    { length: MAX_MLM_LEVELS },
    (_, i) => {
      const level = i + 1;
      const entriesAtLevel = ledgerEntries.filter((entry) => entry.level === level);
      return {
        level,
        contributionCount: entriesAtLevel.length,
        totalAmount: entriesAtLevel.reduce((sum, entry) => sum + entry.amount, 0),
      };
    }
  );

  return {
    user,
    totalDownlineCount,
    tenXPoints: user.tenXPoints,
    levelBreakdown,
    ledgerEntries,
  };
}

export interface LeadFilter {
  registeredDong?: string;
  minAge?: number;
  maxAge?: number;
}

export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  registeredDong: string;
  age?: number;
  membershipTier: UserProfile["membershipTier"];
}

/** 5대 업종 제휴 리드 동의 완료 회원 중 지역/연령 필터로 추출 (관리자용) */
export function getFinancialLeadCandidates(filter: LeadFilter = {}): LeadRecord[] {
  return mockUsers
    .filter((user) => user.consents.thirdPartyFinancialLead)
    .filter(
      (user) => !filter.registeredDong || user.registeredDong === filter.registeredDong
    )
    .filter((user) => filter.minAge === undefined || (user.age ?? -Infinity) >= filter.minAge)
    .filter((user) => filter.maxAge === undefined || (user.age ?? Infinity) <= filter.maxAge)
    .map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      registeredDong: user.registeredDong,
      age: user.age,
      membershipTier: user.membershipTier,
    }));
}
