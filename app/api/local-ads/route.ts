import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createLocalAd,
  getLocalAds,
  toggleLocalAdActive,
  updateLocalAdStatus,
} from "@/lib/db/store";
import type { AdStatus, LocalAd } from "@/types/officialNotice";

/**
 * GET /api/local-ads
 * 파트너스 광고 목록 조회 (Supabase local_ads 테이블 연동 + mock 폴백)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as AdStatus) || undefined;
  const dong = searchParams.get("dong") || undefined;
  const partnerId = searchParams.get("partner_id") || undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase.from("local_ads").select("*").order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);
      if (partnerId) query = query.eq("partner_id", partnerId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          ads: data as LocalAd[],
          source: "supabase",
        });
      }
    }
  } catch (err) {
    console.warn("Supabase query fallback to mock for local_ads:", err);
  }

  const ads = getLocalAds({ status, dong, partnerId });
  return NextResponse.json({
    ads,
    source: "mock",
  });
}

/**
 * POST /api/local-ads
 * 신규 파트너스 비즈보드 광고 신청 (status: 'PENDING' / 최고관리자는 'APPROVED')
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      partner_id,
      partner_name,
      registered_dong,
      target_dongs,
      main_copy,
      sub_copy,
      image_url,
      landing_url,
      package_days,
      is_super_admin,
    } = body;

    if (!partner_name || !main_copy || !sub_copy) {
      return NextResponse.json(
        { error: "필수 광고 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const initialStatus: AdStatus = is_super_admin ? "APPROVED" : "PENDING";
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + (package_days || 7) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const payload: Omit<LocalAd, "id" | "created_at" | "impressions" | "clicks"> = {
      partner_id: partner_id || null,
      partner_name,
      registered_dong: registered_dong || "상계동",
      target_dongs: target_dongs || ["상계동"],
      main_copy,
      sub_copy,
      image_url: image_url || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
      landing_url: landing_url || "/products",
      package_days: package_days || 7,
      status: initialStatus,
      is_active: initialStatus === "APPROVED",
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("local_ads")
          .insert(payload)
          .select("*")
          .single();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            ad: data as LocalAd,
            source: "supabase",
          });
        }
      }
    } catch (err) {
      console.warn("Direct Supabase insert failed for local_ads:", err);
    }

    // 목업 메모리 스토어 등록
    const ad = createLocalAd(payload);
    return NextResponse.json({
      success: true,
      ad,
      source: "mock",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "광고 신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/local-ads
 * 최고관리자 승인/반려 제어 및 파트너 온/오프 일시중지 토글
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, reject_reason, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "광고 ID가 누락되었습니다." }, { status: 400 });
    }

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (status !== undefined) updatePayload.status = status;
        if (reject_reason !== undefined) updatePayload.reject_reason = reject_reason;
        if (is_active !== undefined) updatePayload.is_active = is_active;
        if (status === "APPROVED") updatePayload.is_active = true;
        if (status === "REJECTED") updatePayload.is_active = false;

        const { data, error } = await supabase
          .from("local_ads")
          .update(updatePayload)
          .eq("id", id)
          .select("*")
          .single();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            ad: data as LocalAd,
            source: "supabase",
          });
        }
      }
    } catch (err) {
      console.warn("Supabase update failed for local_ads:", err);
    }

    let updatedAd: LocalAd | null = null;
    if (status !== undefined) {
      updatedAd = updateLocalAdStatus(id, status, reject_reason);
    } else if (is_active !== undefined) {
      updatedAd = toggleLocalAdActive(id, is_active);
    }

    if (!updatedAd) {
      return NextResponse.json({ error: "해당 광고를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ad: updatedAd,
      source: "mock",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "광고 상태 업데이트 실패" },
      { status: 500 }
    );
  }
}
