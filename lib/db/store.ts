import {
  mockCivicNotices,
  mockCommissionLedger,
  mockDonationCampaigns,
  mockLinkPickProducts,
  mockLocalPosts,
  mockOfficialNotices,
  mockAdCampaigns,
  mockWorkLogs,
  mockAppPwaSettings,
  mockTodayNotes,
  mockLocalComplexEvents,
  mockResidentVerifications,
  mockLocalEventApplications,
  mockPlatformProducts,
  mockLocalAds,
  mockUsers,
  mockDiaryBrands,
  mockDiaryEvents,
  mockDiaryMembers,
  mockDiaryPosts,
  mockDiaryComments,
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
import type { CivicNotice } from "@/types/civic";
import type {
  AdCampaign,
  LocalOfficialNotice,
  OfficialNoticeCategory,
  WorkLog,
  TodayNote,
  LocalComplexEvent,
  ResidentVerification,
  LocalEventApplication,
  PlatformProduct,
  LocalAd,
  AdStatus,
} from "@/types/officialNotice";
import type { AppPwaSetting, AppPwaTarget } from "@/types/pwa";
import type {
  DiaryBrand,
  DiaryEvent,
  DiaryMember,
  DiaryMemberRole,
  DiaryMemberStatus,
  DiaryPost,
  DiaryComment,
} from "@/types/diary";

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

export interface CivicNoticeFilter {
  dong?: string;
}

/** 지자체 공식 고시공고/새소식 조회 */
export function getCivicNotices(filter: CivicNoticeFilter = {}): CivicNotice[] {
  return mockCivicNotices.filter((notice) => {
    if (filter.dong && notice.region.dong !== filter.dong) return false;
    return true;
  });
}

export interface OfficialNoticeFilter {
  districtCode?: string;
  category?: OfficialNoticeCategory | string;
  role?: string;
}

/** 공식 행정 고시 및 로컬 인프라/재개발 팩트 피드 조회 (목업/로컬 스토어) */
export function getOfficialNotices(filter: OfficialNoticeFilter = {}): LocalOfficialNotice[] {
  return mockOfficialNotices.filter((notice) => {
    if (filter.districtCode) {
      const isExact = notice.district_code === filter.districtCode;
      const isPrefixMatch =
        filter.districtCode.length >= 5 &&
        notice.district_code.slice(0, 5) === filter.districtCode.slice(0, 5);
      if (!isExact && !isPrefixMatch) return false;
    }
    if (filter.category && filter.category !== "ALL" && notice.category !== filter.category) {
      return false;
    }
    if (filter.role && filter.role !== "ALL" && notice.target_roles) {
      const hasRole =
        notice.target_roles.includes("ALL") ||
        notice.target_roles.includes(filter.role);
      if (!hasRole) return false;
    }
    return true;
  });
}

/** 스폰서 제휴 광고 캠페인 조회 */
export function getAdCampaigns(): AdCampaign[] {
  return mockAdCampaigns.filter((ad) => ad.is_active !== false);
}

/** 업무일지 목록 조회 */
export function getWorkLogs(): WorkLog[] {
  return [...mockWorkLogs].sort(
    (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
  );
}

/** 업무일지 생성 */
export function createWorkLog(title: string, content?: string): WorkLog {
  const log: WorkLog = {
    id: `work-${crypto.randomUUID()}`,
    title,
    content_text: content || null,
    status: "TODO",
    is_alert_enabled: true,
    alert_time: "08:30",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockWorkLogs.unshift(log);
  return log;
}

/** 업무일지 상태 변경 */
export function toggleWorkLogStatus(id: string): WorkLog | null {
  const log = mockWorkLogs.find((item) => item.id === id);
  if (!log) return null;
  log.status = log.status === "DONE" ? "TODO" : "DONE";
  log.updated_at = new Date().toISOString();
  return log;
}

/** PWA 앱 설정 조회 */
export function getAppPwaSetting(target: AppPwaTarget = "TODAY_MAIN"): AppPwaSetting {
  const setting = mockAppPwaSettings.find((s) => s.app_target === target);
  return setting || mockAppPwaSettings[0];
}

/** t.다이어리 브랜드 slug 조회 (?brand=xxx 쿼리 파라미터 식별용) */
export function getDiaryBrandBySlug(slug: string): DiaryBrand | null {
  return mockDiaryBrands.find((b) => b.brand_slug === slug) || null;
}

/** t.다이어리 공식 행사 일정 조회 (브랜드 미지정 시 빈 배열) */
export function getDiaryEvents(diaryId?: string | null): DiaryEvent[] {
  if (!diaryId) return [];
  return mockDiaryEvents.filter((e) => e.diary_id === diaryId);
}

/** t.다이어리 제공자 탐색 — 승인완료/조건부승인 제공자만 노출 (PENDING·REJECTED 제외), 지역/카테고리 필터 */
export function getDiaryProviders(filter?: {
  region?: string | null;
  category?: DiaryBrand["provider_type"] | null;
}): DiaryBrand[] {
  return mockDiaryBrands.filter((b) => {
    if (b.approval_status !== "APPROVED" && b.approval_status !== "CONDITIONAL") return false;
    if (filter?.region && b.region_code !== filter.region) return false;
    if (filter?.category && b.provider_type !== filter.category) return false;
    return true;
  });
}

/** t.다이어리 구독 복수 브랜드의 공식 행사 일정 조회 (공개 일정만) */
export function getDiaryEventsByIds(diaryIds: string[]): DiaryEvent[] {
  if (!diaryIds.length) return [];
  return mockDiaryEvents.filter((e) => diaryIds.includes(e.diary_id) && e.is_public);
}

/** 관리자 심사 대시보드용 전체 제공자 조회 (승인 상태 무관) */
export function getAllDiaryProviders(): DiaryBrand[] {
  return mockDiaryBrands;
}

/** 제공자 등록 신청 — 항상 PENDING으로 생성되어 관리자 심사를 거쳐야 노출됨 */
export function createDiaryApplication(input: {
  brand_name: string;
  contact_info: string;
  region_code: string;
  provider_type: DiaryBrand["provider_type"];
  business_reg_no?: string | null;
  intro?: string | null;
  youtube_channel?: string | null;
  website_url?: string | null;
}): DiaryBrand {
  const slugBase = input.brand_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");

  const brand: DiaryBrand = {
    id: `diary-brand-${Date.now()}`,
    brand_slug: `${slugBase || "provider"}-${Math.random().toString(36).slice(2, 6)}`,
    brand_name: input.brand_name,
    logo_url: null,
    contact_info: input.contact_info,
    approval_status: "PENDING",
    provider_type: input.provider_type,
    region_code: input.region_code || null,
    youtube_channel: input.youtube_channel || null,
    business_reg_no: input.business_reg_no || null,
    intro: input.intro || null,
    website_url: input.website_url || null,
    created_at: new Date().toISOString(),
  };

  mockDiaryBrands.push(brand);
  return brand;
}

/** 관리자 심사 — 승인/조건부승인/반려 상태 전환 */
export function updateDiaryApprovalStatus(
  id: string,
  status: DiaryBrand["approval_status"]
): DiaryBrand | null {
  const brand = mockDiaryBrands.find((b) => b.id === id);
  if (!brand) return null;
  brand.approval_status = status;
  return brand;
}

/** 역할/학년 타깃 노출 판정 — 비회원·미승인 회원은 공개(is_public && target_roles 전체) 일정만 열람 */
export function isDiaryEventVisibleToMember(event: DiaryEvent, member: DiaryMember | null): boolean {
  if (!member || member.status !== "APPROVED") {
    return event.is_public && event.target_roles.includes("ALL");
  }
  const roleMatch = event.target_roles.includes("ALL") || event.target_roles.includes(member.role);
  const gradeMatch =
    event.target_grades.includes("ALL") ||
    member.grade_tags.includes("ALL") ||
    event.target_grades.some((g) => member.grade_tags.includes(g));
  return roleMatch && gradeMatch;
}

/** 단일 다이어리의 역할/학년 타깃 필터링된 일정 조회 (폐쇄형 커뮤니티 대응) */
export function getDiaryEventsForMember(diaryId: string, member: DiaryMember | null): DiaryEvent[] {
  return mockDiaryEvents
    .filter((e) => e.diary_id === diaryId)
    .filter((e) => isDiaryEventVisibleToMember(e, member));
}

/** 선생님/관리자가 공개 대상(역할·학년)을 지정하여 신규 일정 등록 */
export function createDiaryEvent(input: {
  diary_id: string;
  title: string;
  description?: string | null;
  event_date: string;
  is_public?: boolean;
  target_roles?: string[];
  target_grades?: string[];
  media_type?: DiaryEvent["media_type"];
  media_url?: string | null;
  voice_url?: string | null;
}): DiaryEvent {
  const event: DiaryEvent = {
    id: `diary-evt-${Date.now()}`,
    diary_id: input.diary_id,
    title: input.title,
    description: input.description || null,
    event_date: input.event_date,
    is_public: input.is_public ?? false,
    send_alimtalk: false,
    media_type: input.media_type || "NONE",
    media_url: input.media_url || null,
    voice_url: input.voice_url || null,
    target_roles: input.target_roles?.length ? input.target_roles : ["ALL"],
    target_grades: input.target_grades?.length ? input.target_grades : ["ALL"],
  };
  mockDiaryEvents.push(event);
  return event;
}

/** 특정 다이어리 커뮤니티의 구성원(선생님/학부모/학생) 조회 */
export function getDiaryMembersByDiaryId(diaryId: string): DiaryMember[] {
  return mockDiaryMembers.filter((m) => m.diary_id === diaryId);
}

/** 유저가 속한 전체 커뮤니티 멤버십 조회 */
export function getDiaryMembersForUser(userId: string): DiaryMember[] {
  return mockDiaryMembers.filter((m) => m.user_id === userId);
}

/** 특정 다이어리에서 유저의 멤버십 단건 조회 */
export function getDiaryMemberForUser(diaryId: string, userId: string): DiaryMember | null {
  return mockDiaryMembers.find((m) => m.diary_id === diaryId && m.user_id === userId) || null;
}

/** 커뮤니티 가입 신청 — 이미 신청/가입된 경우 기존 레코드를 그대로 반환 (항상 PENDING으로 생성) */
export function createOrUpdateDiaryMembership(input: {
  diary_id: string;
  user_id: string;
  role: DiaryMemberRole;
  grade_tags: string[];
}): DiaryMember {
  const existing = getDiaryMemberForUser(input.diary_id, input.user_id);
  if (existing) return existing;

  const member: DiaryMember = {
    id: `diary-member-${Date.now()}`,
    diary_id: input.diary_id,
    user_id: input.user_id,
    role: input.role,
    grade_tags: input.grade_tags.length ? input.grade_tags : ["ALL"],
    status: "PENDING",
    created_at: new Date().toISOString(),
  };
  mockDiaryMembers.push(member);
  return member;
}

/** 선생님/관리자의 가입 승인 처리 */
export function updateDiaryMemberStatus(id: string, status: DiaryMemberStatus): DiaryMember | null {
  const member = mockDiaryMembers.find((m) => m.id === id);
  if (!member) return null;
  member.status = status;
  return member;
}

/** 우리 반/우리 그룹 커뮤니티 피드 조회 (최신순) */
export function getDiaryPosts(diaryId: string): DiaryPost[] {
  return mockDiaryPosts
    .filter((p) => p.diary_id === diaryId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** 선생님/관리자의 알림장·활동 게시글 작성 */
export function createDiaryPost(input: {
  diary_id: string;
  author_id: string;
  author_role: DiaryMemberRole;
  title: string;
  content?: string | null;
  media_urls?: string[];
  target_grades?: string[];
}): DiaryPost {
  const post: DiaryPost = {
    id: `diary-post-${Date.now()}`,
    diary_id: input.diary_id,
    author_id: input.author_id,
    author_role: input.author_role,
    title: input.title,
    content: input.content || null,
    media_urls: input.media_urls || [],
    target_grades: input.target_grades?.length ? input.target_grades : ["ALL"],
    created_at: new Date().toISOString(),
  };
  mockDiaryPosts.push(post);
  return post;
}

/** 게시글 비밀 댓글(안심 소통창구) 조회 */
export function getDiaryComments(postId: string): DiaryComment[] {
  return mockDiaryComments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/** 커뮤니티 구성원의 비밀 댓글 작성 */
export function createDiaryComment(input: {
  post_id: string;
  author_id: string;
  content: string;
}): DiaryComment {
  const comment: DiaryComment = {
    id: `diary-comment-${Date.now()}`,
    post_id: input.post_id,
    author_id: input.author_id,
    content: input.content,
    created_at: new Date().toISOString(),
  };
  mockDiaryComments.push(comment);
  return comment;
}

/** 티노트/티단노트(today_notes) 목록 조회 */
export function getTodayNotes(filter?: { kaptCode?: string | null }): TodayNote[] {
  return mockTodayNotes.filter((note) => {
    if (filter?.kaptCode !== undefined) {
      if (filter.kaptCode === null) {
        return !note.linked_kapt_code;
      }
      return note.linked_kapt_code === filter.kaptCode;
    }
    return true;
  });
}

/** 티노트/티단노트(today_notes) 생성 */
export function createTodayNote(
  input: Omit<TodayNote, "id" | "created_at" | "updated_at">
): TodayNote {
  const note: TodayNote = {
    ...input,
    id: `note-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockTodayNotes.unshift(note);
  return note;
}

/** 티노트/티단노트(today_notes) 삭제 */
export function deleteTodayNote(id: string): boolean {
  const index = mockTodayNotes.findIndex((n) => n.id === id);
  if (index >= 0) {
    mockTodayNotes.splice(index, 1);
    return true;
  }
  return false;
}

/** 로컬 단지 제휴 이벤트 목록 조회 */
export function getLocalComplexEvents(districtCode?: string): LocalComplexEvent[] {
  return mockLocalComplexEvents.filter((evt) => {
    if (evt.is_active === false) return false;
    if (districtCode && evt.district_code) {
      const match =
        evt.district_code === districtCode ||
        evt.district_code.slice(0, 5) === districtCode.slice(0, 5);
      if (!match) return false;
    }
    return true;
  });
}

/** 입주민 인증 신청 등록 */
export function createResidentVerification(
  input: ResidentVerification
): ResidentVerification {
  const item: ResidentVerification = {
    ...input,
    id: input.id || `res-v-${crypto.randomUUID()}`,
    status: input.status || "PENDING",
    created_at: new Date().toISOString(),
  };
  mockResidentVerifications.unshift(item);
  return item;
}

/** 단지 이벤트 응모 등록 */
export function createLocalEventApplication(
  input: LocalEventApplication
): LocalEventApplication {
  const item: LocalEventApplication = {
    ...input,
    id: input.id || `evt-app-${crypto.randomUUID()}`,
    status: input.status || "PENDING",
    created_at: new Date().toISOString(),
  };
  mockLocalEventApplications.unshift(item);
  return item;
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
    commentCount: 0,
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

/** 취급제품 마스터 목록 조회 (목업/로컬 스토어) */
export function getPlatformProducts(): PlatformProduct[] {
  return [...mockPlatformProducts].sort(
    (a, b) => (a.rolling_order ?? 0) - (b.rolling_order ?? 0)
  );
}

/** 메인 최상단 롤링 배너 노출용 제품 목록 조회 */
export function getHeroRollingProducts(): PlatformProduct[] {
  return mockPlatformProducts
    .filter((p) => p.is_hero_rolling && p.is_public !== false)
    .sort((a, b) => (a.rolling_order ?? 0) - (b.rolling_order ?? 0));
}

/** 취급제품 정보 업데이트 (목업/로컬 스토어) */
export function updatePlatformProduct(
  id: string,
  updates: Partial<PlatformProduct>
): PlatformProduct | null {
  const item = mockPlatformProducts.find((p) => p.id === id);
  if (!item) return null;
  Object.assign(item, updates, { updated_at: new Date().toISOString() });
  return item;
}

/** 파트너스 비즈보드 광고 목록 조회 */
export function getLocalAds(filter?: {
  status?: AdStatus;
  dong?: string;
  partnerId?: string;
}): LocalAd[] {
  return mockLocalAds.filter((ad) => {
    if (filter?.status && ad.status !== filter.status) return false;
    if (filter?.partnerId && ad.partner_id !== filter.partnerId) return false;
    if (filter?.dong && filter.dong !== "ALL") {
      if (
        !ad.target_dongs.includes("ALL") &&
        !ad.target_dongs.includes(filter.dong) &&
        ad.registered_dong !== filter.dong
      ) {
        return false;
      }
    }
    return true;
  });
}

/** 파트너스 비즈보드 신규 광고 신청/생성 */
export function createLocalAd(
  newAd: Omit<LocalAd, "id" | "created_at" | "impressions" | "clicks">
): LocalAd {
  const ad: LocalAd = {
    ...newAd,
    id: `ad-${Date.now()}`,
    impressions: 0,
    clicks: 0,
    created_at: new Date().toISOString(),
  };
  mockLocalAds.unshift(ad);
  return ad;
}

/** 파트너스 광고 상태 변경 (최고관리자 승인/반려 제어) */
export function updateLocalAdStatus(
  id: string,
  status: AdStatus,
  rejectReason?: string | null
): LocalAd | null {
  const ad = mockLocalAds.find((a) => a.id === id);
  if (!ad) return null;
  ad.status = status;
  if (status === "APPROVED") {
    ad.is_active = true;
    ad.reject_reason = null;
  } else if (status === "REJECTED") {
    ad.is_active = false;
    ad.reject_reason = rejectReason || "광고 집행 가이드라인 미준수 사유";
  }
  ad.updated_at = new Date().toISOString();
  return ad;
}

/** 파트너스 광고 온/오프 일시중지 토글 */
export function toggleLocalAdActive(id: string, isActive?: boolean): LocalAd | null {
  const ad = mockLocalAds.find((a) => a.id === id);
  if (!ad) return null;
  ad.is_active = isActive !== undefined ? isActive : !ad.is_active;
  ad.updated_at = new Date().toISOString();
  return ad;
}


