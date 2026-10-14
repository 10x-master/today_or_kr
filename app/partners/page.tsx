"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Eye,
  MousePointerClick,
  Plus,
  Power,
  RefreshCw,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import type { LocalAd, AdStatus } from "@/types/officialNotice";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import { isSuperAdmin } from "@/lib/dong/pinManager";
import CreateAdModal from "@/components/partners/CreateAdModal";

export default function PartnersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [ads, setAds] = useState<LocalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | AdStatus>("ALL");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // 사용자 정보 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentAuthUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const superAdmin = isSuperAdmin(currentUser);

  // 광고 목록 불러오기
  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/local-ads");
      const data = await res.json();
      if (data.ads) {
        setAds(data.ads);
      }
    } catch (err) {
      console.warn("Failed to fetch local ads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // 온/오프 토글 핸들러
  const handleToggleActive = async (ad: LocalAd) => {
    try {
      const res = await fetch("/api/local-ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ad.id,
          is_active: !ad.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ad) {
        setAds((prev) => prev.map((a) => (a.id === ad.id ? data.ad : a)));
        setFeedbackToast(
          data.ad.is_active
            ? `'${ad.main_copy}' 광고가 재개되었습니다.`
            : `'${ad.main_copy}' 광고가 일시중지되었습니다.`
        );
        setTimeout(() => setFeedbackToast(null), 2500);
      }
    } catch {
      setFeedbackToast("상태 변경에 실패했습니다.");
      setTimeout(() => setFeedbackToast(null), 2000);
    }
  };

  // 최고관리자 원클릭 승인/반려 제어
  const handleAdminStatusChange = async (ad: LocalAd, newStatus: AdStatus) => {
    try {
      const res = await fetch("/api/local-ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ad.id,
          status: newStatus,
          reject_reason: newStatus === "REJECTED" ? "부적절한 카피 또는 규격 미준수" : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ad) {
        setAds((prev) => prev.map((a) => (a.id === ad.id ? data.ad : a)));
        setFeedbackToast(
          newStatus === "APPROVED"
            ? `👑 '${ad.main_copy}' 광고를 즉시 승인(APPROVED)했습니다.`
            : `👑 '${ad.main_copy}' 광고를 반려(REJECTED) 처리했습니다.`
        );
        setTimeout(() => setFeedbackToast(null), 3000);
      }
    } catch {
      setFeedbackToast("상태 변경 실패");
      setTimeout(() => setFeedbackToast(null), 2000);
    }
  };

  // 통계 계산
  const activeAds = ads.filter((a) => a.status === "APPROVED" && a.is_active);
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  // 필터링된 광고 목록
  const filteredAds = ads.filter((a) => {
    if (selectedFilter === "ALL") return true;
    return a.status === selectedFilter;
  });

  // 잔여 일수 계산 헬퍼
  const getRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `D-${diff}` : "만료";
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-20">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <UnifiedHomeReturnAnchor />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900">
                  Partners 센터
                </span>
                <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-black text-amber-800 border border-amber-300">
                  비즈보드 광고
                </span>
                {superAdmin && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.2 text-[9px] font-black text-amber-400 flex items-center gap-0.5">
                    <Crown className="h-2.5 w-2.5" />
                    <span>최고관리자</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                지역 소상공인 & 아파트 단지 상권 광고 대시보드
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAds}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </header>

      {/* 피드백 토스트 알림 */}
      {feedbackToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 메인 대시보드 컨테이너 */}
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6 space-y-5">
        {/* ============================================================== */}
        {/* 1. 상단 파트너 요약 카드                                       */}
        {/* ============================================================== */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-slate-900">
                  {currentUser?.full_name ? `${currentUser.full_name} 비즈니스` : "노원 디자인 인테리어 라운지"}
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  인증 파트너사
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                등록 상권: <span className="font-bold text-slate-800">서울 노원구 상계동</span> (인근 5개동 연계)
              </p>
            </div>

            {/* 새 광고 부스트 CTA 버튼 */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 bg-[length:200%_auto] px-4 py-3 text-xs font-black text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4 fill-white" />
              <span>새 광고 부스트 만들기</span>
            </button>
          </div>

          {/* 핵심 지표 4열 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400">집행 중인 광고</span>
              <p className="mt-1 text-xl font-black text-slate-900">
                {activeAds.length} <span className="text-xs font-normal text-slate-500">건</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400">누적 노출 수</span>
              <p className="mt-1 text-xl font-black text-slate-900">
                {totalImpressions.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">회</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400">누적 클릭 수 (CTR)</span>
              <p className="mt-1 text-xl font-black text-amber-600">
                {totalClicks.toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-500">({avgCtr}%)</span>
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50/60 p-3 border border-amber-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900">광고 크레딧</span>
                <span className="text-[10px] font-bold text-amber-700 underline cursor-pointer">
                  충전
                </span>
              </div>
              <p className="mt-1 text-xl font-black text-amber-950">
                125,000 <span className="text-xs font-normal text-amber-800">P</span>
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. 집행 중인 광고 라이브 카드 (카카오 비즈보드 실시간 미리보기) */}
        {/* ============================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-black text-slate-900">
                집행 중인 라이브 비즈보드 배너 ({activeAds.length}건)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">홈 피드 3번째 행에 상시 노출 중</span>
          </div>

          {activeAds.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-xs font-bold text-slate-500">
                현재 라이브 집행 중인 광고가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>첫 비즈보드 광고 신청하기</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAds.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5"
                >
                  {/* 카카오 비즈보드 배너 프리뷰 컨테이너 */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-black text-slate-700">
                          AD
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">
                          {ad.partner_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          · {ad.target_dongs.join(", ")}
                        </span>
                      </div>

                      <p className="truncate text-sm font-black text-slate-900 leading-snug">
                        {ad.main_copy}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500 mt-0.5">
                        {ad.sub_copy}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                        <span>자세히 보기</span>
                        <span>›</span>
                      </div>
                    </div>

                    {ad.image_url && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.image_url}
                          alt={ad.main_copy}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* 하단 성과 지표 & 온/오프 토글 바 */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">
                          {ad.impressions.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">노출</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-bold text-amber-600">
                          {ad.clicks.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">클릭</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-emerald-700">
                          {getRemainingDays(ad.end_date)}
                        </span>
                        <span className="text-[10px] text-slate-400">남음</span>
                      </div>
                    </div>

                    {/* 온/오프 스위치 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                        ad.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      <span>{ad.is_active ? "광고 집행중" : "일시중지됨"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 3. 전체 광고 신청 및 심사 이력 리스트                          */}
        {/* ============================================================== */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900">
              광고 신청 및 심사 이력 ({ads.length}건)
            </h2>

            {/* 필터 탭 */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedFilter("ALL")}
                className={`rounded-lg px-2 py-0.5 transition-all ${
                  selectedFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("APPROVED")}
                className={`rounded-lg px-2 py-0.5 transition-all ${
                  selectedFilter === "APPROVED"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                승인완료
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("PENDING")}
                className={`rounded-lg px-2 py-0.5 transition-all ${
                  selectedFilter === "PENDING"
                    ? "bg-white text-amber-800 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                심사대기
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter("REJECTED")}
                className={`rounded-lg px-2 py-0.5 transition-all ${
                  selectedFilter === "REJECTED"
                    ? "bg-white text-rose-800 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                반려
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredAds.map((ad) => {
              const isApproved = ad.status === "APPROVED";
              const isPending = ad.status === "PENDING";
              const isRejected = ad.status === "REJECTED";

              return (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* 상태 뱃지 */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {isApproved && (
                          <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>승인 완료 (APPROVED)</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            <span>심사 대기중 (PENDING)</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="flex items-center gap-0.5 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-800 border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            <span>반려됨 (REJECTED)</span>
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-slate-500">
                          {ad.package_days}일 패키지
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">
                          타겟: {ad.target_dongs.join(", ")}
                        </span>
                      </div>

                      {/* 메인 카피 */}
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {ad.main_copy}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{ad.sub_copy}</p>

                      {/* 반려 사유 노출 */}
                      {isRejected && ad.reject_reason && (
                        <div className="mt-2 rounded-xl bg-rose-50 p-2 text-[11px] text-rose-800 border border-rose-100">
                          <span className="font-bold">반려 사유:</span> {ad.reject_reason}
                        </div>
                      )}
                    </div>

                    {ad.image_url && (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.image_url}
                          alt={ad.main_copy}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* 기간 및 지표 */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>
                      집행 기간: {ad.start_date.replace(/-/g, ".")} ~ {ad.end_date.replace(/-/g, ".")}
                    </span>

                    {isApproved && (
                      <span className="font-semibold text-slate-700">
                        노출 {ad.impressions.toLocaleString()}회 · 클릭 {ad.clicks.toLocaleString()}회
                      </span>
                    )}
                  </div>

                  {/* ========================================================== */}
                  {/* 최고관리자(SUPER_ADMIN) 원클릭 승인/반려 빠른 제어 바       */}
                  {/* ========================================================== */}
                  {superAdmin && (
                    <div className="mt-2 pt-2 border-t border-amber-200/80 bg-amber-50/50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-950">
                        <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                        <span>최고관리자 원클릭 심사 제어</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleAdminStatusChange(ad, "APPROVED")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs"
                          >
                            ✅ 즉시 승인 (APPROVED)
                          </button>
                        )}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => handleAdminStatusChange(ad, "REJECTED")}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 active:scale-95 transition-all shadow-2xs"
                          >
                            ❌ 반려 (REJECTED)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAds.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                선택하신 상태의 광고 내역이 없습니다.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 3단계 초간편 광고 생성 모달 */}
      <CreateAdModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        defaultDong="상계동"
        onSuccess={(newAd) => {
          setAds((prev) => [newAd, ...prev]);
          setFeedbackToast(
            superAdmin
              ? "👑 최고관리자 즉시 라이브 발행이 완료되었습니다."
              : "⚡ 비즈보드 광고가 성공적으로 신청되었습니다! (심사 대기중)"
          );
          setTimeout(() => setFeedbackToast(null), 3000);
        }}
      />
    </div>
  );
}
