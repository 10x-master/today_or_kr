"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  TrendingDown,
  Coins,
  CheckCircle2,
  Store,
  Smartphone,
  X,
  ArrowRight,
} from "lucide-react";

type Industry = "RESTAURANT" | "RETAIL" | "SERVICE";

const INDUSTRY_RATES: Record<Industry, { label: string; rate: number }> = {
  RESTAURANT: { label: "요식업·외식업", rate: 3.2 },
  RETAIL: { label: "소매·판매업", rate: 2.8 },
  SERVICE: { label: "서비스업", rate: 2.5 },
};

const PREFERENTIAL_RATE = 0.5;

function formatWon(n: number) {
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

export default function TRefundLeakCalculator() {
  const [monthlySales, setMonthlySales] = useState(30000000);
  const [industry, setIndustry] = useState<Industry>("RESTAURANT");

  const [claimForm, setClaimForm] = useState({ storeName: "", bizNumber: "", phone: "" });
  const [claimSubmitted, setClaimSubmitted] = useState<string | null>(null);

  const [pwaStoreName, setPwaStoreName] = useState("");
  const [pwaPhone, setPwaPhone] = useState("");
  const [pwaSubmitted, setPwaSubmitted] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const { leakRate, monthlyLeak, yearlyLeak, threeYearLeak } = useMemo(() => {
    const rate = INDUSTRY_RATES[industry].rate;
    const leak = Math.max(0, rate - PREFERENTIAL_RATE);
    const monthly = monthlySales * (leak / 100);
    return {
      leakRate: leak,
      monthlyLeak: monthly,
      yearlyLeak: monthly * 12,
      threeYearLeak: monthly * 12 * 3,
    };
  }, [monthlySales, industry]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.storeName || !claimForm.bizNumber || !claimForm.phone) {
      showToast("상호명, 사업자번호, 연락처를 모두 입력해 주세요.");
      return;
    }
    const caseNo = `TR-${Date.now().toString().slice(-8)}`;
    setClaimSubmitted(caseNo);
    showToast(`무료 환급 청구가 접수되었습니다 (접수번호 ${caseNo})`);
  };

  const handlePwaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwaStoreName || !pwaPhone) {
      showToast("상호명과 연락처를 입력해 주세요.");
      return;
    }
    setPwaSubmitted(true);
    showToast("모바일 매장(PWA) 무료 입점 신청이 완료되었습니다.");
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. 누수 수수료 진단 계산기 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Calculator className="h-4 w-4 text-blue-600" />
          결제수수료 누수 진단 계산기
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1.5 block">
            <span className="text-[11px] font-bold text-slate-500">월 카드결제액</span>
            <input
              type="number"
              min={0}
              step={100000}
              value={monthlySales}
              onChange={(e) => setMonthlySales(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[11px] font-bold text-slate-500">업종</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as Industry)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            >
              {Object.entries(INDUSTRY_RATES).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label} (대표가맹점 {v.rate}%)
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">대표가맹점 요율</span>
          <span className="font-bold text-slate-900">{INDUSTRY_RATES[industry].rate}%</span>
        </div>
        <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 flex items-center justify-between text-xs">
          <span className="text-blue-700 font-medium">오프라인 우대수수료 (적용 가능 기준)</span>
          <span className="font-bold text-blue-700">{PREFERENTIAL_RATE}%</span>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
            <TrendingDown className="h-3.5 w-3.5" /> 매달 누수되고 있는 수수료 ({leakRate.toFixed(1)}%p)
          </div>
          <p className="text-2xl font-black tracking-tight">{formatWon(monthlyLeak)}<span className="text-sm font-bold text-slate-400"> / 월</span></p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10.5px] text-slate-300">연간 누수 추정</p>
              <p className="text-sm font-bold">{formatWon(yearlyLeak)}</p>
            </div>
            <div className="rounded-xl bg-amber-400/15 p-2.5 border border-amber-400/30">
              <p className="text-[10.5px] text-amber-200">3개년 소급 환급 가능액</p>
              <p className="text-sm font-bold text-amber-300">{formatWon(threeYearLeak)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 무료 환급 청구 폼 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-amber-500" /> 1% 누수 수수료 무료 환급 청구
        </h2>

        {claimSubmitted ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            접수 완료 · 접수번호 {claimSubmitted} · 영업일 2일 내 담당자가 연락드립니다.
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="space-y-2.5">
            <input
              value={claimForm.storeName}
              onChange={(e) => setClaimForm((p) => ({ ...p, storeName: e.target.value }))}
              placeholder="상호명"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={claimForm.bizNumber}
              onChange={(e) => setClaimForm((p) => ({ ...p, bizNumber: e.target.value }))}
              placeholder="사업자등록번호 (예: 214-88-91823)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={claimForm.phone}
              onChange={(e) => setClaimForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="연락처 (예: 010-1234-5678)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-sm py-3 hover:bg-blue-700 transition-colors active:scale-[0.99]"
            >
              무료 환급 청구 접수하기 <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </section>

      {/* 3. 모바일 매장(PWA) 무료 입점 신청 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-indigo-600" /> 모바일 매장(PWA) 무료 입점 신청
        </h2>
        <p className="text-[11px] text-slate-500">
          환급 청구와 동시에 설치형 모바일 홈페이지(PWA)를 무료로 만들어드려요.
        </p>

        {pwaSubmitted ? (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3.5 flex items-center gap-2 text-indigo-700 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> 입점 신청 완료 · 영업일 3일 내 매장 PWA가 개설됩니다.
          </div>
        ) : (
          <form onSubmit={handlePwaSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              value={pwaStoreName}
              onChange={(e) => setPwaStoreName(e.target.value)}
              placeholder="상호명"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={pwaPhone}
              onChange={(e) => setPwaPhone(e.target.value)}
              placeholder="연락처"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Store className="h-3.5 w-3.5" /> 무료 입점
            </button>
          </form>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
          <button type="button" onClick={() => setToast(null)} aria-label="닫기">
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
}
