import { NextRequest, NextResponse } from "next/server";
import { createLinkPickProduct, getLinkPickProducts } from "@/lib/db/store";
import type { PriceDisplayMode, ProductType } from "@/types/commerce";

const VALID_PRODUCT_TYPES: ProductType[] = [
  "coupang_affiliate",
  "local_specialty",
  "welfare_device",
];

const VALID_PRICE_DISPLAY_MODES: PriceDisplayMode[] = [
  "show_price",
  "lowest_price_btn",
  "special_deal_btn",
];

function isValidProductType(value: unknown): value is ProductType {
  return (
    typeof value === "string" &&
    VALID_PRODUCT_TYPES.includes(value as ProductType)
  );
}

function isValidPriceDisplayMode(value: unknown): value is PriceDisplayMode {
  return (
    typeof value === "string" &&
    VALID_PRICE_DISPLAY_MODES.includes(value as PriceDisplayMode)
  );
}

/** 링크픽형 상품 목록 조회 (GET /api/commerce/products?type=&sellerId=) */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const sellerId = searchParams.get("sellerId");

  const products = getLinkPickProducts({
    productType: isValidProductType(type) ? type : undefined,
    sellerId: sellerId ?? undefined,
  });

  return NextResponse.json({ products });
}

interface CreateProductBody {
  sellerId?: unknown;
  productType?: unknown;
  title?: unknown;
  price?: unknown;
  priceDisplayMode?: unknown;
  originalUrl?: unknown;
  affiliateUrl?: unknown;
  thumbnail?: unknown;
  donationPerSale?: unknown;
}

/** 내 링크에 상품 담기 (POST /api/commerce/products) */
export async function POST(request: NextRequest) {
  let body: CreateProductBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const {
    sellerId,
    productType,
    title,
    price,
    priceDisplayMode,
    originalUrl,
    affiliateUrl,
    thumbnail,
    donationPerSale,
  } = body;

  if (typeof sellerId !== "string" || sellerId.trim().length === 0) {
    return NextResponse.json({ error: "sellerId는 필수입니다." }, { status: 400 });
  }
  if (!isValidProductType(productType)) {
    return NextResponse.json(
      { error: "유효하지 않은 productType입니다." },
      { status: 400 }
    );
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title은 필수입니다." }, { status: 400 });
  }
  if (price !== undefined && typeof price !== "number") {
    return NextResponse.json({ error: "price는 숫자여야 합니다." }, { status: 400 });
  }
  if (!isValidPriceDisplayMode(priceDisplayMode)) {
    return NextResponse.json(
      { error: "유효하지 않은 priceDisplayMode입니다." },
      { status: 400 }
    );
  }
  if (typeof originalUrl !== "string" || originalUrl.trim().length === 0) {
    return NextResponse.json({ error: "originalUrl은 필수입니다." }, { status: 400 });
  }
  if (typeof affiliateUrl !== "string" || affiliateUrl.trim().length === 0) {
    return NextResponse.json({ error: "affiliateUrl은 필수입니다." }, { status: 400 });
  }
  if (typeof thumbnail !== "string" || thumbnail.trim().length === 0) {
    return NextResponse.json({ error: "thumbnail은 필수입니다." }, { status: 400 });
  }
  if (donationPerSale !== undefined && typeof donationPerSale !== "number") {
    return NextResponse.json(
      { error: "donationPerSale은 숫자여야 합니다." },
      { status: 400 }
    );
  }

  const product = createLinkPickProduct({
    sellerId,
    productType,
    title,
    price,
    priceDisplayMode,
    originalUrl,
    affiliateUrl,
    thumbnail,
    donationPerSale,
  });

  return NextResponse.json({ product }, { status: 201 });
}
