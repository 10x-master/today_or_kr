"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  HelpCircle,
  MapPin,
  Newspaper,
  Phone,
  QrCode,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import BizOwnershipClaimModal from "@/components/biz/BizOwnershipClaimModal";
import CleanTrustScoreCard from "@/components/portal/CleanTrustScoreCard";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";
import QuickShareToolbar from "@/components/note/QuickShareToolbar";
import type { BizType, BizClaimStatus, BizClaimRequest } from "@/types/biz";

// ============================================================================
// 모의 데이터 맵 (아파트 & 상점/기업)
// ============================================================================
const MOCK_APT_DATABASE: Record<
  string,
  {
    name: string;
    householdCount: number;
    approvalDate: string;
    hallwayType: string;
    heatingType: string;
    address: string;
    dong: string;
    tel: string;
    ceraScore: number;
    news: Array<{ title: string; source: string; date: string; summary: string }>;
  }
> = {
  "apt-sanggye14": {
    name: "상계주공 14단지",
    householdCount: 1188,
    approvalDate: "1989.11.24",
    hallwayType: "복도식 (지상 15층)",
    heatingType: "지역난방 (열병합)",
    address: "서울특별시 노원구 동일로227길 26",
    dong: "상계동",
    tel: "02-938-1400",
    ceraScore: 94,
    news: [
      {
        title: "노원구 상계주공 14단지, K-apt CERA 적정가 투명도 지수 'AAA' 우수 단지 선정",
        source: "한국경제",
        date: "2026.10.12",
        summary: "장기수선충당금 목적외 사용 방어율 100% 달성 및 승강기 전면 교체 공사 입찰 투명화 달성.",
      },
      {
        title: "서울시 2026 공동주택 노후 공용시설물 보수 지자체 매칭 지원금 접수 안내",
        source: "매일경제",
        date: "2026.10.08",
        summary: "단지당 최대 3,000만원 한도 내 노후 옥상 방수 및 보안 CCTV 고화질 교체 보조금 지원.",
      },
      {
        title: "상계동 아파트 단지 입주민 직거래 친환경 녹색장터 & 공구 페스티벌 성료",
        source: "동아일보",
        date: "2026.09.28",
        summary: "10X 상생 파트너스와 연계하여 제조원가 직거래 과일·생활용품 30% 절감 효과.",
      },
    ],
  },
  "apt-junggye03": {
    name: "중계주공 3단지",
    householdCount: 1320,
    approvalDate: "1992.05.10",
    hallwayType: "계단식 / 복도식 혼합",
    heatingType: "지역난방",
    address: "서울특별시 노원구 중계로 110",
    dong: "중계동",
    tel: "02-931-0300",
    ceraScore: 91,
    news: [
      {
        title: "중계주공 3단지 정밀안전진단 추진 및 외벽 재도장 공사 입찰 공고",
        source: "머니투데이",
        date: "2026.10.01",
        summary: "장기수선계획 3년 정기조정 심의 완료에 따른 공용부 유지보수 사업 시행.",
      },
    ],
  },
};

const MOCK_STORE_DATABASE: Record<
  string,
  {
    name: string;
    openDate: string;
    category: string;
    address: string;
    dong: string;
    licenseNo: string;
    representative: string;
    tel: string;
    portfolio: Array<{ title: string; date: string; summary: string }>;
  }
