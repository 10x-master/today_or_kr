"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  ShieldCheck,
  Building2,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import MfadGeoRadarMap from "@/components/admin/MfadGeoRadarMap";
import { MOCK_MFAD_TARGETS } from "@/lib/mfadSeed";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function MfadRadarPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. 상단 관리자 통합 헤더 */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            title="관리자 CRM으로 이동"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">CRM 백오피스</span>
          </Link>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              🛰️
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">
                M-FAD Geo-Radar
              </span>
              <span className="hidden md:inline text-xs text-slate-400 font-normal">
                현장 서포터즈 가맹점 카드수수료 정합성 실사 데스크
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-900/80 border border-blue-500/50 text-blue-300 text-[10px] font-bold">
              HQ_DESK
            </span>
          </div>
        </div>

        {/* 우측 퀵 링크 & 계정 */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/crm"
            className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            CRM 승인함 ➔
          </Link>
          <Link
            href="/note?tab=wallet"
            className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 transition-colors border border-emerald-700/60 font-mono font-medium"
          >
            수익 지갑 284,000원
          </Link>
          <UserAccountDropdown
            currentUser={currentUser}
            onOpenLogin={() => {}}
            onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
            align="right"
          />
        </div>
      </header>

      {/* 2. 메인 지리정보 레이더 맵 뷰 */}
      <main className="flex-1 relative w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        <MfadGeoRadarMap initialTargets={MOCK_MFAD_TARGETS} />
      </main>
    </div>
  );
}
