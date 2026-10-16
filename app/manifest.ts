import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppPwaSetting } from "@/lib/db/store";
import type { AppPwaSetting } from "@/types/pwa";

/**
 * PWA Dynamic Web App Manifest
 * Supabase `app_pwa_settings` (TODAY_MAIN) 연동
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
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
    console.warn("Failed to load PWA settings from Supabase:", err);
  }

  if (!setting) {
    setting = getAppPwaSetting("TODAY_MAIN");
  }

  return {
    name: setting.app_name,
    short_name: setting.short_name,
    description: "로컬 행정 고시 및 인프라 팩트 피드",
    start_url: setting.start_url || "/",
    display: "standalone",
    background_color: setting.background_color || "#FFFFFF",
    theme_color: setting.theme_color || "#FFFFFF",
    icons: [
      {
        src: setting.icon_192_url || "/icons/today-192.png?v=6",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: setting.icon_512_url || "/icons/today-512.png?v=6",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
