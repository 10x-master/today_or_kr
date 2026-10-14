"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Compass,
  Coins,
  FileText,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import TNoteSmartDesk from "@/components/desk/TNoteSmartDesk";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function DeskPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
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
                ⚡
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  t.note 스마트 데스크
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  AI 비서 & 링크픽(LinkPick) 통합 허브
                </span>
              </div>
            </div>
          </div>

          {/* 우측 퀵 액션 링크 & 계정 */}
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/admin/radar"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition-colors border border-blue-200"
            >
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              <span>M-FAD 레이더 →</span>
            </Link>

            <Link
              href="/note?tab=wallet"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium transition-colors border border-emerald-200"
            >
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              <span>수익 지갑 284,000원</span>
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

      {/* 2. 메인 t.note 스마트 데스크 본문 */}
      <main className="max-w-6xl mx-auto px-4 py-5">
        <TNoteSmartDesk
          userId={currentUser?.id || "ambassador-01"}
          userName={currentUser?.full_name || "김민수 엠버서더"}
        />
      </main>
    </div>
  );
}