> = {
  "store-nowon-roastery": {
    name: "노원 로스터리 상계점",
    openDate: "2021.04.15",
    category: "요식업 · 스페셜티 카페",
    address: "서울특별시 노원구 상계로 118, 1층",
    dong: "상계동",
    licenseNo: "제2021-0182741호",
    representative: "김노원",
    tel: "02-938-1200",
    portfolio: [
      {
        title: "상계주공 단지 입주민 전용 스페셜티 원두 10% 정기배송 협약",
        date: "2026.09.15",
        summary: "당일 로스팅한 싱글 오리진 에티오피아 및 블렌드 원두 단지 직배송.",
      },
      {
        title: "소상공인 스마트상점 국비 70% 지원 키오스크 & 테이블오더 도입 완료",
        date: "2026.08.10",
        summary: "중기부·소진공 기술보급 사업으로 매장 자동화 및 회전율 25% 개선.",
      },
    ],
  },
  "corp-topsonic": {
    name: "(주)탑소닉 테크놀로지",
    openDate: "2018.11.02",
    category: "제조업 · 친환경 초음파 세척 설비",
    address: "경기도 시흥시 산기대학로 237 시화공단",
    dong: "상계동 직거래 센터",
    licenseNo: "제2018-0918234호",
    representative: "박대표",
    tel: "1588-7788",
    portfolio: [
      {
        title: "아파트 싱크볼 일체형 하이엔드 초음파 세척기 B2B 특판 런칭",
        date: "2026.10.05",
        summary: "소비자가 165만원 상당 프리미엄 모델 단지 10인 공구 시 68만원 파격 공급.",
      },
      {
        title: "스마트공방 기술보급 사업 수작업 조립 자동화 국비 3,600만원 수혜",
        date: "2026.07.20",
        summary: "수율 99.8% 달성 및 전국 아파트 관리사무소 공동구매 납품 개시.",
      },
    ],
  },
};

// ============================================================================
// t.note 최신 현장 소식 타임라인 데이터
// ============================================================================
interface TNoteTimelineEntry {
  id: string;
  date: string;
  author: string;
  role: string;
  title: string;
  summary: string;
  tag: string;
}

const APT_TNOTE_TIMELINE: TNoteTimelineEntry[] = [
  {
    id: "tnote-apt-01",
    date: "2026.10.13 15:20",
    author: "김기전 주임",
    role: "관리사무소 기전실",
    title: "승강기 1~4호기 와이어로프 정기 비파괴검사 적합 판정",
    summary: "한국승강기안전공단 정밀안전점검 완료. CERA 안전 지수 적합 유지 및 K-apt 전자공시 완료.",
    tag: "시설 점검",
  },
  {
    id: "tnote-apt-02",
    date: "2026.10.10 11:30",
    author: "박관리 소장",
    role: "공인 주택관리사",
    title: "3년 법정 장기수선계획 정기조정안 CERA 엔진 적정가 시뮬레이션",
    summary: "옥상 우레탄 방수 및 외벽 재도장 표준단가 산출 완료. 입대의 정기회의 상정 준비.",
    tag: "장기수선",
  },
  {
    id: "tnote-apt-03",
    date: "2026.10.05 16:45",
    author: "이동대표 감사",
    role: "입주자대표회의",
    title: "단지 10인 공구 친환경 초음파 식기세척기 검수 및 세대 직배송",
    summary: "제조사 (주)탑소닉 본사 직공급 검수 통과. 입주민 설치 만족도 98% 달성.",
    tag: "공동구매",
  },
];

const STORE_TNOTE_TIMELINE: TNoteTimelineEntry[] = [
  {
    id: "tnote-store-01",
    date: "2026.10.12 09:30",
    author: "김로스터 대표",
    role: "헤드 바리스타",
    title: "스페셜티 에티오피아 햇원두 입고 및 프로파일 로스팅 완료",
    summary: "결점두 핸드픽 및 커핑 스코어 87.5점 확인. 상계동 단지 정기배송 1차 출고 시작.",
    tag: "로스팅 일지",
  },
  {
    id: "tnote-store-02",
    date: "2026.10.08 14:10",
    author: "박설비 팀장",
    role: "제조 파트너스",
    title: "소상공인 스마트상점 기술보급 국비지원 키오스크 정산 완료",
    summary: "중기부·소진공 전담 감리 합격. 결제 대기시간 40% 단축 및 무인 주문 테스트 완료.",
    tag: "정부 지원",
  },
  {
    id: "tnote-store-03",
    date: "2026.10.02 17:00",
    author: "매장 총괄",
    role: "파트너 대표",
    title: "Today 하이퍼로컬 직거래 소싱 룸 엠버서더 픽 제휴 체결",
    summary: "노원구 지역 엠버서더 12명과 리퍼럴 제휴 개시. 오프라인 매장 방문 쿠폰 연동.",
    tag: "제휴 협약",
  },
];

