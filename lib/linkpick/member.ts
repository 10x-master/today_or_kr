// 회원 관련 순수 로직. 로그인은 Supabase Auth(Google·Kakao)가 담당하고,
// 프로필·추천 관계는 profiles 테이블과 RPC 함수(claim_referrer, my_partners)로 다룬다.
// (LinkPick 프로젝트에서 이식)
import type { User } from "@supabase/supabase-js";

export type SocialProvider = "google" | "kakao";

export type Member = {
  // Supabase Auth 사용자 ID (이 로그인 자체).
  id: string;
  // 이 로그인이 바라보는 프로필 ID. 전화번호로 계정을 통합했다면 기존 프로필의 ID다.
  // profiles.id, user_links.profile_id에 쓰는 값은 이것이다.
  profileId: string;
  name: string;
  // 추천 링크·랜딩페이지에 노출되는 표시명. 비어 있으면 name을 쓴다.
  displayName: string;
  provider: string;
  referralCode: string;
};

// profiles 테이블 한 행 (필요한 열만). RLS상 이 로그인이 바라보는 프로필 한 줄만 읽힌다.
export type ProfileRow = {
  id: string;
  name: string;
  display_name: string;
  referral_code: string;
  referred_by: string | null;
  phone: string | null;
  consent_at: string | null;
};

export type Partner = {
  name: string;
  joinedAt: string;
};

// OAuth를 거쳐 페이지가 다시 열려도 추천 코드가 남도록 로컬 저장소에 보관한다.
export const REF_STORAGE_KEY = "linkpick:ref";

const REF_CODE = /^[a-zA-Z0-9_-]{1,40}$/;

export function isValidRefCode(code: string): boolean {
  return REF_CODE.test(code);
}

function pickString(meta: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

// 프로필 행이 아직 없거나 읽지 못할 때 쓰는 기본값. 프로필 트리거와 같은 규칙을 따른다.
export function toMember(user: User, profile: ProfileRow | null): Member {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    profile?.name?.trim() ||
    pickString(meta, ["full_name", "name", "nickname", "preferred_username"]) ||
    user.email?.split("@")[0] ||
    "파트너";
  const provider =
    typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : "";

  return {
    id: user.id,
    profileId: profile?.id ?? user.id,
    name,
    displayName: profile?.display_name?.trim() || name,
    provider,
    referralCode: profile?.referral_code ?? user.id.replace(/-/g, "").slice(0, 8),
  };
}
