"use client";

import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import TRefundLeakCalculator from "@/components/trefund/TRefundLeakCalculator";

export default function TRefundPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UnifiedHomeReturnAnchor />
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs">
                💳
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  t.환급
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  결제수수료 정상화 & 무료환급 엔진
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 메인 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        <TRefundLeakCalculator />
      </main>
    </div>
  );
}
