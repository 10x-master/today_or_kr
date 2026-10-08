import { NextRequest, NextResponse } from "next/server";
import {
  applyDonation,
  findLinkPickProductById,
  getDonationCampaigns,
} from "@/lib/db/store";
import type { DonationCampaign } from "@/types/commerce";

function withAchievementRate(campaign: DonationCampaign) {
  return {
    ...campaign,
    achievementRate:
      campaign.targetAmount > 0
        ? Math.min(1, campaign.currentAmount / campaign.targetAmount)
        : 0,
  };
}

/** 관내 진행 중인 착한소비 펀딩 캠페인 목록 및 달성률 조회 (GET /api/commerce/funding) */
export async function GET() {
  const campaigns = getDonationCampaigns().map(withAchievementRate);
  return NextResponse.json({ campaigns });
}

interface FundingOrderBody {
  campaignId?: unknown;
  productId?: unknown;
  quantity?: unknown;
}

/** 가상 구매/적립 트리거 (POST /api/commerce/funding) */
export async function POST(request: NextRequest) {
  let body: FundingOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { campaignId, productId } = body;
  const quantity =
    typeof body.quantity === "number" && body.quantity > 0 ? body.quantity : 1;

  if (typeof campaignId !== "string" || campaignId.trim().length === 0) {
    return NextResponse.json({ error: "campaignId는 필수입니다." }, { status: 400 });
  }
  if (typeof productId !== "string" || productId.trim().length === 0) {
    return NextResponse.json({ error: "productId는 필수입니다." }, { status: 400 });
  }

  const product = findLinkPickProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!product.donationPerSale) {
    return NextResponse.json(
      { error: "착한소비 적립 대상 상품이 아닙니다." },
      { status: 400 }
    );
  }

  const donationAmount = product.donationPerSale * quantity;
  const result = applyDonation(campaignId, donationAmount);
  if (!result) {
    return NextResponse.json(
      { error: "펀딩 캠페인을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { ...result, campaign: withAchievementRate(result.campaign) },
    { status: 201 }
  );
}
