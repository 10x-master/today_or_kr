"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { signInWithKakao } from "@/lib/auth/kakaoAuth";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
import { TodayWordmark } from "@/components/brand/TodayLogo";
import SixCoreSolutionsList from "@/components/auth/SixCoreSolutionsList";
import LegalAgreementChecklist from "@/components/auth/LegalAgreementChecklist";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/workspace";

  const [loadingProvider, setLoadingProvider] = useState<"kakao" | "google" | null>(null);
  const [requiredChecked, setRequiredChecked] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    if (!requiredChecked) {
      setHint("필수 약관에 먼저 동의해주세요.");
      setTimeout(() => setHint(null), 1600);
      return;
    }
    setLoadingProvider("kakao");
    try {
      await signInWithKakao(nextPath);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    if (!requiredChecked) {
      setHint("필수 약관에 먼저 동의해주세요.");
      setTimeout(() => setHint(null), 1600);
      return;
    }
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
      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-5">
          {/* 상단 로고: 아이콘 배지 없이 워드마크 단독 */}
          <div className="text-center">
            <TodayWordmark theme="light" size="lg" className="justify-center" />
          </div>

          {/* 메인 타이틀 & 서브 카피 */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              기록부터 환급·계약·비즈니스까지
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              카카오 안심 연동으로 3초 만에 시작하세요
            </p>
          </div>

          {/* 6대 핵심 솔루션 리스트 */}
          <SixCoreSolutionsList />

          {/* 약관 동의 체크리스트 */}
          <LegalAgreementChecklist onRequiredChange={setRequiredChecked} />

          {hint && (
            <p className="text-center text-[11px] font-bold text-rose-500">{hint}</p>
          )}

          {/* 액션 버튼 영역 */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.99] py-3.5 px-4 text-sm font-bold text-[#191919] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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

            {/* 영업사원·비즈니스용 구글 보조 링크 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.55 5.55 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.83z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.24v3.1A11.99 11.99 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29v-3.1H1.24A12 12 0 0 0 0 12c0 1.93.46 3.76 1.24 5.39l4.03-3.1z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.24 6.61l4.03 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
              )}
              <span>영업사원·비즈니스 회원은 Google 계정으로 시작</span>
            </button>

            {/* 로그인 없이 둘러보기 */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              로그인 없이 둘러보기
            </button>
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
