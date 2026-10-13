import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdCampaigns } from "@/lib/db/store";
import type { AdCampaign } from "@/types/officialNotice";

/**
 * 활성 스폰서 광고 캠페인 조회
 * GET /api/ad-campaigns
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          campaigns: data as AdCampaign[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase query fallback to mock store for ad_campaigns:", err);
  }

  const campaigns = getAdCampaigns();
  return NextResponse.json({
    campaigns,
    source: "mock",
  });
}
