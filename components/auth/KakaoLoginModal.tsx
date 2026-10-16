"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { signInWithKakao, DEMO_KAKAO_USER } from "@/lib/auth/kakaoAuth";
import { signInWithGoogle } from "@/lib/auth/googleAuth";
import type { AuthProfile } from "@/types/auth";
import { TodayWordmark } from "@/components/brand/TodayLogo";
import SixCoreSolutionsList from "@/components/auth/SixCoreSolutionsList";
import LegalAgreementChecklist from "@/components/auth/LegalAgreementChecklist";

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthProfile) => void;
  nextPath?: string;
}

export default function KakaoLoginModal({
  isOpen,
  onClose,
  onSuccess,
  nextPath = "/workspace",
}: KakaoLoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [requiredChecked, setRequiredChecked] = useState(false);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // 데모 계정 즉시 로그인 (Supabase 미연동/오류 시 자동 폴백)
  const handleDemoInstantLogin = (customUser: AuthProfile = DEMO_KAKAO_USER) => {
    setIsLoading(true);
    try {
      localStorage.setItem("today_auth_user", JSON.stringify(customUser));
      window.dispatchEvent(new Event("today_auth_changed"));

      setToastMessage("로그인되었습니다!");
      onSuccess?.(customUser);

      setTimeout(() => {
        setToastMessage(null);
        setIsLoading(false);
        onClose();
      }, 700);
    } catch {
      setIsLoading(false);
      onClose();
    }
  };

  // 카카오 안심 연동 로그인 실행
  const handleKakaoLogin = async () => {
    if (!requiredChecked) {
      setToastMessage("필수 약관에 먼저 동의해주세요.");
      setTimeout(() => setToastMessage(null), 1600);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithKakao(nextPath);
      if (result.error) {
        console.warn("Kakao login issue, falling back to demo:", result.error);
        handleDemoInstantLogin();
      }
    } catch (err) {
      console.warn("Login exception:", err);
      handleDemoInstantLogin();
    } finally {
      setIsLoading(false);
    }
  };

  // 구글 계정 로그인 (영업사원·비즈니스용, 드라이브 연동)
  const handleGoogleLogin = async () => {
    if (!requiredChecked) {
      setToastMessage("필수 약관에 먼저 동의해주세요.");
      setTimeout(() => setToastMessage(null), 1600);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(nextPath);
      if (result.error) {
        console.warn("Google login issue, falling back to demo:", result.error);
        handleDemoInstantLogin();
      }
    } catch (err) {
      console.warn("Google login exception:", err);
      handleDemoInstantLogin();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-70 flex items-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-xs animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 모달 배경 및 래퍼 — Pure White 무배경 */}
      <div
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-7 border border-slate-100"
        >
          {/* 상단 모바일 드래그 핸들 */}
          <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 상단 로고: 아이콘 배지 없이 워드마크 단독 */}
          <TodayWordmark theme="light" size="lg" />

          {/* 메인 타이틀 & 서브 카피 */}
          <div className="mt-3 space-y-1.5 pr-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              기록부터 환급·계약·비즈니스까지
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              카카오 안심 연동으로 3초 만에 시작하세요
            </p>
          </div>

          {/* 6대 핵심 솔루션 리스트 */}
          <SixCoreSolutionsList className="mt-4" />

          {/* 약관 동의 체크리스트 */}
          <LegalAgreementChecklist className="mt-4" onRequiredChange={setRequiredChecked} />

          {/* 액션 버튼 영역 */}
          <div className="mt-4 space-y-2.5">
            {/* 카카오 풀 너비 버튼 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.99] py-3.5 px-4 text-sm font-bold text-[#191919] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#191919]" />
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
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.55 5.55 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.83z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.24v3.1A11.99 11.99 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29v-3.1H1.24A12 12 0 0 0 0 12c0 1.93.46 3.76 1.24 5.39l4.03-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.24 6.61l4.03 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
              <span>영업사원·비즈니스 회원은 Google 계정으로 시작</span>
            </button>

            {/* 로그인 없이 둘러보기 */}
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              로그인 없이 둘러보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
