"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Compass, Coins, Briefcase } from "lucide-react";
import LocalJobBoard from "@/components/local/LocalJobBoard";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function LocalPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="홈으로"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs">
                💼
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Today 로컬 구인 피드
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  동네 티홈페이지 실시간 일자리
                </span>
              </div>
            </div>
          </div>

          {/* 우측 퀵 액션 링크 & 계정 */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/desk"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 font-medium transition-colors border border-rose-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-600" />
              <span>사장님 데스크 →</span>
            </Link>

            <Link
              href="/admin/radar"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors border border-blue-200"
            >
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              <span>M-FAD 레이더</span>
            </Link>

            <UserAccountDropdown
              currentUser={currentUser}
              onOpenLogin={() => {}}
              onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
              align="right"
            />
          </div>
        </div>
      </header>

      {/* 2. 메인 로컬 구인 보드 본문 */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        <LocalJobBoard />
      </main>
    </div>
  );
}
