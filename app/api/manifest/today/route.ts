import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppPwaSetting } from "@/lib/db/store";
import type { AppPwaSetting } from "@/types/pwa";

/**
 * Today. 동적 Web App Manifest Route Handler
 * GET /api/manifest/today
 */
export async function GET() {
  let setting: AppPwaSetting | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_pwa_settings")
        .select("*")
        .eq("app_target", "TODAY_MAIN")
        .single();

      if (!error && data) {
        setting = data as AppPwaSetting;
      }
    }
  } catch (err) {
    console.warn("Supabase fetch failed for TODAY_MAIN manifest:", err);
  }

  if (!setting) {
    setting = getAppPwaSetting("TODAY_MAIN");
  }

  const manifest = {
    name: "Today.",
    short_name: "Today.",
    description: "로컬 행정 고시 및 인프라 팩트 피드",
    start_url: setting.start_url || "/",
    display: "standalone",
    orientation: "portrait",
    background_color: setting.background_color || "#FFFFFF",
    theme_color: setting.theme_color || "#FFFFFF",
    icons: [
      {
        src: setting.icon_192_url || "/icons/today-192.png?v=3",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: setting.icon_512_url || "/icons/today-512.png?v=3",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
