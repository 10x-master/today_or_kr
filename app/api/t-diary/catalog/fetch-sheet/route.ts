import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { toGoogleSheetCsvUrl } from "@/lib/diary/catalogExcel";

/**
 * 공개 구글 스프레드시트 URL을 CSV로 변환해 파싱 (대량 등록 미리보기용)
 * GET /api/t-diary/catalog/fetch-sheet?url=https://docs.google.com/spreadsheets/d/...
 * 보안: docs.google.com/spreadsheets 패턴이 아닌 URL은 전부 거부 (SSRF 방지)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url은 필수입니다." }, { status: 400 });
  }

  const csvUrl = toGoogleSheetCsvUrl(url);
  if (!csvUrl) {
    return NextResponse.json(
      { error: "공개 구글 스프레드시트 URL만 지원합니다. (docs.google.com/spreadsheets/d/... 형식)" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(csvUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "스프레드시트를 불러올 수 없습니다. 공유 설정이 '링크가 있는 모든 사용자 보기'인지 확인해주세요." },
        { status: 400 }
      );
    }
    const csvText = await res.text();
    const wb = XLSX.read(csvText, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("Google Sheet fetch/parse error:", err);
    return NextResponse.json({ error: "스프레드시트 파싱에 실패했습니다." }, { status: 500 });
  }
}
