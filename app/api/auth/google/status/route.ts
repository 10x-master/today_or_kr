import { NextRequest, NextResponse } from "next/server";
import {
  disconnectGoogleCalendar,
  getGoogleTokens,
} from "@/lib/calendar/googleCalendar";

/**
 * 구글 캘린더 연동 상태 확인 및 해제 API
 * GET /api/auth/google/status?userId=user-001
 * POST /api/auth/google/status (연동 해제)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || "user-001";

  const tokens = await getGoogleTokens(userId);

  if (!tokens || !tokens.is_active) {
    return NextResponse.json({
      isConnected: false,
    });
  }

  return NextResponse.json({
    isConnected: true,
    email: tokens.email || "nowon.resident@gmail.com",
    expiresAt: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId || "user-001";

    if (body.action === "disconnect") {
      await disconnectGoogleCalendar(userId);
      return NextResponse.json({
        success: true,
        isConnected: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Google auth status POST error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
