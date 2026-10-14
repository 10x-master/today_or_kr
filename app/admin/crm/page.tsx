"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  Eye,
  Filter,
  Flame,
  Globe,
  MapPin,
  Megaphone,
  MousePointerClick,
  Plus,
  Power,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
  Zap,
  Building,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { AuthProfile, MembershipTier, UserProfile } from "@/types/auth";
import type { AdStatus, LocalAd } from "@/types/officialNotice";
import type { LocalPost } from "@/types/local";
import type { BizClaimRequest } from "@/types/biz";
import {
  mockUsers,
  mockLocalAds,
  mockLocalPosts,
  formatRelativeTime,
} from "@/lib/db/mockSeed";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import {
  isSuperAdmin,
  getUserDongPins,
  getMaxSlotsForScore,
} from "@/lib/dong/pinManager";
import RealtimeAlertBanner from "@/components/admin/RealtimeAlertBanner";
import GroupBuyApprovalQueue from "@/components/admin/GroupBuyApprovalQueue";
import BizClaimReviewQueue from "@/components/admin/BizClaimReviewQueue";
import BizboardAdOrderModal from "@/components/commerce/BizboardAdOrderModal";

type CrmTab = "groupbuys" | "claims" | "ads" | "users" | "supporters";

interface SupporterCandidate {
  id: string;
  name: string;
  dong: string;
  phone: string;
  appliedAt: string;
  pinScore: number; // 20점 만점
  scrapScore: number; // 20점 만점
  linkpickScore: number; // 30점 만점
  communityScore: number; // 30점 만점
  totalScore: number; // 100점 만점
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
}

const mockCandidates: SupporterCandidate[] = [
  {
    id: "cand-001",
    name: "박노원",
    dong: "상계동",
    phone: "010-1234-5678",
    appliedAt: "2026-10-12T14:30:00.000Z",
    pinScore: 20,
    scrapScore: 20,
    linkpickScore: 30,
    communityScore: 30,
    totalScore: 100,
    status: "APPROVED",
    note: "100점 만점 달성. 상계주공 5단지 앰버서더 자동 승인 완료",
  },
  {
    id: "cand-002",
    name: "최상계",
    dong: "상계동",
    phone: "010-5555-6666",
    appliedAt: "2026-10-13T09:15:00.000Z",
    pinScore: 20,
    scrapScore: 20,
    linkpickScore: 25,
    communityScore: 25,
    totalScore: 90,
    status: "PENDING",
    note: "링크픽 제휴 상품 1건 추가 공유 시 100점 달성 예정",
  },
  {
    id: "cand-003",
    name: "이돌산",
    dong: "돌산읍",
    phone: "010-9876-5432",
    appliedAt: "2026-10-13T11:00:00.000Z",
    pinScore: 20,
    scrapScore: 15,
    linkpickScore: 20,
    communityScore: 20,
    totalScore: 75,
    status: "PENDING",
    note: "여수 돌산읍 로컬 특산물 앰버서더 신청",
  },
  {
    id: "cand-004",
    name: "정중계",
    dong: "중계동",
    phone: "010-8888-9999",
    appliedAt: "2026-10-11T16:20:00.000Z",
    pinScore: 10,
    scrapScore: 10,
    linkpickScore: 10,
    communityScore: 15,
    totalScore: 45,
    status: "REJECTED",
    note: "필수 참여 활동 점수 미달 (최소 70점 필요)",
  },
];

const mockBizClaims: BizClaimRequest[] = [
  {
    id: "claim-001",
    bizId: "apt-sanggye14",
    bizTitle: "상계주공 14단지",
    bizType: "APT",
    applicantName: "김소장",
    applicantRole: "MANAGER",
    applicantPhone: "010-3849-1188",
    applicantEmail: "sanggye14.mgr@apt.kr",
    proofDocumentName: "상계주공14단지_관리사무소_고유번호증.pdf",
    submittedAt: "2026-10-13T10:20:00.000Z",
    status: "PENDING",
  },
  {
    id: "claim-002",
    bizId: "store-nowon-roastery",
    bizTitle: "노원 로스터리 상계점",
    bizType: "STORE",
    applicantName: "김노원",
    applicantRole: "REPRESENTATIVE",
    applicantPhone: "010-9922-1200",
    applicantEmail: "nowon.roastery@gmail.com",
    proofDocumentName: "사업자등록증_스캔본.jpg",
    submittedAt: "2026-10-12T15:00:00.000Z",
    status: "APPROVED",
  },
  {
    id: "claim-003",
    bizId: "corp-topsonic",
    bizTitle: "(주)탑소닉 테크놀로지",
    bizType: "CORP",
    applicantName: "박대표",
    applicantRole: "REPRESENTATIVE",
    applicantPhone: "010-5840-7788",
    applicantEmail: "ceo@topsonic.kr",
    proofDocumentName: "법인사업자등록증_공장등록증.pdf",
    submittedAt: "2026-10-11T11:45:00.000Z",
    status: "APPROVED",
  },
];

