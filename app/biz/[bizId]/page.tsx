"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
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
  Sparkles,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import BizOwnershipClaimModal from "@/components/biz/BizOwnershipClaimModal";
import CleanTrustScoreCard from "@/components/portal/CleanTrustScoreCard";
import type { BizType, BizClaimStatus, BizClaimRequest } from "@/types/biz";

// 모의 데이터 맵 (아파트 & 상점)
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

function BizHomeContent() {
  const params = useParams();
  const router = useRouter();
  const bizId = (params?.bizId as string) || "apt-sanggye14";

  const isApt = bizId.startsWith("apt-");
  const bizType: BizType = isApt ? "APT" : bizId.startsWith("corp-") ? "CORP" : "STORE";

  // 기본 정보 추출 (DB 또는 자동 생성 Fallback)
  const aptData = isApt
    ? MOCK_APT_DATABASE[bizId] || {
        name: decodeURIComponent(bizId.replace("apt-", "")).toUpperCase() + " 단지",
        householdCount: 840,
        approvalDate: "1995.08.14",
        hallwayType: "계단식",
        heatingType: "개별난방",
        address: "서울특별시 노원구 공용단지로 45",
        dong: "상계동",
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

  // 소유권 상태: UNCLAIMED | CLAIM_PENDING | CLAIMED
  const [claimStatus, setClaimStatus] = useState<BizClaimStatus>("UNCLAIMED");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-amber-500/20 selection:text-amber-950 font-sans">
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
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white font-medium text-xs">
                {isApt ? "🏢" : "🍽️"}
              </span>
              <h1 className="text-sm font-medium text-slate-900 truncate tracking-tight">
                {title} <span className="text-slate-400 font-normal">공식 비즈 홈</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
            >
              Today. 홈
            </Link>
          </div>
        </div>
      </header>

      {/* 미인증 상태 시 소유권 이전 권유 상단 띠배너 */}
      {claimStatus === "UNCLAIMED" && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5">
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
        <div className="bg-indigo-50 border-b border-indigo-100 text-indigo-900 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-normal">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>
                소유권 이전 심사 대기 중입니다. 최고관리자 검토 후 관리자 권한이 부여됩니다.
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">심사중 (CLAIM_PENDING)</span>
          </div>
        </div>
      )}

      {/* 메인 컨테이너 */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* ============================================================== */}
        {/* [A형: 아파트 비즈 홈 상세]                                      */}
        {/* ============================================================== */}
        {isApt && aptData && (
          <>
            {/* 단지 기본 스펙 & CERA 지수 요약 카드 */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                      {aptData.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                      CERA 인증 {aptData.ceraScore}점 (AAA)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{aptData.address}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEstimateModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                    <span>공인 견적서 신청</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("비즈 홈 링크가 복사되었습니다!");
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="링크 공유"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* K-apt 공공데이터 4대 스펙 그리드 */}
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
            </div>

            {/* 착한아파트 4대 평가 지수 라이브 게이지 임베드 */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs">
              <CleanTrustScoreCard
                currentDong={aptData.dong}
                initialApartmentName={aptData.name}
              />
            </div>

            {/* 네이버 뉴스 검색 연동 카드: 해당 아파트/동네 실시간 뉴스 */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs space-y-3">
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
          </>
        )}

        {/* ============================================================== */}
        {/* [B형: 일반 상점/신설 법인 비즈 홈 상세]                        */}
        {/* ============================================================== */}
        {!isApt && storeData && (
          <>
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                      {storeData.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
                      인증 회원사
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{storeData.address}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${storeData.tel}`}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-400" />
                    <span>전화 직통 상담</span>
                  </a>
                </div>
              </div>

              {/* 사업자 공공데이터 스펙 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">업종/분류</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">개업일자</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.openDate}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">인허가 번호</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.licenseNo}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-normal">대표자 / 문의</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{storeData.representative}</p>
                </div>
              </div>
            </div>

            {/* t.note 시공 실적 & 카탈로그 포트폴리오 */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                    t.note 인증 시공 실적 및 회원사 카탈로그
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">실시간 업데이트</span>
              </div>

              <div className="space-y-2">
                {storeData.portfolio.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-900">{p.title}</span>
                      <span className="text-[10px] text-slate-400">{p.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
                      {p.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

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

      {/* 공인 견적서 신청 모달 */}
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
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              K-apt 실거래 및 CERA 엔진 기반 공인 견적서가 생성되어 등록된 이메일과 알림톡으로 발송됩니다.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  신청 항목 선택
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white">
                  <option>1. 승강기 전면교체 / 제어반 보수 적정가 리포트</option>
                  <option>2. 옥상 우레탄 방수 및 외벽 재도장 CERA 산출</option>
                  <option>3. 3년 법정 장기수선계획 정기조정 및 장충금 진단</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  담당자 연락처
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert("공인 견적서 신청이 완료되었습니다! 담당 CERA 컨설턴트가 24시간 내 배정됩니다.");
                setIsEstimateModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
            >
              무료 공인 견적서 접수
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
