import { NextRequest, NextResponse } from "next/server";

/**
 * 구글 OAuth 인증 시작 핸들러
 * GET /api/auth/google?userId=user-001
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || "user-001";
  // 연동 완료 후 돌아갈 경로 (미지정 시 기존처럼 /workspace로 복귀)
  const redirectPath = searchParams.get("redirect");
  const state = redirectPath ? `${userId}::${encodeURIComponent(redirectPath)}` : userId;

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // 실제 구글 클라이언트 ID가 설정된 경우 구글 로그인 창으로 리다이렉트
  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  }

  // 구글 API 키 미설정 시: 원활한 시연을 위해 데모 인증 콜백으로 자동 연결
  const demoCallbackUrl = `${redirectUri}?code=demo_oauth_code_success&state=${encodeURIComponent(
    state
  )}`;
  return NextResponse.redirect(demoCallbackUrl);
}
