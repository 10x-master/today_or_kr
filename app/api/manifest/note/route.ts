import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppPwaSetting } from "@/lib/db/store";
import type { AppPwaSetting } from "@/types/pwa";

/**
 * 티노트 (t.note) 동적 Web App Manifest Route Handler
 * GET /api/manifest/note
 */
export async function GET() {
  let setting: AppPwaSetting | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_pwa_settings")
        .select("*")
        .eq("app_target", "TODAY_NOTE")
        .single();

      if (!error && data) {
        setting = data as AppPwaSetting;
      }
    }
  } catch (err) {
    console.warn("Supabase fetch failed for TODAY_NOTE manifest:", err);
  }

  if (!setting) {
    setting = getAppPwaSetting("TODAY_NOTE");
  }

  const manifest = {
    name: "티노트 (t.note)",
    short_name: "t.note",
    description: "티노트 (t.note) - 개인 업무일지 & 단지 티단노트 협업 워크OS",
    start_url: setting.start_url || "/workspace",
    display: "standalone",
    orientation: "portrait",
    background_color: setting.background_color || "#FFFFFF",
    theme_color: setting.theme_color || "#FFFFFF",
    icons: [
      {
        src: setting.icon_192_url || "/icons/todaynote-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: setting.icon_512_url || "/icons/todaynote-512.png",
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
