import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTsalesLeads } from "@/lib/db/store";
import { optimizeRoute } from "@/lib/tsales/routeOptimizer";
import type { TsalesLead } from "@/types/tsales";

/**
 * t.세일즈 영업 동선 최적화 — 선택한 리드들을 최근접 이웃(Nearest Neighbor) 휴리스틱으로
 * 방문 순서를 정렬한다. 외부 지도 Directions API 없이 직선거리(Haversine) 기준으로 근사한다.
 * POST /api/t-sales/route-optimize { lead_ids: string[], start_lat?, start_lng? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const leadIds: unknown = body.lead_ids;
    const startLat: unknown = body.start_lat;
    const startLng: unknown = body.start_lng;

    if (!Array.isArray(leadIds) || leadIds.length === 0 || !leadIds.every((v) => typeof v === "string")) {
      return NextResponse.json({ error: "lead_ids는 1개 이상의 문자열 배열이어야 합니다." }, { status: 400 });
    }

    let leads: TsalesLead[] = [];
    let source: "supabase" | "mock" = "mock";

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.from("tsales_leads").select("*").in("id", leadIds);
        if (!error && data) {
          leads = data as TsalesLead[];
          source = "supabase";
        }
      }
    } catch (err) {
      console.warn("Supabase tsales_leads route-optimize fallback to mock store:", err);
    }

    if (leads.length === 0) {
      leads = getTsalesLeads().filter((lead) => leadIds.includes(lead.id));
      source = "mock";
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: "요청한 리드를 찾을 수 없습니다." }, { status: 404 });
    }

    const start =
      typeof startLat === "number" && typeof startLng === "number" ? { lat: startLat, lng: startLng } : undefined;
    const stops = optimizeRoute(leads, start);
    const totalDistanceMeters = stops.length > 0 ? stops[stops.length - 1].cumulativeDistanceMeters : 0;

    return NextResponse.json({ stops, totalDistanceMeters, source });
  } catch (err) {
    console.error("Failed to optimize tsales route:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
