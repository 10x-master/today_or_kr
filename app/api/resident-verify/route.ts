import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createResidentVerification, createLocalEventApplication } from "@/lib/db/store";
import type { ResidentVerification, LocalEventApplication } from "@/types/officialNotice";

/**
 * 입주민 인증 신청 및 이벤트 접수 API
 * POST /api/resident-verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      applicant_name,
      phone_number,
      verification_method = "APT_I_APP",
      proof_image_url = null,
      complex_name,
      dong_ho = null,
      privacy_agreed = true,
    } = body;

    if (!applicant_name || !phone_number || !complex_name) {
      return NextResponse.json(
        { error: "이름, 전화번호, 단지명은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    // 1. Supabase 등록 시도
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        // A. resident_verifications 테이블 등록
        const { data: verifData, error: verifError } = await supabase
          .from("resident_verifications")
          .insert({
            event_id: event_id || null,
            applicant_name,
            phone_number,
            verification_method,
            proof_image_url,
            complex_name,
            dong_ho,
            status: "PENDING",
            privacy_agreed,
          })
          .select()
          .single();

        let applicationId = null;
        if (event_id) {
          // B. local_event_applications 등록
          const { data: appData } = await supabase
            .from("local_event_applications")
            .insert({
              event_id,
              verification_id: verifData?.id || null,
              applicant_name,
              phone_number,
              complex_name,
              status: "PENDING",
            })
            .select()
            .single();
          applicationId = appData?.id;
        }

        if (!verifError && verifData) {
          return NextResponse.json({
            success: true,
            verification: verifData as ResidentVerification,
            applicationId,
            source: "supabase",
            message: "입주민 인증 신청이 완료되었습니다! 확인 후 혜택이 발급됩니다.",
          });
        }
      }
    } catch (err) {
      console.warn("Supabase resident verification fallback to mock:", err);
    }

    // 2. Mock store fallback
    const verification = createResidentVerification({
      event_id: event_id || null,
      applicant_name,
      phone_number,
      verification_method,
      proof_image_url,
      complex_name,
      dong_ho,
      status: "PENDING",
      privacy_agreed,
    });

    let mockApp = null;
    if (event_id) {
      mockApp = createLocalEventApplication({
        event_id,
        verification_id: verification.id,
        applicant_name,
        phone_number,
        complex_name,
        status: "PENDING",
      });
    }

    return NextResponse.json({
      success: true,
      verification,
      applicationId: mockApp?.id,
      source: "mock",
      message: "입주민 인증 신청이 완료되었습니다! 확인 후 혜택이 발급됩니다.",
    });
  } catch (err) {
    console.error("Failed to process resident verification:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