// ============================================================================
// LinkPick 추천샵 (쿠팡 1초 담기 딥링크 상품)
// ============================================================================
// LinkPick 추천샵 (쿠팡 1초 담기 딥링크 상품)
// ============================================================================
interface BizLinkPickProduct {
  id: string;
  coupangProductId: string;
  title: string;
  category: string;
  specialPrice: string; // 특판가
  originalPrice?: string; // 정가
  discountRate?: string; // 할인율
  badge: string;
  providerComment: string; // 공급자 픽 코멘트
  imageEmoji: string;
  fallbackUrl: string;
}

const APT_LINKPICK_PRODUCTS: BizLinkPickProduct[] = [
  {
    id: "lp-apt-01",
    coupangProductId: "748291039",
    title: "아파트 싱크볼 일체형 초음파 식기·과일세척기",
    category: "친환경 주방 설비",
    specialPrice: "680,000원",
    originalPrice: "1,650,000원",
    discountRate: "58%",
    badge: "단지 10인 공구 1위",
    providerComment: "관리사무소 픽: 주방 잔류 농약 99.9% 세척 및 식기 소독. 단지 입주민 10인 공구 성사 시 특별 B2B 단체 할인가 적용.",
    imageEmoji: "🧼",
    fallbackUrl: "https://link.coupang.com/a/748291039",
  },
  {
    id: "lp-apt-02",
    coupangProductId: "619284102",
    title: "옥상 탄성 우레탄 방수제 하도/상도 세트 (18kg)",
    category: "공용시설 보수 자재",
    specialPrice: "79,000원",
    originalPrice: "115,000원",
    discountRate: "31%",
    badge: "K-apt CERA 규격",
    providerComment: "기전실 픽: 관리사무소 직영 보수 및 장기수선계획 CERA 표준 시공자재 공인 인증 규격품.",
    imageEmoji: "🏢",
    fallbackUrl: "https://link.coupang.com/a/619284102",
  },
  {
    id: "lp-apt-03",
    coupangProductId: "827103941",
    title: "승강기 및 공용부 500만화소 적외선 보안 CCTV 돔",
    category: "단지 안전 인프라",
    specialPrice: "54,000원",
    originalPrice: "89,000원",
    discountRate: "39%",
    badge: "지자체 지원 매칭",
    providerComment: "보안팀 픽: 노후 아파트 공용시설물 보수 지자체 매칭 지원사업 승인 규격 방범 카메라.",
    imageEmoji: "📹",
    fallbackUrl: "https://link.coupang.com/a/827103941",
  },
  {
    id: "lp-apt-04",
    coupangProductId: "918274019",
    title: "제주 산지직송 무농약 고당도 조생감귤 (5kg)",
    category: "산지직송 친환경 먹거리",
    specialPrice: "18,900원",
    originalPrice: "29,000원",
    discountRate: "35%",
    badge: "입주민 직거래 특판",
    providerComment: "입대의 픽: 10X 상생 파트너스 연계로 유통 마진 없이 단지 일괄 직배송되는 신선 먹거리.",
    imageEmoji: "🍊",
    fallbackUrl: "https://link.coupang.com/a/918274019",
  },
];

