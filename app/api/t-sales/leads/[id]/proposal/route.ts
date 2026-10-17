import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTsalesLeadById } from "@/lib/db/store";
import { LEGAL_OPERATOR_NAME, PRIVACY_OFFICER_NAME, PRIVACY_OFFICER_CONTACT } from "@/lib/legal/legalInfo";
import type { TsalesLead } from "@/types/tsales";

const FONT_REGULAR = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.woff");
const FONT_BOLD = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.woff");

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

/**
 * [📄 영업 제안서 PDF 다운로드] — pdfkit으로 서버에서 직접 생성 (한글 폰트 임베드).
 * t.다이어리 견적서 PDF(app/api/t-diary/quotes/[id]/pdf)와 동일한 방식을 재사용한다.
 * GET /api/t-sales/leads/[id]/proposal
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  let lead: TsalesLead | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("tsales_leads").select("*").eq("id", id).maybeSingle();
      if (!error && data) lead = data as TsalesLead;
    }
  } catch (err) {
    console.warn("Supabase tsales_leads fetch (proposal) fallback to mock store:", err);
  }
  if (!lead) lead = getTsalesLeadById(id);

  if (!lead) {
    return NextResponse.json({ error: "리드를 찾을 수 없습니다." }, { status: 404 });
  }

  const items =
    lead.proposal_items && lead.proposal_items.length > 0
      ? lead.proposal_items
      : [
          {
            name: "제안 상품/서비스",
            qty: 1,
            unitPriceKrw: lead.estimated_deal_value_krw || 0,
          },
        ];
  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.unitPriceKrw, 0);

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("kr", FONT_REGULAR);
      doc.registerFont("kr-bold", FONT_BOLD);

      doc.font("kr-bold").fontSize(22).text("제 안 서", { align: "center" });
      doc.moveDown(0.3);
      doc
        .font("kr")
        .fontSize(9)
        .fillColor("#64748B")
        .text(`발행일: ${new Date().toISOString().slice(0, 10)}  ·  리드번호: ${lead.id}`, { align: "center" });
      doc.moveDown(1.2);

      const colY = doc.y;
      doc.font("kr-bold").fontSize(11).fillColor("#0F172A").text("제안자", 50, colY);
      doc.font("kr").fontSize(9).fillColor("#334155");
      doc.text(`상호: ${LEGAL_OPERATOR_NAME}`, 50, colY + 18);
      doc.text(`담당자: ${PRIVACY_OFFICER_NAME} (${PRIVACY_OFFICER_CONTACT})`, 50, colY + 34);

      doc.font("kr-bold").fontSize(11).fillColor("#0F172A").text("제안받는 곳", 320, colY);
      doc.font("kr").fontSize(9).fillColor("#334155");
      doc.text(`상호: ${lead.business_name}`, 320, colY + 18);
      doc.text(
        `담당자: ${lead.contact_name || "-"} (${lead.contact_phone || "-"})`,
        320,
        colY + 34
      );

      doc.y = colY + 60;
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#E2E8F0").stroke();
      doc.moveDown(1);

      const tableTop = doc.y;
      const colX = { name: 50, qty: 330, unit: 390, amount: 470 };
      doc.font("kr-bold").fontSize(9).fillColor("#0F172A");
      doc.text("제안 항목", colX.name, tableTop);
      doc.text("수량", colX.qty, tableTop, { width: 50, align: "right" });
      doc.text("단가", colX.unit, tableTop, { width: 70, align: "right" });
      doc.text("금액", colX.amount, tableTop, { width: 75, align: "right" });
      doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor("#CBD5E1").stroke();

      let rowY = tableTop + 24;
      doc.font("kr").fontSize(9).fillColor("#334155");
      for (const item of items) {
        const amount = item.qty * item.unitPriceKrw;
        doc.text(item.name, colX.name, rowY, { width: 270 });
        doc.text(`${item.qty.toLocaleString("ko-KR")}`, colX.qty, rowY, { width: 50, align: "right" });
        doc.text(formatWon(item.unitPriceKrw), colX.unit, rowY, { width: 70, align: "right" });
        doc.text(formatWon(amount), colX.amount, rowY, { width: 75, align: "right" });
        rowY += 20;
      }

      doc.moveTo(50, rowY + 4).lineTo(545, rowY + 4).strokeColor("#E2E8F0").stroke();
      rowY += 16;

      doc.font("kr-bold").fontSize(11).fillColor("#0F172A");
      doc.text("제안 합계금액", 390, rowY, { width: 70, align: "right" });
      doc.text(formatWon(totalAmount), colX.amount, rowY, { width: 75, align: "right" });
      rowY += 30;

      if (lead.memo) {
        doc.font("kr-bold").fontSize(9).fillColor("#0F172A").text("비고", 50, rowY);
        doc.font("kr").fontSize(9).fillColor("#334155").text(lead.memo, 50, rowY + 14, { width: 495 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="proposal-${lead.id}.pdf"`,
    },
  });
}
