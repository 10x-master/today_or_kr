import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { simulateDemoLogin } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

/** 데모용 기본 구글 비즈니스 프로필 (Supabase 미연동 환경 또는 로컬 테스트용) */
export const DEMO_GOOGLE_USER: AuthProfile = {
  id: "google-usr-20261016",
  email: "sales@today.or.kr",
  full_name: "투데이 영업사원",
  avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
  role: "STORE_OWNER",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * 구글 OAuth 로그인 실행 (영업사원·비즈니스용, 드라이브 연동 scope 포함)
 */
export async function signInWithGoogle(nextPath: string = "/workspace"): Promise<{ error: Error | null; url?: string }> {
  if (typeof window === "undefined") {
    return { error: new Error("Window is not defined") };
  }

  const supabase = getSupabaseBrowserClient();
  const origin = window.location.origin;
  const redirectUri = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          scopes: "https://www.googleapis.com/auth/drive.file",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.warn("Supabase Google OAuth error, offering demo fallback:", error.message);
        simulateDemoLogin(nextPath, DEMO_GOOGLE_USER);
        return { error: null };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { error: null, url: data.url };
      }
    } catch (err: unknown) {
      console.warn("Google sign in exception:", err);
      simulateDemoLogin(nextPath, DEMO_GOOGLE_USER);
      return { error: null };
    }
  }

  simulateDemoLogin(nextPath, DEMO_GOOGLE_USER);
  return { error: null };
}
