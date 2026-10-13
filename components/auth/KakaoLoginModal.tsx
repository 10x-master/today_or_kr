"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, X, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { signInWithKakao, simulateDemoLogin, DEMO_KAKAO_USER } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

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

  // 카카오 1초 간편 로그인 실행
  const handleKakaoLogin = async () => {
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

  // 데모 계정 즉시 로그인 (개발 및 테스트용 원클릭 체험)
  const handleDemoInstantLogin = () => {
    setIsLoading(true);
    try {
      localStorage.setItem("today_auth_user", JSON.stringify(DEMO_KAKAO_USER));
      window.dispatchEvent(new Event("today_auth_changed"));

      setToastMessage("로그인되었습니다!");
      onSuccess?.(DEMO_KAKAO_USER);

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

  if (!isOpen) return null;

  return (
    <>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-70 flex items-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-xs animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 모달 배경 및 래퍼 */}
      <div
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-7 border border-slate-100"
        >
          {/* 상단 모바일 드래그 핸들 */}
          <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 상단 브랜드 배지 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200/60">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>1초 간편 로그인</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Supabase Auth 연동
            </span>
          </div>

          {/* 타이틀 및 부제 */}
          <div className="space-y-1.5 pr-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              Today. & t.note를<br />
              <span className="text-amber-500">1초 만에</span> 시작하세요
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              별도 가입 없이 카카오 계정으로 안전하게 연결됩니다.
            </p>
          </div>

          {/* 혜택 안내 리스트 카드 */}
          <div className="mt-5 space-y-2 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100">
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-xs text-amber-500 shrink-0">
                ⚡
              </div>
              <span className="font-medium">
                아이디·비밀번호 입력 없이 <strong className="text-slate-900">원클릭 시작</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-xs text-emerald-600 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">
                내 <strong className="text-slate-900">티노트(t.note)</strong> 일정과 관심 고시 클라우드 영구 저장
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-xs text-indigo-600 shrink-0">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">
                구글 캘린더 실시간 연동 및 모바일 알림 동기화
              </span>
            </div>
          </div>

          {/* 액션 버튼 영역 */}
          <div className="mt-6 space-y-2.5">
            {/* 카카오 공식 옐로우 버튼 */}
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
                  {/* 카카오톡 공식 말풍선 아이콘 */}
                  <svg className="h-5 w-5 fill-[#191919] shrink-0" viewBox="0 0 24 24">
                    <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.805 1.802 5.263 4.545 6.642l-.924 3.424c-.08.297.247.545.508.384l4.025-2.651c.594.072 1.206.111 1.846.111 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                  </svg>
                  <span>💬 카카오로 1초 간편 시작하기</span>
                </>
              )}
            </button>

            {/* 빠른 데모 원클릭 체험 버튼 */}
            <button
              type="button"
              onClick={handleDemoInstantLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              <span>⚡ 데모 입주민 계정으로 바로 체험하기</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </button>
          </div>

          {/* 하단 안심 안내문구 */}
          <p className="mt-4 text-center text-[11px] text-slate-400">
            로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </>
  );
}
