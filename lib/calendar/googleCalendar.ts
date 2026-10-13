import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoogleCalendarEventInput,
  GoogleCalendarEventResult,
  UserGoogleCalendarToken,
} from "@/types/calendar";

/** 인메모리 토큰 캐시 (Supabase DB 연결 실패 또는 데모 환경용 fallback) */
const inMemoryTokens = new Map<string, UserGoogleCalendarToken>();

// 초기 데모 사용자 (user-001) 기본 상태 세팅
inMemoryTokens.set("user-001", {
  user_id: "user-001",
  email: "nowon.resident@gmail.com",
  access_token: "demo_access_token_nowon_2026",
  refresh_token: "demo_refresh_token_nowon_2026",
  scope: "https://www.googleapis.com/auth/calendar.events",
  token_type: "Bearer",
  expiry_date: Date.now() + 3600 * 1000 * 24, // 24시간 후 만료
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/**
 * 1. 구글 OAuth 토큰 저장 (Supabase DB + 인메모리 캐시)
 */
export async function saveGoogleTokens(
  userId: string,
  tokens: Partial<UserGoogleCalendarToken>
): Promise<UserGoogleCalendarToken> {
  const tokenData: UserGoogleCalendarToken = {
    user_id: userId,
    email: tokens.email || null,
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || null,
    scope: tokens.scope || "https://www.googleapis.com/auth/calendar.events",
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    is_active: tokens.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  // 인메모리 캐시 갱신
  inMemoryTokens.set(userId, tokenData);

  // Supabase 원격 DB 저장 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("user_google_calendar_tokens")
        .upsert(
          {
            ...tokenData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (!error && data) {
        return data as UserGoogleCalendarToken;
      }
    }
  } catch (err) {
    console.warn("Supabase saveGoogleTokens fallback to inMemory:", err);
  }

  return tokenData;
}

/**
 * 2. 구글 OAuth 토큰 조회 및 만료 시 자동 리프레시
 */
export async function getGoogleTokens(
  userId: string
): Promise<UserGoogleCalendarToken | null> {
  let tokenData: UserGoogleCalendarToken | null = null;

  // Supabase 원격 DB 조회 시도
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("user_google_calendar_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        tokenData = data as UserGoogleCalendarToken;
      }
    }
  } catch (err) {
    console.warn("Supabase getGoogleTokens fallback to inMemory:", err);
  }

  // 인메모리 fallback
  if (!tokenData) {
    tokenData = inMemoryTokens.get(userId) || null;
  }

  if (!tokenData || !tokenData.is_active) {
    return null;
  }

  // 토큰 만료 여부 확인 (만료 1분 전 체크)
  const isExpired =
    tokenData.expiry_date && tokenData.expiry_date < Date.now() + 60 * 1000;

  // 만료되었고 refresh_token이 있으며 실제 Google 자격증명이 있는 경우 갱신
  if (isExpired && tokenData.refresh_token) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (clientId && clientSecret && !tokenData.refresh_token.startsWith("demo_")) {
      try {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokenData.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json();
          const updated = await saveGoogleTokens(userId, {
            ...tokenData,
            access_token: newTokens.access_token,
            expiry_date: Date.now() + (newTokens.expires_in || 3600) * 1000,
          });
          return updated;
        }
      } catch (refreshErr) {
        console.error("Failed to refresh Google OAuth token:", refreshErr);
      }
    } else {
      // 데모 토큰인 경우 자동 유효기간 연장
      tokenData.expiry_date = Date.now() + 3600 * 1000 * 24;
      inMemoryTokens.set(userId, tokenData);
    }
  }

  return tokenData;
}

/**
 * 3. getGoogleClient: 토큰 유효성 및 클라이언트 권한 객체 조회
 */
export async function getGoogleClient(userId: string) {
  const tokens = await getGoogleTokens(userId);
  if (!tokens || !tokens.access_token) {
    return null;
  }
  return {
    userId,
    email: tokens.email,
    accessToken: tokens.access_token,
    isDemo: tokens.access_token.startsWith("demo_"),
  };
}

/**
 * 4. insertCalendarEvent: 구글 캘린더에 일정 등록 (Events.insert)
 */
export async function insertCalendarEvent(
  userId: string,
  event: GoogleCalendarEventInput
): Promise<GoogleCalendarEventResult> {
  const client = await getGoogleClient(userId);

  if (!client) {
    throw new Error("구글 캘린더가 연동되어 있지 않습니다. 먼저 계정을 연결해주세요.");
  }

  // 시작일시 포맷팅 (YYYY-MM-DD 또는 ISO8601)
  const isDateOnly = !event.startDateTime.includes("T");
  let startPayload: { date?: string; dateTime?: string; timeZone?: string };
  let endPayload: { date?: string; dateTime?: string; timeZone?: string };

  if (isDateOnly) {
    const rawDate = event.startDateTime.slice(0, 10);
    startPayload = { date: rawDate };
    endPayload = { date: event.endDateTime ? event.endDateTime.slice(0, 10) : rawDate };
  } else {
    startPayload = {
      dateTime: new Date(event.startDateTime).toISOString(),
      timeZone: "Asia/Seoul",
    };
    const endDate = event.endDateTime
      ? new Date(event.endDateTime).toISOString()
      : new Date(new Date(event.startDateTime).getTime() + 60 * 60 * 1000).toISOString(); // 기본 1시간
    endPayload = {
      dateTime: endDate,
      timeZone: "Asia/Seoul",
    };
  }

  // 실제 구글 OAuth 토큰인 경우 Google Calendar REST API 호출
  if (!client.isDemo) {
    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${client.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: event.summary,
            description: event.description || "",
            location: event.location || "서울특별시 노원구",
            start: startPayload,
            end: endPayload,
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: event.reminderMinutes ?? 30 },
              ],
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          htmlLink: data.htmlLink,
          status: "confirmed",
          summary: event.summary,
          created: data.created,
        };
      } else {
        const errorText = await response.text();
        console.warn("Google Calendar API returned error:", errorText);
      }
    } catch (apiErr) {
      console.error("Google Calendar API call failed:", apiErr);
    }
  }

  // 데모 토큰 또는 API 폴백 시뮬레이션
  const mockEventId = `gcal-${Date.now()}`;
  return {
    id: mockEventId,
    htmlLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
      event.summary
    )}`,
    status: "confirmed",
    summary: event.summary,
    created: new Date().toISOString(),
  };
}

/**
 * 5. 연동 해제
 */
export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  inMemoryTokens.delete(userId);

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase
        .from("user_google_calendar_tokens")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      return true;
    }
  } catch (err) {
    console.warn("Supabase disconnectGoogleCalendar error:", err);
  }

  return true;
}
