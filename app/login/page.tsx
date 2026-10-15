"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { signInWithKakao } from "@/lib/auth/kakaoAuth";
import { signInWithGoogle } from "@/lib/auth/googleAuth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/workspace";

  const [loadingProvider, setLoadingProvider] = useState<"kakao" | "google" | null>(null);

  const handleKakaoLogin = async () => {
    setLoadingProvider("kakao");
    try {
      await signInWithKakao(nextPath);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingProvider("google");
    try {
      await signInWithGoogle(nextPath);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* 상단 헤더 */}
      <header className="px-4 h-14 flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
      </header>

      {/* 본문 */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-7">
          {/* 브랜드 & 타이틀 */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200/60">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Today. 통합 로그인</span>
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              어떤 모습으로<br />시작할까요?
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              이웃 주민·소상공인과 영업사원·비즈니스 회원, 두 가지 방식으로 가입할 수 있어요.
            </p>
          </div>

          {/* 로그인 선택 카드 */}
          <div className="space-y-3">
            {/* 1. 카카오 - 소상공인/주민용 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEE500] text-sm">💬</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">이웃 주민 · 소상공인</p>
                  <p className="text-[11px] text-slate-400">동네 혜택, 알바·매장 관리를 바로 시작</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleKakaoLogin}
                disabled={loadingProvider !== null}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.99] py-3.5 px-4 text-sm font-bold text-[#191919] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingProvider === "kakao" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>로그인 처리 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 fill-[#191919] shrink-0" viewBox="0 0 24 24">
                      <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.805 1.802 5.263 4.545 6.642l-.924 3.424c-.08.297.247.545.508.384l4.025-2.651c.594.072 1.206.111 1.846.111 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                    </svg>
                    <span>카카오로 3초 만에 시작하기</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. 구글 - 영업사원/비즈니스용 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm">🧑‍💼</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">영업사원 · 비즈니스</p>
                  <p className="text-[11px] text-slate-400">계약서·구글 드라이브 연동으로 업무 관리</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loadingProvider !== null}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] py-3.5 px-4 text-sm font-bold text-slate-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingProvider === "google" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>로그인 처리 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.55 5.55 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.83z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.24v3.1A11.99 11.99 0 0 0 12 24z" />
                      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29v-3.1H1.24A12 12 0 0 0 0 12c0 1.93.46 3.76 1.24 5.39l4.03-3.1z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.24 6.61l4.03 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
                    </svg>
                    <span>Google 계정으로 시작하기 (드라이브 연동)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 보안 안내 */}
          <div className="flex items-start gap-2 rounded-xl bg-slate-50/70 border border-slate-100 p-3">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Supabase 기반 안전한 인증으로 보호됩니다. 로그인 시{" "}
              <Link href="/terms" className="text-slate-700 font-bold underline hover:text-slate-900">
                서비스 이용약관
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
