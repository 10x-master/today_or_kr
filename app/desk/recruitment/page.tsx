"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Compass, Coins, Users, Briefcase } from "lucide-react";
import RecruitmentAtsDesk from "@/components/desk/RecruitmentAtsDesk";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function DeskRecruitmentPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/desk"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="t.note 스마트 데스크로 돌아가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs">
                💼
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  알바 ATS & 노무·세무 데스크
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  t.sign 전자근로계약 & t.check 50m 출결
                </span>
              </div>
            </div>
          </div>

          {/* 우측 퀵 링크 & 계정 */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/desk"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-600" />
              <span>t.note 데스크</span>
            </Link>

            <Link
              href="/local"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium transition-colors border border-amber-200"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-600" />
              <span>로컬 구인 피드</span>
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

      {/* 2. 메인 ATS 데스크 본문 */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        <RecruitmentAtsDesk
          storeName="정자동 숯불화로구이 본점"
          bizRegNumber="214-88-91823"
          representativeName="최성호"
        />
      </main>
    </div>
  );
}
