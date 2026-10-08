"use client";

import { useState } from "react";
import type { SocialProvider } from "@/lib/linkpick/member";
import { errorText } from "../styles";
import { ModalShell } from "./ModalShell";
import { useMember } from "./member-context";

const providers: { id: SocialProvider; label: string; className: string }[] = [
  {
    id: "google",
    label: "Google로 계속하기",
    className: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  },
  {
    id: "kakao",
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[#191919] hover:brightness-95",
  },
];

// 로그인과 회원가입은 같은 소셜 로그인 흐름이다. 처음 로그인하면 계정이 만들어진다.
export function LoginModal({ mode }: { mode: "login" | "signup" }) {
  const { signInWith, closeModal, authConfigured, refCode } = useMember();
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  async function handleClick(provider: SocialProvider) {
    setError("");
    setPendingProvider(provider);
    const result = await signInWith(provider);
    // 성공하면 제공자 로그인 페이지로 이동하므로 여기서는 실패만 처리한다.
    if (result) {
      setError(result);
      setPendingProvider(null);
    }
  }

  const isSignup = mode === "signup";

  return (
    <ModalShell labelledBy="auth-title" onClose={closeModal} maxWidth="max-w-md">
      <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
        {isSignup ? "파트너 회원가입" : "파트너 로그인"}
      </span>
      <h2
        id="auth-title"
        className="mt-3 pr-14 text-2xl font-extrabold leading-snug tracking-tight text-slate-800"
      >
        {isSignup ? "간편하게 시작하기" : "로그인"}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {isSignup
          ? "별도 비밀번호 없이 소셜 계정으로 가입할 수 있습니다."
          : "가입할 때 사용한 소셜 계정으로 로그인하세요."}
      </p>

      {refCode && (
        <p className="mt-4 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-bold text-primary">
          추천 링크로 방문하셨어요. 추천 코드 <span className="tabular-nums">{refCode}</span>가 저장되어 가입 후 연결됩니다.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleClick(provider.id)}
            disabled={!authConfigured || pendingProvider !== null}
            className={`flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${provider.className}`}
          >
            {pendingProvider === provider.id ? "이동 중..." : provider.label}
          </button>
        ))}
      </div>

      {!authConfigured && (
        <p className="mt-4 text-sm text-slate-500">로그인 설정을 준비 중입니다.</p>
      )}
      {error && (
        <p aria-live="polite" className={errorText}>
          {error}
        </p>
      )}
    </ModalShell>
  );
}
