"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, Building2, FileText, CreditCard, ChevronRight } from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import KakaoLoginModal from "@/components/auth/KakaoLoginModal";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

const NEXT_PATH = "/my-shop";

const QUICK_LINKS = [
  {
    href: "/biz/apt-sanggye14",
    icon: Building2,
    color: "text-emerald-600",
    title: "비즈홈 공식 페이지 관리",
    desc: "매장·단지 정보, 상품 진열 수정",
  },
  {
    href: "/t-sign",
    icon: FileText,
    color: "text-blue-600",
    title: "t.sign 계약서 보관함",
    desc: "전자서명 완료 계약서 열람",
  },
  {
    href: "/t-refund",
    icon: CreditCard,
    color: "text-indigo-600",
    title: "t.환급 수수료 진단",
    desc: "결제 수수료 무료 환급 신청 현황",
  },
];

export default function MyShopPage() {
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
                🏪
              </span>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  내 매장
                </h1>
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  My Shop 관리 홈
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

      {/* 2. 메인 본문: 내 매장 관리는 로그인 후에만 접근 가능 */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {!authChecked ? null : !currentUser ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">로그인이 필요합니다</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                내 매장 정보와 계약·수수료 데이터는 본인 확인 후에만 열람할 수 있어요.
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
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex items-center gap-3">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name || "프로필"}
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-sm font-bold">
                  {currentUser.full_name?.slice(0, 1) || "T"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {currentUser.full_name || "투데이 회원"}님의 매장
                </p>
                <p className="text-xs text-slate-400 truncate">{currentUser.email || "연동된 이메일 없음"}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-2.5">
              <div className="divide-y divide-slate-100">
                {QUICK_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-2.5 py-3.5 hover:bg-slate-50/70 rounded-xl transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 shrink-0">
                      <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
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
