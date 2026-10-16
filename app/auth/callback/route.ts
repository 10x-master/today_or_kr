import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth 콜백 라우트 핸들러
 * 카카오 등 OAuth 공급자 인증 후 전달된 auth code를 세션으로 교환하고,
 * profiles 테이블에 사용자 정보를 자동 upsert/sync한 뒤 지정된 경로로 리다이렉트합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/workspace";

  // 상대 경로 검증 (오픈 리다이렉트 방지)
  const safeNext = next.startsWith("/") ? next : "/workspace";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const user = data.user;
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "카카오 입주민";
        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;
        const email = user.email || user.user_metadata?.email || null;

        try {
          // 기존 프로필(수동 승격된 ADMIN/SUPER_ADMIN 등)이 있으면 role을 보존하고,
          // 신규 가입자만 공급자 기준 기본 역할(구글=영업사원·비즈니스 / 카카오=주민·소상공인)을 부여
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const provider = user.app_metadata?.provider;
          const defaultRole = provider === "google" ? "STORE_OWNER" : "USER";
          const role = existingProfile?.role || defaultRole;

          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email,
              full_name: fullName,
              avatar_url: avatarUrl,
              role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (syncErr) {
          console.warn("Failed to sync profile during auth callback:", syncErr);
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${safeNext}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
        } else {
          return NextResponse.redirect(`${origin}${safeNext}`);
        }
      } else {
        console.warn("Exchange code error in callback:", error?.message);
      }
    }
  }

  // code가 없거나 교환 실패 시에도 안전하게 목적지로 이동
  return NextResponse.redirect(`${origin}${safeNext}`);
}
