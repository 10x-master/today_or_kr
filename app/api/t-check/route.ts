import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTcheckLog, getTcheckLogs } from "@/lib/db/store";
import { diagnoseCardFee } from "@/lib/tcheck/feeDiagnosis";
import type { TcheckAddonService, TcheckLog } from "@/types/tcheck";

const MAX_ANNUAL_SALES_KRW = 1_000_000_000_000; // 1조원 — 입력값 폭주/오입력 방지용 상한
const MAX_FEE_RATE_PERCENT = 10;

function isAddonArray(value: unknown): value is TcheckAddonService[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).name === "string" &&
        typeof (item as Record<string, unknown>).monthlyFeeKrw === "number" &&
        typeof (item as Record<string, unknown>).inUse === "boolean"
    )
  );
}

/**
 * t.체크(tcheck_logs, check_type='CARD_FEE_DIAGNOSIS') — 소상공인 카드 매출 수수료 진단
 * GET  /api/t-check?user_id=user-001  (과거 진단 기록 조회)
 * POST /api/t-check  (사업자등록번호 + 카드 매출 데이터로 진단 실행 및 결과 적재)
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id") || undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let query = supabase
        .from("tcheck_logs")
        .select("*")
        .eq("check_type", "CARD_FEE_DIAGNOSIS")
        .order("checked_at", { ascending: false });
      if (userId) query = query.eq("created_by_user_id", userId);
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ logs: data as TcheckLog[], source: "supabase" });
      }
    }
  } catch (err) {
    console.warn("Supabase tcheck_logs query fallback to mock store:", err);
  }

  const logs = getTcheckLogs({ userId });
  return NextResponse.json({ logs, source: "mock" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      created_by_user_id = "user-001",
      tenant_id = null,
      workforce_id = null,
      business_reg_number,
      store_name = null,
      annual_card_sales_krw,
      current_fee_rate_percent,
      addons = [],
    } = body;

    if (typeof business_reg_number !== "string" || !business_reg_number.trim()) {
      return NextResponse.json({ error: "business_reg_number는 필수입니다." }, { status: 400 });
    }
    if (
      typeof annual_card_sales_krw !== "number" ||
      !Number.isFinite(annual_card_sales_krw) ||
      annual_card_sales_krw <= 0 ||
      annual_card_sales_krw > MAX_ANNUAL_SALES_KRW
    ) {
      return NextResponse.json(
        { error: `annual_card_sales_krw는 0보다 크고 ${MAX_ANNUAL_SALES_KRW} 이하의 숫자여야 합니다.` },
        { status: 400 }
      );
    }
    if (
      typeof current_fee_rate_percent !== "number" ||
      !Number.isFinite(current_fee_rate_percent) ||
      current_fee_rate_percent <= 0 ||
      current_fee_rate_percent > MAX_FEE_RATE_PERCENT
    ) {
      return NextResponse.json(
        { error: `current_fee_rate_percent는 0보다 크고 ${MAX_FEE_RATE_PERCENT} 이하의 숫자여야 합니다.` },
        { status: 400 }
      );
    }
    if (!isAddonArray(addons)) {
      return NextResponse.json(
        { error: "addons는 { name, monthlyFeeKrw, inUse } 형태의 배열이어야 합니다." },
        { status: 400 }
      );
    }

    const diagnosis = diagnoseCardFee({
      businessRegNumber: business_reg_number,
      storeName: store_name ?? undefined,
      annualCardSalesKrw: annual_card_sales_krw,
      currentFeeRatePercent: current_fee_rate_percent,
      addons,
    });

    const payload = {
      tenant_id,
      workforce_id,
      created_by_user_id,
      user_id: created_by_user_id,
      check_type: "CARD_FEE_DIAGNOSIS" as const,
      verification_method: "MANUAL",
      checked_at: new Date().toISOString(),
      notes: null,
      business_reg_number,
      store_name,
      annual_card_sales_krw,
      current_fee_rate_percent,
      legal_fee_rate_percent: diagnosis.legalFeeRatePercent,
      overcharged_amount_krw: diagnosis.overchargedAmountKrw,
      unnecessary_addons: diagnosis.unnecessaryAddons,
      addon_annual_savings_krw: diagnosis.addonAnnualSavingsKrw,
      estimated_refund_krw: diagnosis.estimatedRefundKrw,
    };

    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.from("tcheck_logs").insert(payload).select().single();
        if (!error && data) {
          return NextResponse.json({
            success: true,
            log: data as TcheckLog,
            diagnosis,
            source: "supabase",
          });
        }
      }
    } catch (err) {
      console.warn("Supabase tcheck_logs insert fallback to mock store:", err);
    }

    const log = createTcheckLog(payload);
    return NextResponse.json({ success: true, log, diagnosis, source: "mock" });
  } catch (err) {
    console.error("Failed to run tcheck fee diagnosis:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