const STORE_LINKPICK_PRODUCTS: BizLinkPickProduct[] = [
  {
    id: "lp-store-01",
    coupangProductId: "738192041",
    title: "노원 로스터리 스페셜티 예가체프 당일 로스팅 원두 (1kg)",
    category: "스페셜티 커피",
    specialPrice: "24,500원",
    originalPrice: "36,000원",
    discountRate: "32%",
    badge: "단골 인기 1위",
    providerComment: "사장님 픽: 상계동 매장에서 직접 프로파일링 로스팅한 최상급 싱글 오리진 아라비카 원두.",
    imageEmoji: "☕",
    fallbackUrl: "https://link.coupang.com/a/738192041",
  },
  {
    id: "lp-store-02",
    coupangProductId: "748291039",
    title: "(주)탑소닉 특허 스마트 초음파 세척기 B2B 특판형",
    category: "매장 위생 설비",
    specialPrice: "850,000원",
    originalPrice: "1,790,000원",
    discountRate: "52%",
    badge: "소공인 혁신 기술",
    providerComment: "대표님 픽: 수작업 설거지 노동 80% 절감 및 온수/세제 비용 획기적 절약 상업용 특화 모델.",
    imageEmoji: "⚙️",
    fallbackUrl: "https://link.coupang.com/a/748291039",
  },
  {
    id: "lp-store-03",
    coupangProductId: "519283019",
    title: "매장 포스·키오스크 프리미엄 무독성 감열지 79x80 (50롤)",
    category: "매장 운영 소모품",
    specialPrice: "32,000원",
    originalPrice: "48,000원",
    discountRate: "33%",
    badge: "대용량 B2B 특가",
    providerComment: "점장님 픽: BPA 프리 친환경 감열지. 노원 상권 소상공인 공동구매 공급단가 적용 상품.",
    imageEmoji: "🧾",
    fallbackUrl: "https://link.coupang.com/a/519283019",
  },
  {
    id: "lp-store-04",
    coupangProductId: "618290341",
    title: "식약처 인증 식품접객업 매장 살균 소독제 (4L)",
    category: "안심 위생 방역",
    specialPrice: "16,500원",
    originalPrice: "25,000원",
    discountRate: "34%",
    badge: "HACCP 기준 충족",
    providerComment: "위생팀 픽: 매장 테이블 및 조리 도구 안심 분무 소독. 잔류 화학물질 없는 친환경 살균수.",
    imageEmoji: "✨",
    fallbackUrl: "https://link.coupang.com/a/618290341",
  },
];

