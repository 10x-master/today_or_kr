"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Trash2,
  X,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { SourcingItem } from "@/components/portal/MemberSourcingSection";

export interface CatalogRowItem {
  id: string;
  selected: boolean;
  name: string;
  category: string;
  spec: string;
  retailPrice: string;
  supplyPrice: string;
  commissionRate: string;
  contactOrUrl: string;
  quantity: number;
}

interface CatalogAutoParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (newItems: SourcingItem[]) => void;
  defaultManufacturer?: string;
}

export default function CatalogAutoParserModal({
  isOpen,
  onClose,
  onImportItems,
  defaultManufacturer = "투데이 제휴 회원사",
}: CatalogAutoParserModalProps) {
  const [manufacturer, setManufacturer] = useState(defaultManufacturer);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatusText, setParseStatusText] = useState("");
  const [parsedRows, setParsedRows] = useState<CatalogRowItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessDone, setIsSuccessDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 헤더 컬럼 자동 매핑 헬퍼
  const matchHeaderIndex = (headers: string[], keywords: string[]) => {
    return headers.findIndex((h) =>
      keywords.some((k) => String(h || "").trim().toLowerCase().includes(k))
    );
  };

  // 1. 엑셀/CSV 파일 클라이언트 파싱 엔진 (SheetJS)
  const parseExcelOrCsv = async (fileObj: File) => {
    setIsParsing(true);
    setParseStatusText("📊 엑셀/CSV 시트 헤더 및 셀 데이터를 파싱하는 중...");
    setErrorMessage(null);

    try {
      const data = await fileObj.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length < 2) {
        throw new Error("엑셀 시트에 데이터가 없거나 2행 이상 필요합니다.");
      }

      // 1행: 헤더
      const headers = rawRows[0].map((h) => String(h || ""));

      // 컬럼 매핑 인덱스 탐색
      const nameIdx = matchHeaderIndex(headers, ["상품명", "제품명", "품명", "title", "name", "item"]);
      const catIdx = matchHeaderIndex(headers, ["카테고리", "분류", "종류", "category"]);
      const specIdx = matchHeaderIndex(headers, ["규격", "스펙", "용량", "모델", "spec", "size"]);
      const retailIdx = matchHeaderIndex(headers, ["소비자가", "정가", "권장", "retail", "price"]);
      const supplyIdx = matchHeaderIndex(headers, ["공급가", "단가", "회원가", "특판가", "도매가", "supply", "cost"]);
      const commIdx = matchHeaderIndex(headers, ["수수료", "리워드", "마진", "commission", "rate"]);
      const urlIdx = matchHeaderIndex(headers, ["url", "링크", "연락처", "전화", "문의", "contact", "link"]);
      const qtyIdx = matchHeaderIndex(headers, ["수량", "재고", "qty", "count"]);

      const rows: CatalogRowItem[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const nameVal = nameIdx !== -1 ? String(row[nameIdx] || "").trim() : String(row[0] || "").trim();
        if (!nameVal) continue; // 상품명 없는 빈 줄 스킵

        const catVal = catIdx !== -1 ? String(row[catIdx] || "").trim() : "회원사 특판";
        const specVal = specIdx !== -1 ? String(row[specIdx] || "").trim() : "단지 공급 규격";
        const retailVal = retailIdx !== -1 ? formatPrice(row[retailIdx]) : "시중가";
        const supplyVal = supplyIdx !== -1 ? formatPrice(row[supplyIdx]) : "단지 특판가";
        const commVal = commIdx !== -1 ? formatPercent(row[commIdx]) : "15%";
        const urlVal = urlIdx !== -1 ? String(row[urlIdx] || "").trim() : "010-0000-0000";
        const qtyVal = qtyIdx !== -1 ? Number(row[qtyIdx]) || 100 : 100;

        rows.push({
          id: `excel-${Date.now()}-${i}`,
          selected: true,
          name: nameVal,
          category: catVal,
          spec: specVal,
          retailPrice: retailVal,
          supplyPrice: supplyVal,
          commissionRate: commVal,
          contactOrUrl: urlVal,
          quantity: qtyVal,
        });
      }

      if (rows.length === 0) {
        throw new Error("유효한 상품 목록을 찾을 수 없습니다.");
      }

      setParsedRows(rows);
      setParseStatusText(`✓ ${rows.length}개 상품이 엑셀에서 자동 추출되었습니다.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "엑셀 파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsParsing(false);
    }
  };

  // 2. 카탈로그/PDF/이미지 파싱 엔진 (Gemini Flash API)
  const parsePdfOrImageWithAi = async (fileObj: File) => {
    setIsParsing(true);
    setParseStatusText("⚡ Gemini Flash AI가 카탈로그 문서에서 상품 규격 및 공급가를 고속 분석 중...");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", fileObj);

      const res = await fetch("/api/ai/parse-catalog", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
        const rows: CatalogRowItem[] = data.items.map((it: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          selected: true,
          name: it.name || `추출 상품 ${idx + 1}`,
          category: it.category || "제조 직거래",
          spec: it.spec || "정품 인증 규격",
          retailPrice: it.retailPrice || "시중가",
          supplyPrice: it.supplyPrice || "특판가",
          commissionRate: it.commissionRate || "15%",
          contactOrUrl: it.contactOrUrl || "직거래 상담",
          quantity: it.quantity || 50,
        }));

        setParsedRows(rows);
        setParseStatusText(`✓ AI가 카탈로그에서 ${rows.length}개 상품을 성공적으로 인식했습니다.`);
      } else {
        throw new Error(data.error || "카탈로그에서 상품을 추출하지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "AI 카탈로그 분석 중 오류가 발생했습니다.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      parseExcelOrCsv(selectedFile);
    } else if (ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png") {
      parsePdfOrImageWithAi(selectedFile);
    } else {
      setErrorMessage("지원하지 않는 파일 형식입니다. (.xlsx, .csv, .pdf, .jpg, .png)");
    }
  };

  // 가격 및 퍼센트 포맷터
  function formatPrice(val: any): string {
    if (!val) return "특판가";
    const num = Number(String(val).replace(/[^0-9]/g, ""));
    return isNaN(num) || num === 0 ? String(val) : `${num.toLocaleString()}원`;
  }

  function formatPercent(val: any): string {
    if (!val) return "15%";
    const str = String(val).trim();
    if (str.includes("%")) return str;
    const num = Number(str);
    return isNaN(num) ? "15%" : `${num <= 1 ? Math.round(num * 100) : num}%`;
  }

  // 샘플 데이터 로더 (원클릭 체험용)
  const handleLoadSample = () => {
    const sampleItems: CatalogRowItem[] = [
      {
        id: "sample-1",
        selected: true,
        name: "친환경 3중 미세먼지 차단 방충망 세대 시공 키트",
        category: "인테리어·설비",
        spec: "30메쉬 고강도 모노필라멘트 / 84타입 기준",
        retailPrice: "180,000원",
        supplyPrice: "115,000원",
        commissionRate: "15%",
        contactOrUrl: "010-8832-1920",
        quantity: 100,
      },
      {
        id: "sample-2",
        selected: true,
        name: "고효율 초절전 LED 복도·지하주차장 센서등 10구 패키지",
        category: "공용부 자재",
        spec: "15W 주백색 / 고감도 레이더 센서 내장",
        retailPrice: "250,000원",
        supplyPrice: "165,000원",
        commissionRate: "12%",
        contactOrUrl: "https://form.naver.com/response/led-package",
        quantity: 50,
      },
      {
        id: "sample-3",
        selected: true,
        name: "아파트 단지 전용 미생물 발효 음식물 감량처리기",
        category: "주방·환경가전",
        spec: "1일 2kg 처리 / 탈취 촉매 필터 2년 보증",
        retailPrice: "790,000원",
        supplyPrice: "520,000원",
        commissionRate: "10%",
        contactOrUrl: "1544-7821",
        quantity: 30,
      },
      {
        id: "sample-4",
        selected: true,
        name: "입주민 단체공구 프리미엄 탄소매트 온수리스 온열패드",
        category: "생활·계절",
        spec: "슈퍼싱글/퀸 겸용 / 무전자파 EMF 인증",
        retailPrice: "129,000원",
        supplyPrice: "79,000원",
        commissionRate: "18%",
        contactOrUrl: "https://form.naver.com/response/carbon-mat",
        quantity: 200,
      },
      {
        id: "sample-5",
        selected: true,
        name: "지하주차장 누수 차단 에폭시 인젝션 셀프 보수제",
        category: "유지보수 자재",
        spec: "수용성 친환경 지수제 5kg 세트",
        retailPrice: "85,000원",
        supplyPrice: "58,000원",
        commissionRate: "15%",
        contactOrUrl: "02-938-4411",
        quantity: 80,
      },
    ];
    setParsedRows(sampleItems);
    setParseStatusText("✓ 샘플 카탈로그 5개 품목이 자동 파싱되었습니다.");
  };

  // 체크박스 전체 선택 토글
  const allSelected = parsedRows.length > 0 && parsedRows.every((r) => r.selected);
  const handleToggleSelectAll = () => {
    const next = !allSelected;
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: next })));
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;

  // 인라인 수정 핸들러
  const handleUpdateRow = (id: string, field: keyof CatalogRowItem, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // 소싱 룸에 일괄 등록 (SourcingItem 변환)
  const handleCommitImport = () => {
    const chosen = parsedRows.filter((r) => r.selected);
    if (chosen.length === 0) return;

    const converted: SourcingItem[] = chosen.map((item) => {
      const commRateClean = item.commissionRate.includes("%")
        ? item.commissionRate
        : `${item.commissionRate}%`;

      return {
        id: `src-imp-${Date.now()}-${item.id}`,
        manufacturer: manufacturer.trim() || "제조 직거래 회원사",
        category: item.category || "제조 직거래",
        title: item.name,
        supplyPrice: item.supplyPrice,
        commissionRate: commRateClean,
        commissionAmount: `공급가 대비 ${commRateClean}`,
        contactNumber: item.contactOrUrl.startsWith("http")
          ? "상담링크 제공"
          : item.contactOrUrl,
        orderFormUrl: item.contactOrUrl.startsWith("http")
          ? item.contactOrUrl
          : undefined,
        description: `[${item.spec}] ${item.retailPrice !== "시중가" ? `권장소비자가 ${item.retailPrice} ➔ ` : ""}회원 공급가 ${item.supplyPrice}`,
        shortsScript: `[15초 쇼츠 대본] ${manufacturer} 직거래 특판! ${item.name} (${item.spec}) 단지 주민 특별가 ${item.supplyPrice}! 엠버서더 픽 전용 링크에서 지금 신청하세요.`,
      };
    });

    onImportItems(converted);
    setIsSuccessDone(true);
    setTimeout(() => {
      setIsSuccessDone(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-3xl rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100 overflow-hidden">
        {/* 1. 모달 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-medium text-xs">
              ⚡
            </span>
            <div>
              <h2 className="text-sm font-medium text-slate-900 leading-tight flex items-center gap-1.5">
                <span>스마트 쇼핑리스트 자동 완성 파이프라인</span>
                <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.2 text-[10px] font-normal">
                  엑셀 · PDF · AI 카탈로그
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-normal">
                카탈로그나 견적서를 올리면 AI가 수십 개 상품을 3초 만에 소싱 룸에 적재합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* 공급사 상호명 입력 */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-700">제조/공급사 상호명:</span>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="예: (주)에코홈텍"
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none w-48 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors font-normal cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>💡 샘플 카탈로그 원클릭 테스트</span>
            </button>
          </div>

          {/* 파일 업로드 드롭존 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-400 p-4 transition-colors cursor-pointer text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-indigo-600 group-hover:scale-105 transition-transform">
                <Upload className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-800">
                  {file ? file.name : "카탈로그 / 엑셀 / PDF / 전단지 파일 드롭 또는 클릭"}
                </p>
                <p className="text-[10px] text-slate-400 font-normal">
                  지원 포맷: .xlsx, .csv, .pdf, .jpg, .png (최대 20MB)
                </p>
              </div>
            </div>

            {isParsing && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{parseStatusText}</span>
              </div>
            )}

            {!isParsing && parseStatusText && (
              <p className="mt-1 text-[11px] text-emerald-600 font-normal">
                {parseStatusText}
              </p>
            )}

            {errorMessage && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-normal">
                <AlertCircle className="h-3 w-3" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* 파싱 결과 확인 및 수정 테이블 (Editable Shopping List Table) */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-800">
                    인식된 상품 목록 ({parsedRows.length}건)
                  </span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-normal">
                    선택 {selectedCount}건
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer font-normal"
                  >
                    {allSelected ? (
                      <>
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                        <span>전체 해제</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                        <span>전체 선택</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 편집형 그리드 테이블 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-normal">
                      <tr>
                        <th className="p-2 w-8 text-center">선택</th>
                        <th className="p-2 min-w-[150px]">상품명 (수정가능)</th>
                        <th className="p-2 min-w-[90px]">카테고리</th>
                        <th className="p-2 min-w-[110px]">규격/스펙</th>
                        <th className="p-2 min-w-[80px]">소비자가</th>
                        <th className="p-2 min-w-[85px]">특별공급가</th>
                        <th className="p-2 min-w-[70px]">수수료</th>
                        <th className="p-2 min-w-[120px]">결제/상담URL</th>
                        <th className="p-2 w-8 text-center">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            row.selected ? "bg-indigo-50/20" : "opacity-60"
                          }`}
                        >
                          {/* 1. 체크박스 */}
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "selected", e.target.checked)
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* 2. 상품명 (인라인 편집) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "name", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                            />
                          </td>

                          {/* 3. 카테고리 */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.category}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "category", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-600 font-normal"
                            />
                          </td>

                          {/* 4. 규격/스펙 */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.spec}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "spec", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-500 font-normal"
                            />
                          </td>

                          {/* 5. 소비자가 */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.retailPrice}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "retailPrice", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-400 font-normal text-right"
                            />
                          </td>

                          {/* 6. 특별공급가 */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.supplyPrice}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "supplyPrice", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none font-medium text-slate-900 text-right"
                            />
                          </td>

                          {/* 7. 수수료 */}
                          <td className="p-1.5">
                            <select
                              value={row.commissionRate}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "commissionRate", e.target.value)
                              }
                              className="w-full rounded px-1 py-1 border border-slate-200 text-rose-600 font-medium bg-white text-center"
                            >
                              <option value="10%">10%</option>
                              <option value="12%">12%</option>
                              <option value="15%">15%</option>
                              <option value="18%">18%</option>
                              <option value="20%">20%</option>
                            </select>
                          </td>

                          {/* 8. 결제/상담 URL */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.contactOrUrl}
                              onChange={(e) =>
                                handleUpdateRow(row.id, "contactOrUrl", e.target.value)
                              }
                              className="w-full rounded px-1.5 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-600 font-normal truncate"
                            />
                          </td>

                          {/* 9. 삭제 */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. 모달 하단 액션 바 */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 bg-slate-50/70">
          <div className="text-xs text-slate-500 font-normal">
            {parsedRows.length > 0 ? (
              <span>
                선택된 <strong className="text-indigo-600 font-medium">{selectedCount}</strong>개 상품을 소싱 룸에 적재합니다.
              </span>
            ) : (
              <span>파일을 드롭하거나 샘플 버튼을 눌러 목록을 파싱하세요.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 transition-colors font-normal cursor-pointer"
            >
              닫기
            </button>

            {isSuccessDone ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs text-white font-medium"
              >
                <Check className="h-3.5 w-3.5" />
                <span>소싱 룸 적재 완료!</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedCount === 0 || isParsing}
                onClick={handleCommitImport}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 px-3.5 py-1.5 text-xs text-white font-medium transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                <span>선택한 {selectedCount}개 상품 소싱 룸에 일괄 등록</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
