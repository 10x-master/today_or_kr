"use client";

import { useEffect, useState } from "react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import TRefundLeakCalculator from "@/components/trefund/TRefundLeakCalculator";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function TRefundPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => getCurrentAuthUser().then(setCurrentUser);
    checkAuth();
    window.addEventListener("today_auth_changed", checkAuth);
    return () => window.removeEventListener("today_auth_changed", checkAuth);
  }, []);

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

          {/* 로그인 / 프로필 위젯 */}
          <UserAccountDropdown
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
            triggerStyle="icon_only"
            align="right"
          />
        </div>
      </header>

      {/* 2. 메인 본문 */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        <TRefundLeakCalculator />
      </main>

      <KakaoLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        nextPath="/t-refund"
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
}
