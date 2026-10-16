import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "node:path";
import { getCategoryPathNames, getDiaryBrandBySlug, getDiaryProducts } from "@/lib/db/store";
import type { DealerCatalogBranding, DealerCatalogSelectionMode, DiaryProduct } from "@/types/quote";

const FONT_REGULAR = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.woff");
const FONT_BOLD = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.woff");

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

async function fetchImageBuffer(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * 딜러 맞춤형 카탈로그 PDF 생성 — 표지/매 페이지 하단에 딜러 로고·연락처가 박힌 제안서
 * POST /api/t-diary/catalog/dealer-pdf { brand, mode, product_ids?, category_id?, branding }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { brand: brandSlug, mode, product_ids, category_id, branding } = body as {
    brand: string;
    mode: DealerCatalogSelectionMode;
    product_ids?: string[];
    category_id?: string;
    branding: DealerCatalogBranding;
  };

  if (!brandSlug || !mode || !branding?.dealer_name) {
    return NextResponse.json({ error: "brand, mode, branding.dealer_name은 필수입니다." }, { status: 400 });
  }

  const brand = getDiaryBrandBySlug(brandSlug);
  if (!brand) {
    return NextResponse.json({ error: "존재하지 않는 브랜드입니다." }, { status: 404 });
  }

  const allProducts = getDiaryProducts(brand.id);
  let products: DiaryProduct[] = [];
  if (mode === "SELECTED") {
    const idSet = new Set(product_ids || []);
    products = allProducts.filter((p) => idSet.has(p.id));
  } else if (mode === "CATEGORY") {
    products = allProducts.filter((p) => p.category_id === category_id);
  } else {
    products = allProducts;
  }

  if (products.length === 0) {
    return NextResponse.json({ error: "선택된 상품이 없습니다." }, { status: 400 });
  }

  const logoBuffer = await fetchImageBuffer(branding.dealer_logo_url);
  const showPrice = branding.price_display === "show";

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("kr", FONT_REGULAR);
      doc.registerFont("kr-bold", FONT_BOLD);

      // ===== 표지 =====
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0F172A");
      let coverY = 90;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, (doc.page.width - 90) / 2, coverY, { fit: [90, 90] });
          coverY += 110;
        } catch {
          // 이미지 디코딩 실패 시 로고 없이 진행
        }
      }
      doc.font("kr-bold").fontSize(26).fillColor("#FFFFFF").text(branding.dealer_name, 50, coverY, {
        width: doc.page.width - 100,
        align: "center",
      });
      doc.moveDown(0.5);
      if (branding.cover_headline) {
        doc.font("kr").fontSize(13).fillColor("#CBD5E1").text(branding.cover_headline, 50, doc.y, {
          width: doc.page.width - 100,
          align: "center",
        });
      }

      const contactY = doc.page.height - 140;
      doc.font("kr").fontSize(9).fillColor("#94A3B8");
      const contactLines = [
        branding.contact_name && `담당자 ${branding.contact_name}`,
        branding.contact_phone,
        branding.contact_email,
        branding.address,
      ].filter(Boolean);
      doc.text(contactLines.join("  ·  "), 50, contactY, { width: doc.page.width - 100, align: "center" });

      // ===== 상품 페이지 =====
      doc.addPage();
      doc.font("kr-bold").fontSize(16).fillColor("#0F172A").text("제품 카탈로그", 50, 50);
      doc.moveDown(0.5);

      const grouped = new Map<string, DiaryProduct[]>();
      for (const p of products) {
        const path2 = getCategoryPathNames(p.category_id);
        const key = path2.l3 || "기타";
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(p);
      }

      let y = doc.y + 10;
      for (const [categoryName, items] of grouped) {
        if (y > doc.page.height - 150) {
          doc.addPage();
          y = 50;
        }
        doc.font("kr-bold").fontSize(12).fillColor("#2563EB").text(categoryName, 50, y);
        y += 20;

        const colX = showPrice ? { code: 50, name: 130, spec: 310, price: 460 } : { code: 50, name: 130, spec: 310, price: 0 };
        doc.font("kr-bold").fontSize(8).fillColor("#64748B");
        doc.text("코드", colX.code, y);
        doc.text("품목명", colX.name, y);
        doc.text("규격/스펙", colX.spec, y, { width: showPrice ? 140 : 190 });
        if (showPrice) doc.text("권장소비자가", colX.price, y, { width: 85, align: "right" });
        y += 14;
        doc.moveTo(50, y).lineTo(545, y).strokeColor("#E2E8F0").stroke();
        y += 8;

        doc.font("kr").fontSize(9).fillColor("#334155");
        for (const item of items) {
          if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
          }
          doc.text(item.product_code, colX.code, y, { width: 70 });
          doc.text(item.name, colX.name, y, { width: 170 });
          doc.fontSize(8).fillColor("#64748B").text(item.spec || "", colX.spec, y, { width: showPrice ? 140 : 190 });
          doc.fontSize(9).fillColor("#334155");
          if (showPrice) doc.text(formatWon(item.sell_price), colX.price, y, { width: 85, align: "right" });
          y += 24;
        }
        y += 10;
      }

      if (!showPrice) {
        doc.moveDown(1);
        doc
          .font("kr")
          .fontSize(9)
          .fillColor("#94A3B8")
          .text("가격은 견적 요청 시 별도 안내드립니다.", 50, y, { width: 495 });
        y += 20;
      }

      if (branding.footer_note) {
        if (y > doc.page.height - 120) {
          doc.addPage();
          y = 50;
        }
        doc.moveDown(1);
        doc.font("kr-bold").fontSize(10).fillColor("#0F172A").text("안내사항", 50, y);
        doc.font("kr").fontSize(9).fillColor("#334155").text(branding.footer_note, 50, y + 16, { width: 495 });
      }

      // ===== 매 페이지 하단 딜러 연락처 푸터 =====
      const pageRange = doc.bufferedPageRange();
      const footerText = [branding.dealer_name, branding.contact_phone, branding.contact_email].filter(Boolean).join("  ·  ");
      for (let i = 1; i < pageRange.count; i++) {
        doc.switchToPage(i);
        doc
          .font("kr")
          .fontSize(7.5)
          .fillColor("#94A3B8")
          .text(footerText, 50, doc.page.height - 36, { width: doc.page.width - 100, align: "center" });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dealer-catalog-${brandSlug}.pdf"`,
    },
  });
}
