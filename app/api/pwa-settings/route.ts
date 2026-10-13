import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAppPwaSettings } from "@/lib/db/mockSeed";
import type { AppPwaSetting, AppPwaTarget } from "@/types/pwa";

/**
 * PWA 설정 조회 및 수정 API
 * GET /api/pwa-settings?target=TODAY_MAIN
 * POST /api/pwa-settings (설정 업데이트)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const target = searchParams.get("target") as AppPwaTarget | null;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("app_pwa_settings").select("*");
      if (target) {
        query = query.eq("app_target", target);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          settings: target ? (data[0] as AppPwaSetting) : (data as AppPwaSetting[]),
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase query fallback to mock for app_pwa_settings:", err);
  }

  // 폴백
  if (target) {
    const found = mockAppPwaSettings.find((s) => s.app_target === target);
    return NextResponse.json({
      settings: found || mockAppPwaSettings[0],
      source: "mock",
    });
  }

  return NextResponse.json({
    settings: mockAppPwaSettings,
    source: "mock",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AppPwaSetting;
    if (!body.app_target) {
      return NextResponse.json({ error: "app_target is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_pwa_settings")
        .upsert(
          {
            app_target: body.app_target,
            app_name: body.app_name,
            short_name: body.short_name,
            start_url: body.start_url,
            icon_192_url: body.icon_192_url,
            icon_512_url: body.icon_512_url,
            theme_color: body.theme_color || "#FFFFFF",
            background_color: body.background_color || "#FFFFFF",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "app_target" }
        )
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, setting: data, source: "supabase" });
      }
    }

    // 로컬 폴백 업데이트
    const idx = mockAppPwaSettings.findIndex((s) => s.app_target === body.app_target);
    if (idx >= 0) {
      mockAppPwaSettings[idx] = { ...mockAppPwaSettings[idx], ...body };
    }

    return NextResponse.json({
      success: true,
      setting: body,
      source: "mock",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update PWA settings", details: String(err) },
      { status: 500 }
    );
  }
}
