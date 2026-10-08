"use client";

import { useState } from "react";
import { Check, Copy, LogOut } from "lucide-react";
import { useMember } from "@/components/linkpick/member/member-context";
import { LinkManager } from "@/components/linkpick/member/LinkManager";
import { LinkPage } from "@/components/linkpick/LinkPage";
import { badge } from "@/components/linkpick/styles";

/** 링크픽 제휴/수익 허브: linkpick 프로젝트에서 이식한 카카오 인증 + 링크 리스트 컴포넌트 */
export default function StoreTab() {
  const { authReady, authConfigured, currentUser, openLogin, logout } = useMember();
  const [copied, setCopied] = useState(false);

  function handleCopyReferralLink() {
    if (!currentUser) return;
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser.referralCode}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!authReady) {
    return <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>;
  }

  if (!authConfigured) {
    return (
      <div className="px-4 py-10 text-center sm:px-6">
        <p className="text-sm font-medium text-zinc-500">
          로그인 설정을 준비 중입니다. Supabase 프로젝트 연결(NEXT_PUBLIC_SUPABASE_URL /
          NEXT_PUBLIC_SUPABASE_ANON_KEY) 후 이용할 수 있어요.
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center px-4 py-14 text-center sm:px-6">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
          링크픽 제휴/수익 허브
        </span>
        <h2 className="mt-3 text-lg font-bold text-zinc-900">
          내 쿠팡 파트너스 링크를 한 페이지에 모아보세요
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          카카오 계정으로 로그인하면 나만의 제휴 링크 페이지를 만들고, 추천 코드로 들어온
          방문자에게 보여줄 수 있어요.
        </p>
        <button
          type="button"
          onClick={openLogin}
          className="mt-5 rounded-full bg-[#FEE500] px-6 py-3 text-sm font-bold text-[#191919] transition hover:brightness-95"
        >
          카카오로 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className={badge}>{currentUser.displayName}님</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900">
              내 추천 코드 {currentUser.referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopyReferralLink}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-200"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "복사됨" : "링크 복사"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>

      <LinkManager />

      <div className="mt-10 border-t border-slate-100 pt-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
          공개 페이지 미리보기
        </h3>
        <LinkPage />
      </div>
    </div>
  );
}