export default function AdminCrmPage() {
  const [activeTab, setActiveTab] = useState<CrmTab>("groupbuys");
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [forceAdminMode, setForceAdminMode] = useState(true); // 페어프로그래밍/데모용 최고관리자 강제 활성화
  const [isAdOrderModalOpen, setIsAdOrderModalOpen] = useState(false);

  // 상태 관리: 회원 목록
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // 상태 관리: 서포터즈 심사
  const [candidates, setCandidates] = useState<SupporterCandidate[]>(mockCandidates);
  const [candidateFilter, setCandidateFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // 상태 관리: 비즈보드 광고
  const [ads, setAds] = useState<LocalAd[]>(mockLocalAds);
  const [adFilter, setAdFilter] = useState<"ALL" | AdStatus>("ALL");

  // 상태 관리: 비즈 홈 소유권 이전 심사
  const [bizClaims, setBizClaims] = useState<BizClaimRequest[]>([]);
  const [claimFilter, setClaimFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // 토스트 피드백
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentAuthUser();
      setCurrentUser(user);
    };
    fetchUser();

    try {
      const saved = localStorage.getItem("today_biz_claims");
      if (saved) {
        setBizClaims(JSON.parse(saved));
      } else {
        setBizClaims(mockBizClaims);
        localStorage.setItem("today_biz_claims", JSON.stringify(mockBizClaims));
      }
    } catch {
      setBizClaims(mockBizClaims);
    }

    try {
      const customAds = localStorage.getItem("today_custom_ads");
      if (customAds) {
        const parsed: LocalAd[] = JSON.parse(customAds);
        setAds((prev) => [
          ...parsed,
          ...prev.filter((a) => !parsed.some((p) => p.id === a.id)),
        ]);
      }
    } catch {}
  }, []);

  const adminAuthorized = forceAdminMode || isSuperAdmin(currentUser);

  // 1. 회원 등급 변경
  const handleTierChange = (userId: string, newTier: MembershipTier) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, membershipTier: newTier } : u))
    );
    showToast(`회원 등급이 '${newTier === "association_regular" ? "협회 정회원" : "일반 회원"}'(으)로 업데이트되었습니다.`);
  };

  // 2. 포인트 지급
  const handleAwardPoints = (userId: string, points: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, tenXPoints: (u.tenXPoints || 0) + points } : u
      )
    );
    showToast(`${points} 10X 포인트가 지급되었습니다.`);
  };

  // 3. 서포터즈 심사 승인 / 반려
  const handleAuditCandidate = (
    candidateId: string,
    status: "APPROVED" | "REJECTED" | "PENDING"
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status } : c))
    );

    if (status === "APPROVED") {
      showToast("🎉 서포터즈 100점 심사 승인 완료! 정산 요율 상향 및 비즈보드 광고 지원이 적용되었습니다.");
    } else if (status === "REJECTED") {
      showToast("서포터즈 신청이 반려되었습니다.");
    } else {
      showToast("심사 상태가 재심사 대기(PENDING)로 변경되었습니다.");
    }
  };

  // 4. 비즈보드 광고 온오프 토글
  const handleToggleAdActive = (adId: string) => {
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          const nextActive = !ad.is_active;
          showToast(`광고가 ${nextActive ? "재개(ON)" : "일시중지(OFF)"}되었습니다.`);
          return { ...ad, is_active: nextActive };
        }
        return ad;
      })
    );
  };

  // 5. 비즈보드 상태 변경 (승인 / 반려)
  const handleAdStatusChange = (adId: string, status: AdStatus) => {
    setAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, status } : ad))
    );
    showToast(`광고 심사 상태가 '${status}'(으)로 변경되었습니다.`);
  };

  // 6. 비즈보드 전국 송출 워프 (Target: ALL)
  const handleWarpAdNationwide = (adId: string) => {
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          showToast(`광고가 전국 전역 송출(Target: ALL)로 워프되었습니다.`);
          return { ...ad, target_dongs: ["ALL"] };
        }
        return ad;
      })
    );
  };

  // 7. 노출수 부스트
  const handleBoostAd = (adId: string) => {
    setAds((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          showToast("⚡ 광고 노출수가 +1,000회 즉시 부스트되었습니다.");
          return { ...ad, impressions: ad.impressions + 1000 };
        }
        return ad;
      })
    );
  };

  // 8. 비즈 홈 소유권 이전 심사 승인 / 반려
  const handleApproveClaim = (claimId: string) => {
    setBizClaims((prev) => {
      const updated = prev.map((c) => {
        if (c.id === claimId) {
          try {
            localStorage.setItem(`today_biz_claim_status_${c.bizId}`, "CLAIMED");
          } catch {}
          return { ...c, status: "APPROVED" as const };
        }
        return c;
      });
      try {
        localStorage.setItem("today_biz_claims", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast("비즈 홈 소유권 이전이 공식 승인되었습니다.");
  };

  const handleRejectClaim = (claimId: string) => {
    setBizClaims((prev) => {
      const updated = prev.map((c) => {
        if (c.id === claimId) {
          try {
            localStorage.setItem(`today_biz_claim_status_${c.bizId}`, "UNCLAIMED");
          } catch {}
          return { ...c, status: "REJECTED" as const };
        }
        return c;
      });
      try {
        localStorage.setItem("today_biz_claims", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast("소유권 이전 신청이 반려 처리되었습니다.");
  };

  // 필터링된 데이터
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.registeredDong.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const filteredCandidates = candidates.filter((c) =>
    candidateFilter === "ALL" ? true : c.status === candidateFilter
  );

  const filteredAds = ads.filter((ad) =>
    adFilter === "ALL" ? true : ad.status === adFilter
  );

  const filteredClaims = bizClaims.filter((c) =>
    claimFilter === "ALL" ? true : c.status === claimFilter
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl bg-slate-50 px-4 py-8 sm:px-6">
      {/* 토스트 피드백 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. 상단 네비게이션 & 관리자 인증 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              홈으로
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/partners"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              파트너스 대시보드
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/workspace"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              t.note 워크스페이스
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/admin/radar"
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>🛰️ M-FAD 레이더</span>
            </Link>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              최고관리자 통합 CRM
            </h1>
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              SUPER_ADMIN
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            회원 등급 심사, 서포터즈 100점 배점 심사, 비즈보드 전역 광고 라이브 제어
          </p>
        </div>

        {/* 최고관리자 권한 토글 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setForceAdminMode(!forceAdminMode);
              showToast(
                !forceAdminMode
                  ? "최고관리자 모드가 활성화되었습니다."
                  : "최고관리자 모드가 비활성화되었습니다."
              );
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              forceAdminMode
                ? "border-rose-300 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-rose-600" />
            <span>관리자 권한 {forceAdminMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* 2. 핵심 요약 지표 카드 4종 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">총 관리 회원</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-slate-900">{users.length}명</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
            정회원 비율 {Math.round((users.filter((u) => u.membershipTier === "association_regular").length / users.length) * 100)}%
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">서포터즈 심사 대기</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-amber-900">
            {candidates.filter((c) => c.status === "PENDING").length}건
          </p>
          <p className="mt-1 text-[11px] text-amber-700 font-semibold">
            100점 달성자 {candidates.filter((c) => c.totalScore >= 100).length}명
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800">활성 비즈보드 광고</span>
            <Megaphone className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-blue-900">
            {ads.filter((a) => a.is_active && a.status === "APPROVED").length}개
          </p>
          <p className="mt-1 text-[11px] text-blue-700 font-semibold">
            총 노출 {ads.reduce((acc, cur) => acc + cur.impressions, 0).toLocaleString()}회
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">실시간 피드 모니터</span>
            <ShieldAlert className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1.5 text-2xl font-black text-emerald-900">
            {mockLocalPosts.length}건
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
            신고/블라인드 {mockLocalPosts.filter((p) => p.isBlinded).length}건
          </p>
        </div>
      </div>

      {/* 3. 3대 핵심 백오피스 통합 탭 스위처 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("groupbuys")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === "groupbuys"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>📋 공고/공구 승인함</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "groupbuys" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              10인 청원
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === "claims"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <Building className="h-4 w-4 text-amber-400" />
            <span>🏢 비즈홈 소유권 심사</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "claims" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}
            >
              Claim 심사
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ads")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === "ads"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <Megaphone className="h-4 w-4 text-rose-400" />
            <span>📢 비즈보드 광고 주문함</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "ads" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
              }`}
            >
              {ads.length}건
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "supporters" ? "users" : "users")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
            activeTab === "users" || activeTab === "supporters"
              ? "bg-slate-200 text-slate-900 font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>👥 회원 &amp; 서포터즈 관리</span>
        </button>
      </div>

      {/* 회원/서포터즈 하위 탭 토글 바 (해당 탭 활성화 시 노출) */}
      {(activeTab === "users" || activeTab === "supporters") && (
        <div className="mt-4 flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👥 회원 등급 &amp; 핀 ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("supporters")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === "supporters"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ⭐ 서포터즈 100점 심사 ({candidates.length})
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 1: 📋 주민 10인 공구 청원 승인함 */}
      {/* ========================================================================= */}
      {activeTab === "groupbuys" && (
        <div className="mt-6">
          <GroupBuyApprovalQueue />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 2: 🏢 비즈홈 소유권 이전(Claim) 심사 대기열 */}
      {/* ========================================================================= */}
      {activeTab === "claims" && (
        <div className="mt-6">
          <BizClaimReviewQueue />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 1: 회원 등급 및 동네 핀 관리 */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="mt-6 space-y-4">
          {/* 검색 및 필터 바 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="회원 이름, 행정동(예: 상계동), 이메일 검색..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              검색 결과: <strong className="text-slate-900">{filteredUsers.length}</strong>명
            </span>
          </div>

          {/* 회원 리스트 */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {filteredUsers.map((user) => {
              const pins = getUserDongPins(user.id);
              const maxSlots = getMaxSlotsForScore(user.tenXPoints || 0);

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{user.name}</span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        📍 {user.registeredDong}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          user.membershipTier === "association_regular"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.membershipTier === "association_regular" ? "👑 협회 정회원" : "일반 회원"}
                      </span>
                      <span className="text-[11px] text-slate-400">({user.phone})</span>
                    </div>

                    <p className="text-xs text-slate-500 truncate">
                      {user.email} • 추천코드: {user.referrerCode} • 10X포인트:{" "}
                      <strong className="text-indigo-600">{(user.tenXPoints || 0).toLocaleString()}P</strong>
                    </p>

                    {/* 핀 슬롯 현황 */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-600">
                        동네 핀 ({pins.length}/{maxSlots}슬롯):
                      </span>
                      {pins.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          <MapPin className="h-2.5 w-2.5 text-indigo-500" />
                          {p.dong_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 액션 컨트롤 */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <select
                      value={user.membershipTier}
                      onChange={(e) => handleTierChange(user.id, e.target.value as MembershipTier)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="free">일반 회원</option>
                      <option value="association_regular">👑 협회 정회원 (최대 5핀)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAwardPoints(user.id, 50)}
                      className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Coins className="h-3 w-3" />
                      +50P 지급
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 2: 서포터즈 100점 심사 */}
      {/* ========================================================================= */}
      {activeTab === "supporters" && (
        <div className="mt-6 space-y-4">
          {/* 상태 필터 바 */}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold text-slate-700">심사 상태 필터:</span>
            <div className="flex items-center gap-1.5">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCandidateFilter(st)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    candidateFilter === st
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "전체"
                    : st === "PENDING"
                    ? "⏳ 심사대기"
                    : st === "APPROVED"
                    ? "✓ 승인완료"
                    : "✕ 반려"}
                </button>
              ))}
            </div>
          </div>

          {/* 심사 후보자 카드 목록 */}
          <div className="space-y-3">
            {filteredCandidates.map((cand) => (
              <div
                key={cand.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{cand.name}</span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      📍 {cand.dong}
                    </span>
                    <span className="text-xs text-slate-400">({cand.phone})</span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      cand.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : cand.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {cand.status === "APPROVED"
                      ? "✓ 승인 완료 (100점)"
                      : cand.status === "REJECTED"
                      ? "✕ 반려됨"
                      : "⏳ 심사 대기중"}
                  </span>
                </div>

                {/* 점수 게이지 및 세부 배점 */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">활동 참여 총점</span>
                    <span
                      className={`text-sm ${
                        cand.totalScore >= 100
                          ? "text-emerald-600 font-black"
                          : "text-indigo-600"
                      }`}
                    >
                      {cand.totalScore} / 100점
                    </span>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        cand.totalScore >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(cand.totalScore, 100)}%` }}
                    />
                  </div>

                  {/* 세부 배점 태그 */}
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">동네 핀 등록 (20점)</span>
                      <strong className="text-slate-800">{cand.pinScore}점</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">고시 스크랩 (20점)</span>
                      <strong className="text-slate-800">{cand.scrapScore}점</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">링크픽 공유 (30점)</span>
                      <strong className="text-slate-800">{cand.linkpickScore}점</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">피드 소통 (30점)</span>
                      <strong className="text-slate-800">{cand.communityScore}점</strong>
                    </div>
                  </div>
                </div>

                {cand.note && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    📝 심사 메모: {cand.note}
                  </p>
                )}

                {/* 심사 버튼 액션 */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {cand.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleAuditCandidate(cand.id, "APPROVED")}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      100점 심사 승인
                    </button>
                  )}

                  {cand.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleAuditCandidate(cand.id, "REJECTED")}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      반려
                    </button>
                  )}

                  {cand.status !== "PENDING" && (
                    <button
                      type="button"
                      onClick={() => handleAuditCandidate(cand.id, "PENDING")}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      재심사 전환
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 3: 비즈보드 전역 광고 제어 & 부스트 신청 */}
      {/* ========================================================================= */}
      {activeTab === "ads" && (
        <div className="mt-6 space-y-4">
          {/* 상단 액션 및 설명 바 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
            <div>
              <h3 className="text-sm font-medium text-slate-900">
                상단 64px 비즈보드 광고 슬롯 및 캠페인 관리
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                동네별 64px 골든 슬롯 광고 주문을 심사하고 실시간 라이브 송출(ON/OFF) 및 노출수를 제어합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdOrderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Megaphone className="h-3.5 w-3.5 text-amber-400" />
              <span>+ 신규 비즈보드 부스트 신청</span>
            </button>
          </div>

          {/* 상태 필터 바 */}
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-xs font-bold text-slate-700">광고 심사 상태:</span>
            <div className="flex items-center gap-1.5">
              {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAdFilter(st)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    adFilter === st
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "전체"
                    : st === "APPROVED"
                    ? "승인됨"
                    : st === "PENDING"
                    ? "심사대기"
                    : "반려됨"}
                </button>
              ))}
            </div>
          </div>

          {/* 광고 캠페인 카드 목록 */}
          <div className="space-y-4">
            {filteredAds.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5"
                >
                  {/* 상단 파트너명 & 라이브 온오프 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{ad.partner_name}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        📍 등록: {ad.registered_dong}
                      </span>
                      <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">
                        🎯 타겟: {ad.target_dongs.join(", ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 온오프 토글 */}
                      <button
                        type="button"
                        onClick={() => handleToggleAdActive(ad.id)}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          ad.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Power className="h-3 w-3" />
                        {ad.is_active ? "라이브 송출중 (ON)" : "일시중지 (OFF)"}
                      </button>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          ad.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ad.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ad.status === "APPROVED" ? "승인됨" : ad.status === "REJECTED" ? "반려됨" : "심사대기"}
                      </span>
                    </div>
                  </div>

                  {/* 카카오 비즈보드 형태 프리뷰 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-indigo-600 font-bold block mb-0.5">
                        [비즈보드 실시간 프리뷰]
                      </span>
                      <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                        {ad.main_copy}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {ad.sub_copy}
                      </p>
                    </div>

                    <a
                      href={ad.landing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800"
                    >
                      랜딩 열기 ↗
                    </a>
                  </div>

                  {/* 광고 지표 통계 */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <span className="text-slate-400 block text-[10px]">노출수 (Impressions)</span>
                      <strong className="text-slate-900 text-sm">{ad.impressions.toLocaleString()}회</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <span className="text-slate-400 block text-[10px]">클릭수 (Clicks)</span>
                      <strong className="text-slate-900 text-sm">{ad.clicks.toLocaleString()}회</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <span className="text-slate-400 block text-[10px]">클릭률 (CTR)</span>
                      <strong className="text-indigo-600 text-sm">{ctr}%</strong>
                    </div>
                  </div>

                  {/* 전역 광고 관리 액션 바 */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleBoostAd(ad.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
                    >
                      <Zap className="h-3 w-3" />
                      +1,000회 노출 부스트
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWarpAdNationwide(ad.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <Globe className="h-3 w-3" />
                      전국 송출 워프 (Target: ALL)
                    </button>

                    {ad.status !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => handleAdStatusChange(ad.id, "APPROVED")}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        광고 승인
                      </button>
                    )}

                    {ad.status !== "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => handleAdStatusChange(ad.id, "REJECTED")}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        광고 반려
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 실시간 유저 글 감지 배너 연동 */}
      <RealtimeAlertBanner />

      {/* 비즈보드 광고 부스트 신청 모달 */}
      <BizboardAdOrderModal
        isOpen={isAdOrderModalOpen}
        onClose={() => setIsAdOrderModalOpen(false)}
        onOrderSubmitted={(newAd) => {
          setAds((prev) => [newAd, ...prev]);
          showToast("📢 신규 비즈보드 광고가 등록되었습니다!");
        }}
      />
    </div>
  );
}
