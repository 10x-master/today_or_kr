"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Wallet,
  Smartphone,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ExternalLink,
  ShoppingBag,
  Megaphone,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  RefreshCw,
  X,
  CreditCard,
  UserCheck,
  Percent,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  INITIAL_WALLET_SUMMARY,
  INITIAL_COUPANG_SETTLEMENTS,
  INITIAL_BIZBOARD_REVENUES,
  INITIAL_B2B_FEES,
  INITIAL_ACTIVITY_LOGS,
  getReferralWalletSummary,
  getCoupangSettlements,
  getReferralActivityLogs,
  calculateWithholdingTax,
  submitPayoutRequest,
} from "@/lib/referral";
import type {
  ReferralWalletSummary,
  CoupangSubIdSettlement,
  BizboardAdRevenue,
  B2BReferralFee,
  ReferralActivityLog,
  PayoutRequest,
} from "@/types/commerce";

interface ReferralWalletDashboardProps {
  userId?: string;
  userName?: string;
  className?: string;
}

type TabType = "COUPANG" | "BIZBOARD" | "B2B";

export default function ReferralWalletDashboard({
  userId = "ambassador-01",
  userName = "김민수 엠버서더",
  className = "",
}: ReferralWalletDashboardProps) {
  const [wallet, setWallet] = useState<ReferralWalletSummary>(INITIAL_WALLET_SUMMARY);
  const [coupangList, setCoupangList] = useState<CoupangSubIdSettlement[]>(INITIAL_COUPANG_SETTLEMENTS);
  const [bizboardList] = useState<BizboardAdRevenue[]>(INITIAL_BIZBOARD_REVENUES);
  const [b2bList] = useState<B2BReferralFee[]>(INITIAL_B2B_FEES);
  const [activityLogs, setActivityLogs] = useState<ReferralActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const [activeTab, setActiveTab] = useState<TabType>("COUPANG");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isTaxGuideOpen, setIsTaxGuideOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 출금 폼 상태
  const [payoutAmount, setPayoutAmount] = useState<number>(284000);
  const [bankName, setBankName] = useState("카카오뱅크");
  const [accountNumber, setAccountNumber] = useState("3333-01-9823412");
  const [accountHolder, setAccountHolder] = useState(userName);
  const [taxIdType, setTaxIdType] = useState<"RESIDENT_ID" | "BUSINESS_ID">("RESIDENT_ID");
  const [taxId, setTaxId] = useState("891024-1");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // 데이터 동기화
  const loadData = () => {
    setWallet(getReferralWalletSummary());
    setCoupangList(getCoupangSettlements());
    setActivityLogs(getReferralActivityLogs());
  };

  useEffect(() => {
    loadData();

    const handleActivity = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.wallet) setWallet(customEvent.detail.wallet);
        if (customEvent.detail.settlements) setCoupangList(customEvent.detail.settlements);
        if (customEvent.detail.log) {
          setActivityLogs((prev) => [customEvent.detail.log, ...prev.slice(0, 49)]);
        }
      }
    };

    window.addEventListener("today_referral_activity", handleActivity);
    return () => window.removeEventListener("today_referral_activity", handleActivity);
  }, []);

  // 3.3% 원천징수 실시간 계산
  const taxCalculation = useMemo(() => {
    return calculateWithholdingTax(payoutAmount || 0);
  }, [payoutAmount]);

  // 쿠팡 파이프라인 합계 요약
  const coupangStats = useMemo(() => {
    const totalClicks = coupangList.reduce((acc, c) => acc + c.clicks, 0);
    const totalCarts = coupangList.reduce((acc, c) => acc + c.cartConversions, 0);
    const totalCommission = coupangList.reduce((acc, c) => acc + c.commissionAmount, 0);
    const avgRate = totalClicks > 0 ? ((totalCarts / totalClicks) * 100).toFixed(1) : "0.0";
    return { totalClicks, totalCarts, totalCommission, avgRate };
  }, [coupangList]);

  // 비즈보드 합계 요약
  const bizboardStats = useMemo(() => {
    const totalImpressions = bizboardList.reduce((acc, b) => acc + b.impressions, 0);
    const totalClicks = bizboardList.reduce((acc, b) => acc + b.clicks, 0);
    const totalAllocated = bizboardList.reduce((acc, b) => acc + b.allocatedAmount, 0);
    return { totalImpressions, totalClicks, totalAllocated };
  }, [bizboardList]);

  // B2B 합계 요약
  const b2bStats = useMemo(() => {
    const totalContract = b2bList.reduce((acc, b) => acc + b.contractAmount, 0);
    const totalFee = b2bList.reduce((acc, b) => acc + b.feeAmount, 0);
    return { totalContract, totalFee };
  }, [b2bList]);

  // 출금 신청 핸들러
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount < 10000) {
      alert("최소 출금 가능 금액은 10,000원입니다.");
      return;
    }
    if (payoutAmount > wallet.withdrawableAmount) {
      alert("출금 가능 잔액을 초과할 수 없습니다.");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      await submitPayoutRequest({
        userId,
        amount: payoutAmount,
        bankName,
        accountNumber,
        accountHolder,
        taxIdType,
        taxId,
      });

      setWallet((prev) => ({
        ...prev,
        withdrawableAmount: Math.max(0, prev.withdrawableAmount - payoutAmount),
      }));

      setIsPayoutModalOpen(false);
      setToastMessage(
        `✅ [${payoutAmount.toLocaleString()}원] 출금 신청이 완료되었습니다! (세후 실지급액: ${taxCalculation.netPayoutAmount.toLocaleString()}원, 영업일 기준 익일 입금)`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      alert("출금 신청 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className={`space-y-4 font-sans text-slate-900 ${className}`}>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단: 👑 나의 디지털 영토 & 수익 현황 카드]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 shadow-xs space-y-4">
        {/* 헤더 및 타이틀 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-xs">
              👑
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  나의 디지털 영토 & 배포자 수익 지갑
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                  영구 지분 활성
                </span>
              </div>
              <p className="text-xs font-normal text-slate-500 mt-0.5">
                {userName}님이 배포한 PWA 기기에서 발생하는 3대 제휴 수익이 실시간 적립됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={loadData}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
              title="데이터 새로고침"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-normal text-slate-400">
              최종 정산 {wallet.lastSettledDate}
            </span>
          </div>
        </div>

        {/* 3대 핵심 KPI 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1) 누적 홈 화면 설치 기기 */}
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                <span>누적 설치 기기</span>
              </span>
              <span className="rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium px-1.5 py-0.2">
                PWA 영구 지분
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {wallet.installedDevicesCount}
              </span>
              <span className="text-xs font-normal text-slate-500">대</span>
            </div>
            <p className="text-[11px] font-normal text-slate-500 leading-tight">
              내 QR/링크를 통해 홈 화면에 영구 안착된 기기 수
            </p>
          </div>

          {/* 2) 이번 달 출금 가능 적립금 */}
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-emerald-800 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                <span>출금 가능 적립금</span>
              </span>
              <span className="rounded bg-emerald-100/90 text-emerald-900 text-[10px] font-medium px-1.5 py-0.2">
                즉시 출금 가능
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-emerald-700">
                {wallet.withdrawableAmount.toLocaleString()}
              </span>
              <span className="text-xs font-normal text-emerald-800">원</span>
            </div>
            <p className="text-[11px] font-normal text-emerald-700 leading-tight">
              원천징수 3.3% 자동 공제 후 본인 계좌 즉시 이체
            </p>
          </div>

          {/* 3) 총 누적 리워드 */}
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <span>총 누적 리워드</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                기정산 포함
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {wallet.totalAccumulatedAmount.toLocaleString()}
              </span>
              <span className="text-xs font-normal text-slate-500">원</span>
            </div>
            <p className="text-[11px] font-normal text-slate-500 leading-tight">
              플랫폼 개설 이래 총 정산된 제휴/광고/B2B 수익 합계
            </p>
          </div>
        </div>

        {/* 원클릭 출금 버튼 & 세무 가이드 배너 */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">
              국세청 3.3% 사업소득세 원천징수 전산 신고 규격 준수
            </span>
            <button
              type="button"
              onClick={() => setIsTaxGuideOpen(true)}
              className="text-[11px] text-blue-600 hover:underline cursor-pointer ml-1"
            >
              [세무 가이드]
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPayoutAmount(wallet.withdrawableAmount);
              setIsPayoutModalOpen(true);
            }}
            disabled={wallet.withdrawableAmount < 10000}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs ${
              wallet.withdrawableAmount >= 10000
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>⚡ 원클릭 출금 신청 (3.3% 세무 가이드 연동)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ============================================================
          [2. 중단: 3대 수익 파이프라인별 상세 내역]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <span>3대 수익 파이프라인 정산 리포트</span>
            <span className="text-[10px] font-normal text-slate-400">
              실시간 집계
            </span>
          </h3>

          {/* 3대 탭 전환 버튼 */}
          <div className="flex items-center rounded-xl bg-slate-100/90 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("COUPANG")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "COUPANG"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-rose-500" />
              <span>🛒 쿠팡 SubID</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("BIZBOARD")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "BIZBOARD"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5 text-blue-500" />
              <span>📢 비즈보드 광고</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("B2B")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "B2B"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>🏢 B2B 견적 피</span>
            </button>
          </div>
        </div>

        {/* --- 탭 1: 쿠팡 파트너스 SubID 적립 내역 --- */}
        {activeTab === "COUPANG" && (
          <div className="space-y-3">
            {/* 요약 바 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10.5px] text-slate-400">총 클릭수</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {coupangStats.totalClicks.toLocaleString()}회
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">장바구니 1초 담기</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {coupangStats.totalCarts.toLocaleString()}건
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">평균 전환율</span>
                <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                  {coupangStats.avgRate}%
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">발생 커미션</span>
                <p className="text-sm font-semibold text-rose-600 mt-0.5">
                  {coupangStats.totalCommission.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 테이블 리스트 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-normal text-slate-400">
                    <th className="py-2 px-2">상품명 / 트래킹 SubID</th>
                    <th className="py-2 px-2 text-right">클릭</th>
                    <th className="py-2 px-2 text-right">담기</th>
                    <th className="py-2 px-2 text-right">전환율</th>
                    <th className="py-2 px-2 text-right">커미션</th>
                    <th className="py-2 px-2 text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {coupangList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-slate-900 truncate max-w-xs">
                          {item.productTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SubID: {item.subId}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                        {item.clicks}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-900 font-mono font-medium">
                        {item.cartConversions}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-600 font-mono font-medium">
                        {item.conversionRate}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-rose-600 font-semibold font-mono">
                        +{item.commissionAmount.toLocaleString()}원
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {item.status === "CONFIRMED" ? "정산확정" : "대기"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-blue-50/50 p-2.5 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                💡 모바일 PWA 기기에서 주민들이 상품을 '1초 장바구니 담기' 할 때마다 설치 배포자에게 고유 SubID 커미션이 영구 귀속됩니다.
              </span>
            </div>
          </div>
        )}

        {/* --- 탭 2: 64px 비즈보드 광고 클릭/배분금 --- */}
        {activeTab === "BIZBOARD" && (
          <div className="space-y-3">
            {/* 요약 바 */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10.5px] text-slate-400">광고 노출수 (CPM)</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {bizboardStats.totalImpressions.toLocaleString()}회
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">광고 클릭수 (CPC)</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {bizboardStats.totalClicks.toLocaleString()}회
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">내 배분금 (60% 쉐어)</span>
                <p className="text-sm font-semibold text-blue-600 mt-0.5">
                  {bizboardStats.totalAllocated.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 비즈보드 광고 캠페인 목록 */}
            <div className="space-y-2">
              {bizboardList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50/60 border border-slate-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-normal">
                        {item.category}
                      </span>
                      <h4 className="font-medium text-slate-900 truncate">
                        {item.campaignTitle}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>노출: {item.impressions.toLocaleString()}</span>
                      <span>•</span>
                      <span>클릭: {item.clicks}회</span>
                      <span>•</span>
                      <span>CTR: {item.ctr}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-normal">
                      배분율 {item.shareRate}%
                    </span>
                    <span className="text-sm font-bold text-blue-600 font-mono">
                      +{item.allocatedAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-normal text-slate-500 leading-tight">
              * 내가 배포한 142대 PWA 기기 상단 64px 비즈보드에 노출되는 소상공인 부스트 광고비 중 60%가 기기 소유권자에게 매일 자정 자동 분배됩니다.
            </p>
          </div>
        )}

        {/* --- 탭 3: B2B 견적/발주 리퍼럴 피 --- */}
        {activeTab === "B2B" && (
          <div className="space-y-3">
            {/* 요약 바 */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10.5px] text-slate-400">성사 단지 계약 총액</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {b2bStats.totalContract.toLocaleString()}원
                </p>
              </div>
              <div>
                <span className="text-[10.5px] text-slate-400">리퍼럴 수수료 합계</span>
                <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                  {b2bStats.totalFee.toLocaleString()}원
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {b2bList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50/60 border border-slate-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium">
                        {item.aptName}
                      </span>
                      <h4 className="font-medium text-slate-900 truncate">
                        {item.itemTitle}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>계약액: {item.contractAmount.toLocaleString()}원</span>
                      <span>•</span>
                      <span>리퍼럴 요율: {item.referralRate}%</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        item.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      {item.status === "COMPLETED" ? "정산 완료" : "계약 검토중"}
                    </span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      +{item.feeAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-tight">
              🏢 단지 관리사무소 또는 입대의에서 CERA 공인 컨설팅 견적서를 신청하고 수주가 체결되면, 공인 중개 보수(3~5%)가 즉시 적립됩니다.
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          [3. 하단: 실시간 트래킹 로그 타임라인]
         ============================================================ */}
      <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
              실시간 디지털 영토 트래킹 로그
            </h3>
          </div>
          <span className="text-[11px] font-normal text-slate-400">
            총 {activityLogs.length}건 기록
          </span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80 text-xs hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs shrink-0">
                  {log.pipelineType === "COUPANG" && "🛒"}
                  {log.pipelineType === "BIZBOARD" && "📢"}
                  {log.pipelineType === "B2B_CONSULTING" && "🏢"}
                  {log.pipelineType === "PWA_INSTALL" && "📲"}
                </span>
                <div className="min-w-0">
                  <p className="text-slate-800 font-normal truncate">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span>{log.deviceLocation}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>

              <span className="shrink-0 font-semibold font-mono text-emerald-600 text-xs">
                +{log.pointReward.toLocaleString()}P
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          [모달 1: ⚡ 원클릭 출금 신청 (3.3% 원천징수 세무 가이드 연동)]
         ============================================================ */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 모달 헤더 */}
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">
                  <Coins className="h-3 w-3" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  원클릭 출금 신청 (3.3% 원천징수 공제)
                </h3>
              </div>
              <p className="text-[11px] font-normal text-slate-500">
                출금 가능 잔액:{" "}
                <span className="font-semibold text-emerald-700">
                  {wallet.withdrawableAmount.toLocaleString()}원
                </span>
              </p>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-3.5 text-xs">
              {/* 1) 출금 신청 금액 입력 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-slate-600 font-medium">
                    출금 신청 금액 *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(wallet.withdrawableAmount)}
                    className="text-blue-600 hover:underline cursor-pointer text-[10px]"
                  >
                    전액 입력
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={10000}
                    max={wallet.withdrawableAmount}
                    step={1000}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 font-semibold focus:border-slate-900 focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-normal">
                    원
                  </span>
                </div>
              </div>

              {/* 2) 실시간 3.3% 원천징수 계산기 박스 */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>신청 총액</span>
                  <span className="font-mono">{taxCalculation.requestedAmount.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>사업소득세 (3.0%)</span>
                  <span className="font-mono text-rose-600">
                    -{taxCalculation.incomeTax.toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>지방소득세 (0.3%)</span>
                  <span className="font-mono text-rose-600">
                    -{taxCalculation.localTax.toLocaleString()}원
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span>실지급 예정액 (세후)</span>
                  <span className="text-emerald-700 font-mono text-sm">
                    {taxCalculation.netPayoutAmount.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 3) 입금 계좌 정보 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600">
                  입금 계좌 정보 *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                    <option value="국민은행">국민은행</option>
                    <option value="신한은행">신한은행</option>
                    <option value="우리은행">우리은행</option>
                    <option value="하나은행">하나은행</option>
                    <option value="농협은행">농협은행</option>
                    <option value="기업은행">기업은행</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="계좌번호 (-포함)"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="col-span-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="예금주 성명 (본인 실명)"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* 4) 세무 증빙 정보 (원천징수 신고용) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-medium text-slate-600">
                    국세청 원천징수 신고용 식별번호 *
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="taxType"
                        checked={taxIdType === "RESIDENT_ID"}
                        onChange={() => setTaxIdType("RESIDENT_ID")}
                      />
                      <span>주민번호 앞자리</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="taxType"
                        checked={taxIdType === "BUSINESS_ID"}
                        onChange={() => setTaxIdType("BUSINESS_ID")}
                      />
                      <span>사업자번호</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  placeholder={
                    taxIdType === "RESIDENT_ID"
                      ? "예: 891024-1****** (생년월일 및 성별)"
                      : "예: 123-45-67890 (사업자등록번호)"
                  }
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none font-mono"
                />
              </div>

              {/* 세무 가이드라인 안내 배너 */}
              <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/60 text-[10.5px] text-amber-900 leading-tight space-y-1">
                <p className="font-medium">
                  💡 연간 3.3% 사업소득세 원천징수 영수증 발급 안내
                </p>
                <p className="text-amber-800 font-normal">
                  지급된 수당은 당월 말일 국세청 홈택스에 전산 통보되며, 매년 5월 종합소득세 정산 시 기납부세액으로 자동 조회 및 환급 청구가 가능합니다.
                </p>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2 font-medium transition-colors cursor-pointer shadow-xs"
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  <span>
                    {isSubmittingPayout
                      ? "신청 처리중..."
                      : `출금 신청 완료 (${taxCalculation.netPayoutAmount.toLocaleString()}원 입금)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 2: 세무 가이드 상세 팝업]
         ============================================================ */}
      {isTaxGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setIsTaxGuideOpen(false)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">
                <ShieldCheck className="h-3 w-3" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                PWA 배포자 3.3% 원천징수 세무 가이드
              </h3>
            </div>

            <div className="space-y-2 text-slate-600 leading-relaxed text-[11.5px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-900">
                  1. 사업소득세 원천징수 (소득세법 제127조)
                </p>
                <p>
                  Today 플랫폼의 배포자 리워드는 프리랜서 인적용역 사업소득으로 분류되어, 출금 시 3%의 사업소득세와 0.3%의 지방소득세(합계 3.3%)가 원천공제됩니다.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-900">
                  2. 국세청 전산 자동 신고
                </p>
                <p>
                  지급 대행사를 통해 매월 국세청에 간이지급명세서가 제출되므로 별도의 복잡한 세무 신고 절차 없이 홈택스에 자동 등재됩니다.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-900">
                  3. 5월 종합소득세 환급
                </p>
                <p>
                  연간 총소득이 기본공제 구간 이하이거나 단순경비율이 적용되는 경우, 3.3% 공제된 세액 전액을 매년 5월 국세청 홈택스에서 환급받으실 수 있습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTaxGuideOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
