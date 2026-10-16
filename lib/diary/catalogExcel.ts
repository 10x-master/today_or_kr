import * as XLSX from "xlsx";

/** 엑셀/CSV/구글시트 대량 등록 템플릿의 고정 헤더 순서 */
export const CATALOG_EXCEL_HEADERS = [
  "품목코드",
  "품목명",
  "대분류",
  "중분류",
  "소분류",
  "규격",
  "권장소비자가",
  "공급원가",
  "구글드라이브이미지URL",
  "스펙설명",
] as const;

export interface CatalogExcelRow {
  product_code: string;
  name: string;
  l1_name: string;
  l2_name: string;
  l3_name: string;
  cover_size: string;
  sell_price: number;
  cost_price: number;
  image_url: string;
  spec: string;
}

const HEADER_KEY_MAP: Record<string, keyof CatalogExcelRow> = {
  "품목코드": "product_code",
  "품목명": "name",
  "대분류": "l1_name",
  "중분류": "l2_name",
  "소분류": "l3_name",
  "규격": "cover_size",
  "권장소비자가": "sell_price",
  "공급원가": "cost_price",
  "구글드라이브이미지URL": "image_url",
  "스펙설명": "spec",
};

/** 헤더 행을 가진 2차원 배열(sheet_to_json header:1 결과 등)을 CatalogExcelRow[]로 정규화 */
export function parseCatalogSheetRows(rawRows: Record<string, unknown>[]): CatalogExcelRow[] {
  const rows: CatalogExcelRow[] = [];
  for (const raw of rawRows) {
    const mapped: Partial<CatalogExcelRow> = {};
    for (const [header, value] of Object.entries(raw)) {
      const key = HEADER_KEY_MAP[header.trim()];
      if (!key) continue;
      if (key === "sell_price" || key === "cost_price") {
        mapped[key] = Number(String(value).replace(/[,원\s]/g, "")) || 0;
      } else {
        mapped[key] = String(value ?? "").trim();
      }
    }
    if (!mapped.product_code || !mapped.name) continue;
    rows.push({
      product_code: mapped.product_code,
      name: mapped.name,
      l1_name: mapped.l1_name || "인쇄물",
      l2_name: mapped.l2_name || "다이어리",
      l3_name: mapped.l3_name || "기타",
      cover_size: mapped.cover_size || "커버 124×180mm / 123×185mm",
      sell_price: mapped.sell_price || 0,
      cost_price: mapped.cost_price || 0,
      image_url: mapped.image_url || "",
      spec: mapped.spec || "",
    });
  }
  return rows;
}

/** 표준 등록 템플릿 XLSX 버퍼 생성 (헤더 + 예시 1행) */
export function buildCatalogTemplateXlsx(): Buffer {
  const exampleRow = {
    "품목코드": "MO-99",
    "품목명": "32절 양장 다이어리 — 예시 컬러명",
    "대분류": "인쇄물",
    "중분류": "다이어리",
    "소분류": "양장 32절",
    "규격": "커버 124×180mm / 123×185mm",
    "권장소비자가": 12000,
    "공급원가": 6000,
    "구글드라이브이미지URL": "https://drive.google.com/file/d/FILE_ID/view",
    "스펙설명": "PU가죽 표지 · 금박 각인 가능",
  };
  const ws = XLSX.utils.json_to_sheet([exampleRow], { header: [...CATALOG_EXCEL_HEADERS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "등록양식");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

interface ExportableProduct {
  product_code: string;
  name: string;
  l1_name: string;
  l2_name: string;
  l3_name: string;
  cover_size: string;
  sell_price: number;
  cost_price: number;
  image_url: string | null;
  spec: string | null;
}

/** 전체 카탈로그 상품을 표준 템플릿과 동일한 열 구성의 XLSX 버퍼로 변환 */
export function buildCatalogExportXlsx(products: ExportableProduct[]): Buffer {
  const rows = products.map((p) => ({
    "품목코드": p.product_code,
    "품목명": p.name,
    "대분류": p.l1_name,
    "중분류": p.l2_name,
    "소분류": p.l3_name,
    "규격": p.cover_size,
    "권장소비자가": p.sell_price,
    "공급원가": p.cost_price,
    "구글드라이브이미지URL": p.image_url || "",
    "스펙설명": p.spec || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...CATALOG_EXCEL_HEADERS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "카탈로그");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/** 구글 스프레드시트 공유 URL -> CSV export URL 변환 */
export function toGoogleSheetCsvUrl(url: string): string | null {
  const match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}
