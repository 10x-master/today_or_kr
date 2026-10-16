import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "node:path";
import { getQuoteRequestById } from "@/lib/db/store";
import { LEGAL_OPERATOR_NAME, PRIVACY_OFFICER_NAME, PRIVACY_OFFICER_CONTACT } from "@/lib/legal/legalInfo";

const FONT_REGULAR = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.woff");
const FONT_BOLD = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.woff");

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

/**
 * [📄 견적서 PDF 다운로드] — pdfkit으로 서버에서 직접 생성 (한글 폰트 임베드)
 * GET /api/t-diary/quotes/[id]/pdf
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const quote = getQuoteRequestById(id);

  if (!quote) {
    return NextResponse.json({ error: "견적 요청을 찾을 수 없습니다." }, { status: 404 });
  }

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("kr", FONT_REGULAR);
      doc.registerFont("kr-bold", FONT_BOLD);

      // 제목
      doc.font("kr-bold").fontSize(22).text("견 적 서", { align: "center" });
      doc.moveDown(0.3);
      doc.font("kr").fontSize(9).fillColor("#64748B").text(`발행일: ${quote.created_at.slice(0, 10)}  ·  견적번호: ${quote.id}`, {
        align: "center",
      });
      doc.moveDown(1.2);

      // 공급자 / 공급받는자
      const colY = doc.y;
      doc.font("kr-bold").fontSize(11).fillColor("#0F172A").text("공급자", 50, colY);
      doc.font("kr").fontSize(9).fillColor("#334155");
      doc.text(`상호: ${LEGAL_OPERATOR_NAME}`, 50, colY + 18);
      doc.text(`담당자: ${PRIVACY_OFFICER_NAME} (${PRIVACY_OFFICER_CONTACT})`, 50, colY + 34);

      doc.font("kr-bold").fontSize(11).fillColor("#0F172A").text("공급받는자", 320, colY);
      doc.font("kr").fontSize(9).fillColor("#334155");
      doc.text(`상호: ${quote.company_name}`, 320, colY + 18);
      doc.text(`담당자: ${quote.contact_name} (${quote.contact_phone})`, 320, colY + 34);

      doc.y = colY + 60;
      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor("#E2E8F0")
        .stroke();
      doc.moveDown(1);

      // 상품 테이블 헤더
      const tableTop = doc.y;
      const colX = { code: 50, name: 130, qty: 330, unit: 390, amount: 470 };
      doc.font("kr-bold").fontSize(9).fillColor("#0F172A");
      doc.text("코드", colX.code, tableTop);
      doc.text("상품명", colX.name, tableTop);
      doc.text("수량", colX.qty, tableTop, { width: 50, align: "right" });
      doc.text("단가", colX.unit, tableTop, { width: 70, align: "right" });
      doc.text("금액", colX.amount, tableTop, { width: 75, align: "right" });
      doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor("#CBD5E1").stroke();

      let rowY = tableTop + 24;
      doc.font("kr").fontSize(9).fillColor("#334155");
      for (const item of quote.items) {
        const amount = item.quantity * item.unit_price;
        doc.text(item.product_code, colX.code, rowY, { width: 70 });
        doc.text(item.product_name, colX.name, rowY, { width: 190 });
        doc.text(`${item.quantity.toLocaleString("ko-KR")}부`, colX.qty, rowY, { width: 50, align: "right" });
        doc.text(formatWon(item.unit_price), colX.unit, rowY, { width: 70, align: "right" });
        doc.text(formatWon(amount), colX.amount, rowY, { width: 75, align: "right" });
        rowY += 20;
      }

      doc.moveTo(50, rowY + 4).lineTo(545, rowY + 4).strokeColor("#E2E8F0").stroke();
      rowY += 16;

      const summaryRows: Array<[string, number]> = [
        ["상품 합계", quote.subtotal],
        ["포장비", quote.packaging_fee],
        ["배송비", quote.shipping_fee],
      ];
      doc.font("kr").fontSize(9).fillColor("#64748B");
      for (const [label, value] of summaryRows) {
        doc.text(label, 390, rowY, { width: 70, align: "right" });
        doc.text(formatWon(value), colX.amount, rowY, { width: 75, align: "right" });
        rowY += 16;
      }

      doc.font("kr-bold").fontSize(11).fillColor("#0F172A");
      doc.text("최종 공급가", 390, rowY, { width: 70, align: "right" });
      doc.text(formatWon(quote.final_amount), colX.amount, rowY, { width: 75, align: "right" });
      rowY += 30;

      if (quote.print_options) {
        doc.font("kr-bold").fontSize(9).fillColor("#0F172A").text("인쇄 옵션", 50, rowY);
        doc.font("kr").fontSize(9).fillColor("#334155").text(quote.print_options, 50, rowY + 14, { width: 495 });
        rowY += 40;
      }
      if (quote.admin_memo) {
        doc.font("kr-bold").fontSize(9).fillColor("#0F172A").text("비고", 50, rowY);
        doc.font("kr").fontSize(9).fillColor("#334155").text(quote.admin_memo, 50, rowY + 14, { width: 495 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quote-${quote.id}.pdf"`,
    },
  });
}
