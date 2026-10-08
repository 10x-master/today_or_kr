"use client";

import { createContext, useContext } from "react";
import type { Member, Partner, SocialProvider } from "@/lib/linkpick/member";

export type MemberContextValue = {
  currentUser: Member | null;
  // 로그인한 회원의 직속 파트너 목록 (내 추천 코드로 가입한 회원).
  partners: Partner[];
  // 세션 확인이 끝났는지. false인 동안에는 로그인 상태를 단정하지 않는다.
  authReady: boolean;
  // Supabase 환경변수가 설정되어 실제 로그인을 쓸 수 있는지.
  authConfigured: boolean;
  // 추천 링크(?ref=코드)로 들어왔을 때 보관된 코드.
  refCode: string;
  // 보관된 추천 코드의 추천인 표시명. 코드가 없거나 찾지 못하면 null.
  referrer: { code: string; name: string } | null;
  setRefCode: (code: string) => void;
  openSignup: () => void;
  openLogin: () => void;
  closeModal: () => void;
  // 실패하면 에러 메시지를, 성공하면 null을 돌려준다. 성공 시 페이지가 OAuth 제공자로 이동한다.
  signInWith: (provider: SocialProvider) => Promise<string | null>;
  logout: () => Promise<void>;
  // 내 표시명(display_name)을 저장한다. 실패하면 에러 메시지를, 성공하면 null을 돌려준다.
  saveDisplayName: (displayName: string) => Promise<string | null>;
};

export const MemberContext = createContext<MemberContextValue | null>(null);

export function useMember(): MemberContextValue {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error("useMember는 MemberProvider 안에서만 쓸 수 있습니다.");
  }
  return context;
}
