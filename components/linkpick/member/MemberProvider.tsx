"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  REF_STORAGE_KEY,
  isValidRefCode,
  toMember,
  type Member,
  type Partner,
  type ProfileRow,
  type SocialProvider,
} from "@/lib/linkpick/member";
import { LoginModal } from "./LoginModal";
import { MemberContext, type MemberContextValue } from "./member-context";

type AuthModal = "none" | "login" | "signup";

// 프로필 열은 한 곳에서만 고른다. RLS가 이 로그인이 바라보는 프로필 한 줄만 돌려준다.
const PROFILE_COLUMNS = "id, name, display_name, referral_code, referred_by, phone, consent_at";

// 프로필·파트너 데이터는 어떤 사용자의 것인지 함께 보관한다.
// 로그아웃 후 다른 계정으로 로그인해도 이전 계정의 데이터가 보이지 않도록 하기 위해서다.
type Scoped<T> = { userId: string; value: T };

// 서버가 이 메시지를 돌려주면 저장된 추천 코드는 다시 쓸 수 없으므로 지운다.
const REFERRAL_REJECTED = ["invalid_referral", "self_referral"];

export function MemberProvider({ children }: { children: ReactNode }) {
  // 브라우저에서만 Supabase를 만든다. 서버 프리렌더 단계에서는 null이다.
  const supabase = useMemo<SupabaseClient | null>(
    () => (typeof window === "undefined" ? null : getSupabaseBrowserClient()),
    [],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // 설정이 없으면 확인할 세션도 없으므로 바로 준비된 상태로 본다.
  const authReady = !supabase || sessionChecked;
  const [authModal, setAuthModal] = useState<AuthModal>("none");
  // 추천 코드는 브라우저에 남아 있을 수 있으므로 처음부터 읽는다. 서버에서는 빈 값.
  const [refCode, setRefCodeState] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = window.localStorage.getItem(REF_STORAGE_KEY);
    return stored && isValidRefCode(stored) ? stored : "";
  });
  const [profileState, setProfileState] = useState<Scoped<ProfileRow | null> | null>(null);
  const [partnersState, setPartnersState] = useState<Scoped<Partner[]> | null>(null);
  const [referrerState, setReferrerState] = useState<{ code: string; name: string } | null>(
    null,
  );

  const userId = session?.user.id ?? null;

  // 추천 코드가 생기면 추천인의 표시명을 한 번 조회한다. 로그인 여부와 무관하게 동작한다.
  useEffect(() => {
    if (!supabase || !refCode) return;

    let active = true;
    supabase.rpc("referrer_display_name", { p_code: refCode }).then(({ data, error }) => {
      if (!active) return;
      const name = !error && typeof data === "string" && data ? data : null;
      setReferrerState(name ? { code: refCode, name } : null);
    });
    return () => {
      active = false;
    };
  }, [supabase, refCode]);

  // 다른 코드의 결과가 남아 있으면 보여주지 않는다.
  const referrer = refCode && referrerState?.code === refCode ? referrerState : null;

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그인한 회원이 바뀔 때마다 프로필을 읽고, 저장된 추천 코드를 등록하고, 파트너 목록을 읽는다.
  useEffect(() => {
    if (!supabase || !userId) return;
    const client = supabase;

    let active = true;

    async function readProfile(): Promise<ProfileRow | null> {
      // 계정을 통합한 로그인이면 RLS가 기존 프로필을 골라 준다. 여기서 auth 사용자 ID로 거르면 안 된다.
      const { data } = await client.from("profiles").select(PROFILE_COLUMNS).maybeSingle();
      return (data as ProfileRow | null) ?? null;
    }

    async function load() {
      let profile = await readProfile();

      const stored = window.localStorage.getItem(REF_STORAGE_KEY);
      if (stored && isValidRefCode(stored) && profile) {
        // 이미 추천인이 있는 회원이면 저장된 코드는 더 쓸 곳이 없으므로 바로 지운다.
        let done = Boolean(profile.referred_by);
        if (!done) {
          const { error } = await client.rpc("claim_referrer", { p_code: stored });
          // 등록되었거나 거절된 코드는 지운다. 네트워크 오류 등 일시적 실패는 다음에 다시 시도한다.
          done = !error || REFERRAL_REJECTED.some((key) => error.message.includes(key));
          if (!error) profile = await readProfile();
        }
        if (done) {
          window.localStorage.removeItem(REF_STORAGE_KEY);
          if (active) setRefCodeState("");
        }
      }

      const { data: partnerRows, error: partnerError } = await client.rpc("my_partners");
      const partners: Partner[] = partnerError
        ? []
        : ((partnerRows ?? []) as { name: string; joined_at: string }[]).map((row) => ({
            name: row.name || "파트너",
            joinedAt: row.joined_at.slice(0, 10),
          }));

      if (!active) return;
      setProfileState({ userId: userId!, value: profile });
      setPartnersState({ userId: userId!, value: partners });
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase, userId]);

  const profileLoaded = profileState?.userId === userId;
  const profile = profileLoaded ? profileState.value : null;
  const partners = useMemo<Partner[]>(
    () => (partnersState?.userId === userId ? partnersState.value : []),
    [partnersState, userId],
  );

  const saveDisplayName = useCallback(
    async (displayName: string) => {
      if (!supabase || !profile) return "로그인이 필요합니다.";

      // 전화번호는 인증 함수로만 바뀐다. 여기서는 표시명만 고친다.
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select(PROFILE_COLUMNS)
        .maybeSingle();

      if (error || !data) return "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

      setProfileState({ userId: userId!, value: data as ProfileRow });
      return null;
    },
    [supabase, userId, profile],
  );

  const setRefCode = useCallback((code: string) => {
    if (!isValidRefCode(code)) return;
    window.localStorage.setItem(REF_STORAGE_KEY, code);
    setRefCodeState(code);
  }, []);

  const openSignup = useCallback(() => setAuthModal("signup"), []);
  const openLogin = useCallback(() => setAuthModal("login"), []);
  const closeModal = useCallback(() => setAuthModal("none"), []);

  const signInWith = useCallback(
    async (provider: SocialProvider) => {
      if (!supabase) return "로그인 설정을 준비 중입니다. 잠시 후 다시 시도해 주세요.";

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          // Supabase's Kakao provider requests account_email by default.
          // Override it so only nickname/profile scopes are requested (KOE205 otherwise).
          ...(provider === "kakao" && { scopes: "profile_nickname profile_image" }),
        },
      });
      return error ? "로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요." : null;
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const currentUser = useMemo<Member | null>(
    () => (session?.user ? toMember(session.user, profile) : null),
    [session, profile],
  );

  const value = useMemo<MemberContextValue>(
    () => ({
      currentUser,
      partners,
      authReady,
      authConfigured: supabase !== null,
      refCode,
      referrer,
      setRefCode,
      openSignup,
      openLogin,
      closeModal,
      signInWith,
      logout,
      saveDisplayName,
    }),
    [
      currentUser,
      partners,
      authReady,
      supabase,
      refCode,
      referrer,
      setRefCode,
      openSignup,
      openLogin,
      closeModal,
      signInWith,
      logout,
      saveDisplayName,
    ],
  );

  return (
    <MemberContext.Provider value={value}>
      {children}
      {authModal !== "none" && <LoginModal mode={authModal} />}
    </MemberContext.Provider>
  );
}
