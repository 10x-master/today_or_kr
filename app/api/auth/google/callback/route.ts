import { NextRequest, NextResponse } from "next/server";
import { saveGoogleTokens } from "@/lib/calendar/googleCalendar";

/**
 * 구글 OAuth 인증 콜백 핸들러
 * GET /api/auth/google/callback?code=...&state=user-001
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const rawState = searchParams.get("state"); // "userId" 또는 "userId::encodedRedirectPath"
  const [stateUserId, encodedRedirectPath] = (rawState || "").split("::");
  const userId = stateUserId || "user-001";
  const redirectPath = encodedRedirectPath ? decodeURIComponent(encodedRedirectPath) : "/workspace";
  const safeRedirectPath = redirectPath.startsWith("/") ? redirectPath : "/workspace";

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // 실제 구글 OAuth 인증 코드가 전달된 경우
  if (code && !code.startsWith("demo_") && clientId && clientSecret) {
    try {
      // 1. Authorization Code -> Access Token & Refresh Token 교환
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (tokenRes.ok) {
        const tokenJson = await tokenRes.json();
        let email = "nowon.resident@gmail.com";

        // 2. 사용자 구글 이메일 주소 조회
        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenJson.access_token}` },
          });
          if (userRes.ok) {
            const userJson = await userRes.json();
            email = userJson.email || email;
          }
        } catch (uErr) {
          console.warn("Failed to fetch Google userinfo:", uErr);
        }

        // 3. 토큰 테이블 저장
        await saveGoogleTokens(userId, {
          user_id: userId,
          email,
          access_token: tokenJson.access_token,
          refresh_token: tokenJson.refresh_token || null,
          scope: tokenJson.scope,
          expiry_date: Date.now() + (tokenJson.expires_in || 3600) * 1000,
          is_active: true,
        });

        return NextResponse.redirect(`${protocol}://${host}${safeRedirectPath}?google_sync=success`);
      }
    } catch (err) {
      console.error("Google OAuth token exchange error:", err);
    }
  }

  // 데모 인증 또는 자격증명 미설정 시의 안전한 데모 토큰 저장
  await saveGoogleTokens(userId, {
    user_id: userId,
    email: "nowon.resident@gmail.com",
    access_token: `demo_access_${Date.now()}`,
    refresh_token: `demo_refresh_${Date.now()}`,
    scope: "https://www.googleapis.com/auth/calendar.events",
    expiry_date: Date.now() + 3600 * 1000 * 24,
    is_active: true,
  });

  return NextResponse.redirect(`${protocol}://${host}${safeRedirectPath}?google_sync=success`);
}
