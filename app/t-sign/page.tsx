"use client";

import { useEffect, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import TSignContractEngine from "@/components/tsign/TSignContractEngine";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

const NEXT_PATH = "/t-sign";

export default function TSignPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      getCurrentAuthUser().then((user) => {
        setCurrentUser(user);
        setAuthChecked(true);
        if (!user) setIsLoginModalOpen(true);
      });
    };
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
                ✍️
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  t.sign AI 계약서 엔진
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  음성·통화 녹음에서 바로 전자계약까지
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

      {/* 2. 메인 본문: 계약서 보관함은 로그인 후에만 접근 가능 */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {!authChecked ? null : !currentUser ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">로그인이 필요합니다</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                계약서 작성·전자서명·보관함은 본인 확인 후에만 이용할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              로그인하고 계속하기
            </button>
          </div>
        ) : (
          <TSignContractEngine />
        )}
      </main>

      <KakaoLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        nextPath={NEXT_PATH}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
}
