"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Sparkles, Coins, Wallet } from "lucide-react";
import TNoteCalendarDesk from "@/components/note/TNoteCalendarDesk";
import ReferralWalletDashboard from "@/components/wallet/ReferralWalletDashboard";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

function NoteDeskContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "wallet" ? "wallet" : "desk";
  const [activeTab, setActiveTab] = useState<"desk" | "wallet">(initialTab);
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "wallet") {
      setActiveTab("wallet");
    } else if (tabParam === "desk") {
      setActiveTab("desk");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="홈으로"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                {activeTab === "desk" ? "📝" : "👑"}
              </span>
              <h1 className="text-sm font-medium text-slate-900 tracking-tight">
                {activeTab === "desk" ? (
                  <>
                    t.note <span className="text-slate-400 font-normal">스마트 데스크 & 캘린더</span>
                  </>
                ) : (
                  <>
                    배포자 수익 지갑 <span className="text-slate-400 font-normal">& PWA 영구 지분</span>
                  </>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-normal border border-slate-200 transition-colors"
            >
              전체 워크스페이스 →
            </Link>
            <UserAccountDropdown
              currentUser={currentUser}
              onOpenLogin={() => {}}
              onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
              align="right"
            />
          </div>
        </div>

        {/* 상단 탭 네비게이션: 데스크 & 캘린더 VS 배포자 수익 지갑 */}
        <div className="max-w-4xl mx-auto px-4 border-t border-slate-100/80 bg-slate-50/50">
          <div className="flex items-center gap-2 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("desk")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeTab === "desk"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span>📝 현장 기록 & 구글 캘린더</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                activeTab === "wallet"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Coins className="h-3.5 w-3.5 text-emerald-500" />
              <span>👑 배포자 수익 지갑 & PWA 영구 지분</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-semibold font-mono">
                284,000원
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {activeTab === "desk" ? (
          <TNoteCalendarDesk
            userId={currentUser?.id || "ambassador-01"}
            userName={currentUser?.full_name || "김민수 엠버서더"}
            dong="상계동"
          />
        ) : (
          <ReferralWalletDashboard
            userId={currentUser?.id || "ambassador-01"}
            userName={currentUser?.full_name || "김민수 엠버서더"}
          />
        )}
      </main>
    </div>
  );
}

export default function NoteDeskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-400 text-xs">
          t.note 워크스페이스 로딩 중...
        </div>
      }
    >
      <NoteDeskContent />
    </Suspense>
  );
}
