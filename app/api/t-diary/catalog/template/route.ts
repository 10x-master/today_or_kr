import { NextResponse } from "next/server";
import { buildCatalogTemplateXlsx } from "@/lib/diary/catalogExcel";

/**
 * 표준 엑셀 등록 템플릿 다운로드
 * GET /api/t-diary/catalog/template
 */
export async function GET() {
  const buffer = buildCatalogTemplateXlsx();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="catalog_template.xlsx"',
    },
  });
}