// ============================================================================
// 비즈홈 메인 콘텐츠 컴포넌트
// ============================================================================
function BizHomeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const bizId = (params?.bizId as string) || "apt-sanggye14";
  const refParam = searchParams.get("ref") || "";

  const isApt = bizId.startsWith("apt-");
  const bizType: BizType = isApt ? "APT" : bizId.startsWith("corp-") ? "CORP" : "STORE";

  // 기본 정보 추출
  const aptData = isApt
    ? MOCK_APT_DATABASE[bizId] || {
        name: decodeURIComponent(bizId.replace("apt-", "")).toUpperCase() + " 단지",
        householdCount: 840,
        approvalDate: "1995.08.14",
        hallwayType: "계단식",
        heatingType: "개별난방",
        address: "서울특별시 노원구 공용단지로 45",
        dong: "상계동",
        tel: "02-938-1400",
        ceraScore: 92,
        news: [
          {
            title: `${decodeURIComponent(bizId.replace("apt-", ""))} K-apt 투명 공시 및 지자체 감사 대비 진단`,
            source: "아파트저널",
            date: "2026.10.10",
            summary: "CERA 투명도 지수 기반 장기수선계획 정기조정 및 시설물 입찰 검토.",
          },
        ],
      }
    : null;

  const storeData = !isApt
    ? MOCK_STORE_DATABASE[bizId] || {
        name: decodeURIComponent(bizId.replace("store-", "").replace("corp-", "")),
        openDate: "2022.06.01",
        category: "일반 소상공인 · 전문 회원사",
        address: "서울특별시 노원구 상계로 88",
        dong: "상계동",
        licenseNo: "제2022-094182호",
        representative: "대표자",
        tel: "02-930-1000",
        portfolio: [
          {
            title: "Today 하이퍼로컬 직거래 소싱 룸 입점 및 엠버서더 파트너십",
            date: "2026.10.01",
            summary: "회원사 제조원가 직공급 및 리퍼럴 수수료 8% 엠버서더 킷 연동.",
          },
        ],
      }
    : null;

  const title = isApt ? aptData?.name || "아파트 비즈 홈" : storeData?.name || "상점 비즈 홈";
  const telHref = isApt ? `tel:${aptData?.tel || "02-938-1400"}` : `tel:${storeData?.tel || "02-930-1000"}`;

  // 상태 관리
  const [claimStatus, setClaimStatus] = useState<BizClaimStatus>("UNCLAIMED");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 로컬스토리지 소유권 이전 신청 내역 확인
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`today_biz_claim_status_${bizId}`) as BizClaimStatus | null;
      if (saved) {
        setClaimStatus(saved);
      }
    } catch {}

    const handleClaimEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ bizId: string; claim: BizClaimRequest }>;
      if (customEvent.detail?.bizId === bizId) {
        setClaimStatus("CLAIM_PENDING");
      }
    };
    window.addEventListener("today_biz_claimed", handleClaimEvent);
    return () => window.removeEventListener("today_biz_claimed", handleClaimEvent);
  }, [bizId]);

  // 쿠팡 앱 1초 장바구니 담기 딥링크 실행 핸들러 (모바일 앱 스킴 + 웹 폴백 무결성)
  const handleCoupangCart = (productId: string, fallbackUrl: string, productTitle: string) => {
    const refCode = refParam || "today_biz";
    const appScheme = `coupang://product/${productId}?subId=${encodeURIComponent(refCode)}`;
    const webUrl = fallbackUrl.includes("subId=")
      ? fallbackUrl
      : `${fallbackUrl}${fallbackUrl.includes("?") ? "&" : "?"}subId=${encodeURIComponent(refCode)}`;

    setToastMessage(`🛒 [${productTitle}] 쿠팡으로 1초 연결합니다! (앱 미설치 시 웹으로 자동 이동)`);
    setTimeout(() => setToastMessage(null), 3000);

    const start = Date.now();
    let hasHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hasHidden = true;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

    // 모바일 딥링크 시도
    try {
      window.location.href = appScheme;
    } catch {
      window.location.href = webUrl;
      return;
    }

    // 앱 미설치 시 1.2초 후 웹 폴백 (앱이 열려서 브라우저가 백그라운드로 전환된 경우 폴백 스킵)
    setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!hasHidden && Date.now() - start < 2500) {
        window.location.href = webUrl;
      }
    }, 1200);
  };

  const timelineEntries = isApt ? APT_TNOTE_TIMELINE : STORE_TNOTE_TIMELINE;
  const linkpickProducts = isApt ? APT_LINKPICK_PRODUCTS : STORE_LINKPICK_PRODUCTS;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 selection:bg-amber-500/20 selection:text-amber-950 font-sans">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white font-medium text-xs">
                {isApt ? "🏢" : "🍽️"}
              </span>
              <h1 className="text-sm font-medium text-slate-900 truncate tracking-tight">
                {title} <span className="text-slate-400 font-normal">비즈홈</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={telHref}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="전화 연결"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">전화상담</span>
            </a>
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
            >
              Today. 홈
            </Link>
          </div>
        </div>
      </header>

      {/* 미인증 상태 시 소유권 이전 권유 상단 띠배너 */}
      {claimStatus === "UNCLAIMED" && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 border-b border-amber-600">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-medium">
                공식 등록
              </span>
              <p className="text-xs sm:text-[13px] font-normal truncate">
                {isApt ? (
                  <>
                    🏢 <strong>[{title}]</strong> 관리사무소장 또는 입대의 회장이신가요?
                  </>
                ) : (
                  <>
                    🍽️ <strong>[{title}]</strong> 대표님이신가요?
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="shrink-0 px-3 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              {isApt ? "공식 소유권 이전 신청 →" : "무료로 소유권 가져오기 →"}
            </button>
          </div>
        </div>
      )}

      {claimStatus === "CLAIM_PENDING" && (
        <div className="bg-slate-50 border-b border-slate-200 text-slate-700 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-normal">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>소유권 이전 심사 대기 중입니다. 최고관리자 검토 후 관리자 권한이 부여됩니다.</span>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">심사중 (CLAIM_PENDING)</span>
          </div>
        </div>
      )}

      {/* 메인 컨테이너 */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* 1초 LinkPick 초고속 배포 툴바 고정 배치 */}
        <QuickShareToolbar
          userId={bizId}
          userName={title}
          customUrl={`https://today.or.kr/biz/${bizId}${refParam ? `?ref=${encodeURIComponent(refParam)}` : ""}`}
        />

        {/* ============================================================== */}
        {/* [섹션 1: 상단 B2B 비즈홈 메인 카드]                            */}
        {/* ============================================================== */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium text-slate-900 tracking-tight">{title}</h2>
                {isApt ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                    CERA 인증 {aptData?.ceraScore || 94}점 (AAA)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    인증 회원사
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{isApt ? aptData?.address : storeData?.address}</span>
              </p>
            </div>

            {/* 전화상담 & 맞춤 견적서 신청 버튼 그룹 */}
            <div className="flex items-center gap-2">
              <a
                href={telHref}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>{isApt ? "관리실 전화" : "전화 직통 상담"}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsEstimateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                <span>📋 맞춤 견적서 신청</span>
              </button>
            </div>
          </div>

          {/* 공공데이터 스펙 그리드 */}
          {isApt && aptData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-normal">총 세대수</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {aptData.householdCount.toLocaleString()} 세대
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-normal">사용승인일</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{aptData.approvalDate}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-normal">복도 유형</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{aptData.hallwayType}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-normal">난방 방식</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{aptData.heatingType}</p>
              </div>
            </div>
          ) : (
            storeData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">업종/분류</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{storeData.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">개업일자</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.openDate}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">인허가 번호</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{storeData.licenseNo}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">대표자</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.representative}</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* ============================================================== */}
        {/* [섹션 2: 착한아파트 지수 또는 B2B CERA 진단 섹션]              */}
        {/* ============================================================== */}
        {isApt && aptData && (
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs">
            <CleanTrustScoreCard currentDong={aptData.dong} initialApartmentName={aptData.name} />
          </div>
        )}

        {/* ============================================================== */}
        {/* [섹션 3: t.note 최신 현장 소식 타임라인 바인딩]                 */}
        {/* ============================================================== */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                t.note 최신 현장 소식 타임라인
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">공식 업무 일지 실시간 바인딩</span>
          </div>

          <div className="space-y-3">
            {timelineEntries.map((item) => (
              <div
                key={item.id}
                className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden"
              >
                <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-900" />
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{item.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 text-[10px]">
                        {item.tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                    {item.summary}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100/60 pt-1.5">
                    <span>작성자: {item.author} ({item.role})</span>
                    <span className="text-emerald-700 font-medium">✓ t.note 인증 완료</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* [섹션 4: 하단 LinkPick 추천샵 (쿠팡 1초 담기 딥링크)]           */}
        {/* ============================================================== */}
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                  [LinkPick 파트너스 추천 비품 / 공구 샵]
                </h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-medium">
              쿠팡 파트너스 연동
            </span>
          </div>

          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            {isApt
              ? "단지 관리 및 입주민 공동구매를 위해 관리소와 CERA 엔진이 엄선한 필수 규격 상품입니다."
              : "매장 대표님이 엄선하여 제휴 공급하는 신뢰도 100% 추천 아이템 리스트입니다."}
          </p>

          {/* 상품 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {linkpickProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div>
                  {/* 상단 썸네일 & 카테고리/뱃지/상품명 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 text-lg shadow-2xs">
                        {prod.imageEmoji}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-normal">{prod.category}</span>
                        <h4 className="text-xs font-medium text-slate-900 line-clamp-1 leading-snug">
                          {prod.title}
                        </h4>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-medium">
                      {prod.badge}
                    </span>
                  </div>

                  {/* 특판가 및 할인율 표기 */}
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-red-600">
                      {prod.specialPrice}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-red-50 text-red-600 font-semibold border border-red-100">
                      특판가
                    </span>
                    {prod.originalPrice && (
                      <span className="text-[11px] text-slate-400 line-through">
                        {prod.originalPrice}
                      </span>
                    )}
                    {prod.discountRate && (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {prod.discountRate} OFF
                      </span>
                    )}
                  </div>

                  {/* 공급자 픽 코멘트 */}
                  <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-slate-100 text-[11px] text-slate-600 font-normal leading-relaxed">
                    <p>
                      <strong className="text-slate-900 font-medium">💡 공급자 픽:</strong>{" "}
                      {prod.providerComment}
                    </p>
                  </div>
                </div>

                {/* 쿠팡 앱 1초 장바구니 담기 딥링크 버튼 */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCoupangCart(prod.coupangProductId, prod.fallbackUrl, prod.title)}
                    className="w-full py-2 px-3 rounded-lg bg-[#E01E26] hover:bg-[#C9181F] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>🛒 쿠팡 앱 1초 담기</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 공정위 필수 문구 자동 표기 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-normal leading-relaxed">
            <p className="flex items-center gap-1.5 text-slate-600">
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>
                <strong>공정위 지침 고지</strong>: 이 포스팅은 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.
              </span>
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* [섹션 5: 네이버 뉴스 실시간 검색 연동 카드 (아파트)]           */}
        {/* ============================================================== */}
        {isApt && aptData && (
          <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                  {aptData.name} 관련 실시간 팩트 뉴스 & 공시
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">네이버 뉴스 API 연동</span>
            </div>

            <div className="space-y-2">
              {aptData.news.map((n, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-slate-800 line-clamp-1">{n.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{n.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed line-clamp-2">
                    {n.summary}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>출처: {n.source}</span>
                    <span className="text-amber-600 font-medium">원문 보기 ↗</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 모바일 1-Tap 홈 화면 설치 배너 탑재 */}
      <PwaInstallBanner
        bizId={bizId}
        bizName={title}
        bizType={bizType}
        referrerId={refParam}
      />

      {/* 소유권 이전 (Claim) 모달 */}
      <BizOwnershipClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        bizId={bizId}
        bizTitle={title}
        bizType={bizType}
        onSuccess={() => {
          setClaimStatus("CLAIM_PENDING");
        }}
      />

      {/* 공인 견적서 신청 모달 (금액 미표기 원칙 준수) */}
      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-100 shadow-2xl p-5 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-medium text-slate-900">
                  {title} 공인 견적서 신청
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEstimateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              K-apt 실거래 및 CERA 엔진 기반 공인 견적서가 생성되어 등록된 이메일과 알림톡으로 발송됩니다.
              (담합 방지를 위해 임의 견적 금액을 노출하지 않고 실사 리포트로 제공됩니다.)
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  신청 항목 선택
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs">
                  <option>1. 승강기 전면교체 / 제어반 보수 적정가 리포트</option>
                  <option>2. 옥상 우레탄 방수 및 외벽 재도장 CERA 산출</option>
                  <option>3. 3년 법정 장기수선계획 정기조정 및 장충금 진단</option>
                  <option>4. 친환경 설비 및 단지 10인 공구 B2B 특판 자재</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  담당자 성명 및 직책
                </label>
                <input
                  type="text"
                  placeholder="예: 관리소장 홍길동 / 대표자"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  담당자 연락처
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert("공인 견적서 신청이 완료되었습니다! 담당 CERA 컨설턴트가 24시간 내 배정됩니다.");
                setIsEstimateModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              무료 공인 맞춤 견적서 접수
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BizHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        </div>
      }
    >
      <BizHomeContent />
    </Suspense>
  );
}
