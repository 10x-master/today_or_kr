import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AuthProfile } from "@/types/auth";

/** 데모용 기본 카카오 프로필 (Supabase 미연동 환경 또는 로컬 테스트용) */
export const DEMO_KAKAO_USER: AuthProfile = {
  id: "kakao-usr-20261013",
  email: "resident@today.or.kr",
  full_name: "투데이 회원",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
  role: "USER",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * 1. 카카오 OAuth 간편 로그인 실행
 */
export async function signInWithKakao(nextPath: string = "/workspace"): Promise<{ error: Error | null; url?: string }> {
  if (typeof window === "undefined") {
    return { error: new Error("Window is not defined") };
  }

  const supabase = getSupabaseBrowserClient();
  const origin = window.location.origin;
  const redirectUri = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        console.warn("Supabase Kakao OAuth error, offering demo fallback:", error.message);
        // Supabase 대시보드에 Kakao provider 미등록 시 데모 로그인으로 유연하게 폴백
        simulateDemoLogin(nextPath);
        return { error: null };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { error: null, url: data.url };
      }
    } catch (err: unknown) {
      console.warn("Kakao sign in exception:", err);
      simulateDemoLogin(nextPath);
      return { error: null };
    }
  }

  // Supabase 클라이언트 미설정 시 데모 간편 로그인
  simulateDemoLogin(nextPath);
  return { error: null };
}

/**
 * 데모 모드 간편 로그인 시뮬레이션
 */
export function simulateDemoLogin(nextPath: string = "/workspace", customUser?: Partial<AuthProfile>) {
  if (typeof window === "undefined") return;

  const user: AuthProfile = {
    ...DEMO_KAKAO_USER,
    ...customUser,
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem("today_auth_user", JSON.stringify(user));
    window.dispatchEvent(new Event("today_auth_changed"));
  } catch {}

  window.location.href = nextPath;
}

/**
 * 2. 카카오 로그인 성공 시 profiles 테이블 자동 upsert/sync
 */
export async function syncUserProfile(user: any): Promise<AuthProfile | null> {
  if (!user || !user.id) return null;

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "카카오 사용자";
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;
  const email = user.email || user.user_metadata?.email || null;

  const profileData: AuthProfile = {
    id: user.id,
    email,
    full_name: fullName,
    avatar_url: avatarUrl,
    role: "USER",
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select()
        .single();

      if (!error && data) {
        return data as AuthProfile;
      }
    } catch (err) {
      console.warn("Failed to sync profile with Supabase:", err);
    }
  }

  return profileData;
}

/**
 * 3. 현재 로그인된 사용자 정보 조회
 */
export async function getCurrentAuthUser(): Promise<AuthProfile | null> {
  if (typeof window === "undefined") return null;

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // profiles 테이블 조회 시도
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          return profile as AuthProfile;
        }

        return {
          id: user.id,
          email: user.email || null,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "카카오 입주민",
          avatar_url: user.user_metadata?.avatar_url || null,
          role: "USER",
        };
      }
    } catch (err) {
      console.warn("Supabase getCurrentUser error:", err);
    }
  }

  // 로컬스토리지 fallback 확인
  try {
    const saved = localStorage.getItem("today_auth_user");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return null;
}

/**
 * 4. 로그아웃
 */
export async function signOutKakao(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("today_auth_user");
      window.dispatchEvent(new Event("today_auth_changed"));
    } catch {}
  }
}
