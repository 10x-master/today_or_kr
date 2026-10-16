"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Layers,
  Link2,
  Loader2,
  Package,
  Plus,
  Printer,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { DiaryCoverThumbnail } from "@/components/diary/DiaryCoverThumbnail";
import { suggestSellPrice } from "@/lib/diary/catalogUtils";
import { CATALOG_EXCEL_HEADERS, parseCatalogSheetRows, type CatalogExcelRow } from "@/lib/diary/catalogExcel";
import type { CatalogCategory, DealerCatalogBranding, DealerCatalogSelectionMode, DiaryProduct } from "@/types/quote";

function formatWon(n: number) {
  return `${(n || 0).toLocaleString("ko-KR")}원`;
}

interface BrandOption {
  brand_slug: string;
  brand_name: string;
}

interface ProductFormState {
  id?: string;
  category_id: string;
  product_code: string;
  name: string;
  spec: string;
  cost_price: string;
  sell_price: string;
  color_hex: string;
  image_url: string;
  cover_size: string;
  page_count: string;
  material_info: string;
}

const EMPTY_FORM: ProductFormState = {
  category_id: "",
  product_code: "",
  name: "",
  spec: "",
  cost_price: "",
  sell_price: "",
  color_hex: "#1B3A5C",
  image_url: "",
  cover_size: "커버 124×180mm / 123×185mm",
  page_count: "256",
  material_info: "이태리 습식 원단",
};

const EMPTY_BRANDING: DealerCatalogBranding = {
  dealer_name: "",
  dealer_logo_url: null,
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  address: "",
  cover_headline: "",
  footer_note: "",
  price_display: "show",
};

export default function AdminDiaryCatalogConsolePage() {
  const [forceAdminMode, setForceAdminMode] = useState(true);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [brandSlug, setBrandSlug] = useState("sme-transform");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<DiaryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategoryParentId, setNewCategoryParentId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 엑셀/CSV/구글시트 대량 등록
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetFetching, setSheetFetching] = useState(false);
  const [previewRows, setPreviewRows] = useState<CatalogExcelRow[]>([]);
  const [importing, setImporting] = useState(false);

  // 딜러 맞춤형 카탈로그 생성
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [dealerMode, setDealerMode] = useState<DealerCatalogSelectionMode>("ALL");
  const [dealerSelectedIds, setDealerSelectedIds] = useState<string[]>([]);
  const [dealerCategoryId, setDealerCategoryId] = useState("");
  const [branding, setBranding] = useState<DealerCatalogBranding>(EMPTY_BRANDING);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetch("/api/t-diary/admin/providers")
      .then((res) => res.json())
      .then((data) => setBrandOptions(data.providers || []));
  }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/t-diary/categories?brand=${brandSlug}`).then((res) => res.json()),
      fetch(`/api/t-diary/products?brand=${brandSlug}`).then((res) => res.json()),
    ])
      .then(([categoryData, productData]) => {
        setCategories(categoryData.categories || []);
        setProducts(productData.products || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandSlug]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const l1Items = useMemo(() => categories.filter((c) => c.depth === 1).sort((a, b) => a.sort_order - b.sort_order), [categories]);
  const l3Items = useMemo(() => categories.filter((c) => c.depth === 3).sort((a, b) => a.sort_order - b.sort_order), [categories]);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const productsByCategoryId = useMemo(() => {
    const map: Record<string, DiaryProduct[]> = {};
    for (const p of products) {
      if (!map[p.category_id]) map[p.category_id] = [];
      map[p.category_id].push(p);
    }
    return map;
  }, [products]);

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/t-diary/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandSlug, name: newCategoryName.trim(), parent_id: newCategoryParentId || null }),
      });
      if (res.ok) {
        setNewCategoryName("");
        loadAll();
        showToast("카테고리가 추가되었습니다.");
      }
    } finally {
      setSavingCategory(false);
    }
  };

  const patchCategory = async (id: string, patch: Partial<CatalogCategory>) => {
    await fetch(`/api/t-diary/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadAll();
  };

  const moveCategory = (category: CatalogCategory, direction: -1 | 1) => {
    const siblings = categories
      .filter((c) => c.parent_id === category.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((c) => c.id === category.id);
    const swapWith = siblings[idx + direction];
    if (!swapWith) return;
    patchCategory(category.id, { sort_order: swapWith.sort_order });
    patchCategory(swapWith.id, { sort_order: category.sort_order });
  };

  const openNewProductForm = (categoryId: string) => {
    setForm({ ...EMPTY_FORM, category_id: categoryId });
    setFormOpen(true);
  };

  const openEditProductForm = (product: DiaryProduct) => {
    setForm({
      id: product.id,
      category_id: product.category_id,
      product_code: product.product_code,
      name: product.name,
      spec: product.spec || "",
      cost_price: String(product.cost_price),
      sell_price: String(product.sell_price),
      color_hex: product.color_hex,
      image_url: product.image_url || "",
      cover_size: product.cover_size,
      page_count: String(product.page_count),
      material_info: product.material_info,
    });
    setFormOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!form.category_id || !form.product_code.trim() || !form.name.trim() || !form.cost_price) {
      showToast("소분류, 품목코드, 품목명, 공급원가는 필수입니다.");
      return;
    }
    setSavingProduct(true);
    const payload = {
      brand: brandSlug,
      category_id: form.category_id,
      product_code: form.product_code.trim(),
      name: form.name.trim(),
      spec: form.spec.trim() || null,
      cost_price: Number(form.cost_price),
      sell_price: form.sell_price ? Number(form.sell_price) : undefined,
      color_hex: form.color_hex,
      image_url: form.image_url.trim() || null,
      cover_size: form.cover_size.trim(),
      page_count: Number(form.page_count) || 256,
      material_info: form.material_info.trim(),
    };
    try {
      const res = await fetch(form.id ? `/api/t-diary/products/${form.id}` : "/api/t-diary/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFormOpen(false);
        loadAll();
        showToast(form.id ? "상품이 수정되어 카탈로그에 즉시 반영되었습니다." : "상품이 등록되어 카탈로그에 즉시 노출됩니다.");
      } else {
        const data = await res.json();
        showToast(data.error || "저장에 실패했습니다.");
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const suggestedSellPrice = form.cost_price ? suggestSellPrice(Number(form.cost_price)) : 0;

  // ===== 엑셀/CSV 업로드 =====
  const handleFileSelected = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
      const rows = parseCatalogSheetRows(raw);
      setPreviewRows(rows);
      if (rows.length === 0) showToast("파일에서 유효한 행을 찾지 못했습니다. 템플릿 양식을 확인해주세요.");
    } catch {
      showToast("파일을 읽는 데 실패했습니다. CSV/XLSX 형식을 확인해주세요.");
    }
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) return;
    setSheetFetching(true);
    try {
      const res = await fetch(`/api/t-diary/catalog/fetch-sheet?url=${encodeURIComponent(sheetUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "스프레드시트를 불러오지 못했습니다.");
        return;
      }
      const rows = parseCatalogSheetRows(data.rows || []);
      setPreviewRows(rows);
      if (rows.length === 0) showToast("시트에서 유효한 행을 찾지 못했습니다. 헤더명을 템플릿과 동일하게 맞춰주세요.");
    } finally {
      setSheetFetching(false);
    }
  };

  const handleConfirmImport = async () => {
    if (previewRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/t-diary/catalog/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandSlug, rows: previewRows }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `${data.created}건 신규 등록, ${data.updated}건 갱신 완료${
            data.unmatched?.length ? ` (카테고리 미매칭 ${data.unmatched.length}건 — 사전 카테고리 등록 후 재업로드 필요)` : ""
          }${data.errors?.length ? ` (오류 ${data.errors.length}건)` : ""}`
        );
        setPreviewRows([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadAll();
      } else {
        showToast(data.error || "대량 등록에 실패했습니다.");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    window.open(`/api/t-diary/catalog/export?brand=${brandSlug}`, "_blank");
  };

  // ===== 딜러 맞춤형 카탈로그 =====
  const toggleDealerProduct = (id: string) => {
    setDealerSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleGenerateDealerPdf = async () => {
    if (!branding.dealer_name.trim()) {
      showToast("딜러 상호/회사명을 입력해주세요.");
      return;
    }
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/t-diary/catalog/dealer-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brandSlug,
          mode: dealerMode,
          product_ids: dealerMode === "SELECTED" ? dealerSelectedIds : undefined,
          category_id: dealerMode === "CATEGORY" ? dealerCategoryId : undefined,
          branding,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "PDF 생성에 실패했습니다.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dealer-catalog-${brandSlug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleOpenPrintMode = () => {
    if (!branding.dealer_name.trim()) {
      showToast("딜러 상호/회사명을 입력해주세요.");
      return;
    }
    let printProducts = products;
    if (dealerMode === "SELECTED") printProducts = products.filter((p) => dealerSelectedIds.includes(p.id));
    else if (dealerMode === "CATEGORY") printProducts = products.filter((p) => p.category_id === dealerCategoryId);

    const payload = {
      brandName: brandOptions.find((b) => b.brand_slug === brandSlug)?.brand_name || brandSlug,
      branding,
      products: printProducts.map((p) => ({
        product_code: p.product_code,
        name: p.name,
        spec: p.spec,
        sell_price: p.sell_price,
        category: categoryNameById[p.category_id] || "",
      })),
    };
    try {
      sessionStorage.setItem("dealer_catalog_print_payload", JSON.stringify(payload));
      window.open("/admin/diaries/catalog/print", "_blank");
    } catch {
      showToast("인쇄 모드를 여는 데 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <UnifiedHomeReturnAnchor currentModule="admin-diaries-catalog" />

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
              <Layers className="h-5 w-5 text-blue-600" />
              카테고리 & 제품 등록 콘솔
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">공급원가는 본사 관리자 전용 — 딜러/고객 화면에는 권장소비자가만 노출됩니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setForceAdminMode(!forceAdminMode)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-colors ${
              forceAdminMode ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            관리자 권한 {forceAdminMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* 브랜드(카탈로그 운영사) 선택 */}
        <select
          value={brandSlug}
          onChange={(e) => setBrandSlug(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-blue-500"
        >
          {brandOptions.map((b) => (
            <option key={b.brand_slug} value={b.brand_slug}>
              {b.brand_name} ({b.brand_slug})
            </option>
          ))}
        </select>

        {loading ? (
          <p className="mt-10 text-center text-xs text-slate-300">불러오는 중...</p>
        ) : (
          <>
            {/* 카테고리 관리 (3단 트리) */}
            <section className="mt-5 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-700">카테고리 관리 (대분류 → 중분류 → 소분류)</h2>
                <Link
                  href="/admin/diaries/catalog/categories"
                  className="shrink-0 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  전체 관리 화면 ↗
                </Link>
              </div>
              <div className="mt-3 space-y-1">
                {l1Items.map((l1) => (
                  <div key={l1.id}>
                    <CategoryRow category={l1} siblings={l1Items} onMove={moveCategory} onToggle={patchCategory} productCount={0} />
                    {childrenOf(l1.id).map((l2) => (
                      <div key={l2.id} className="ml-4">
                        <CategoryRow category={l2} siblings={childrenOf(l1.id)} onMove={moveCategory} onToggle={patchCategory} productCount={0} />
                        {childrenOf(l2.id).map((l3) => (
                          <div key={l3.id} className="ml-8">
                            <CategoryRow
                              category={l3}
                              siblings={childrenOf(l2.id)}
                              onMove={moveCategory}
                              onToggle={patchCategory}
                              productCount={productsByCategoryId[l3.id]?.length || 0}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                <select
                  value={newCategoryParentId}
                  onChange={(e) => setNewCategoryParentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                >
                  <option value="">최상위 대분류로 추가</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {"　".repeat(c.depth - 1)}
                      {c.name} 하위에 추가
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="새 카테고리명"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={savingCategory}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40 cursor-pointer"
                  >
                    {savingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    추가
                  </button>
                </div>
              </div>
            </section>

            {/* 엑셀/CSV/구글시트 대량 등록 & 내보내기 */}
            <section className="mt-5 rounded-2xl border border-slate-100 p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                엑셀/CSV 대량 등록 & 내보내기
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <a
                  href="/api/t-diary/catalog/template"
                  download
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  📥 표준 엑셀 템플릿 다운로드
                </a>
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  📊 전체 카탈로그 엑셀 다운로드
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  CSV/XLSX 파일 선택
                </button>
                <p className="mt-1.5 text-[10px] text-slate-400">{CATALOG_EXCEL_HEADERS.join(" · ")}</p>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="공개 구글 스프레드시트 URL (링크가 있는 모든 사용자 보기)"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleFetchSheet}
                  disabled={sheetFetching}
                  className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  {sheetFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "불러오기"}
                </button>
              </div>

              {previewRows.length > 0 && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                  <p className="text-[11px] font-bold text-blue-700">미리보기 {previewRows.length}건</p>
                  <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1">
                    {previewRows.slice(0, 10).map((r, i) => (
                      <p key={i} className="text-[10px] text-slate-500">
                        {r.product_code} · {r.name} · {r.l1_name}/{r.l2_name}/{r.l3_name} · {formatWon(r.sell_price)}
                      </p>
                    ))}
                    {previewRows.length > 10 && <p className="text-[10px] text-slate-400">외 {previewRows.length - 10}건...</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {previewRows.length}건 일괄 등록
                  </button>
                </div>
              )}
            </section>

            {/* 딜러 맞춤형 카탈로그 생성 */}
            <section className="mt-5 rounded-2xl border border-slate-100 p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                딜러 맞춤형 카탈로그
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">딜러 로고·연락처가 박힌 전용 제안서 PDF 또는 즉시 인쇄용 웹 카탈로그를 생성합니다.</p>
              <button
                type="button"
                onClick={() => setDealerModalOpen(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors cursor-pointer"
              >
                🖨 딜러 맞춤 카탈로그 생성
              </button>
            </section>

            {/* 제품 목록 */}
            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                  <Package className="h-3.5 w-3.5" />
                  등록 제품
                </h2>
                <button
                  type="button"
                  onClick={() => openNewProductForm(l3Items[0]?.id || "")}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  새 상품 등록
                </button>
              </div>

              <div className="mt-3 space-y-5">
                {l3Items.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-[11px] font-bold text-slate-400">{cat.name}</p>
                    <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(productsByCategoryId[cat.id] || []).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => openEditProductForm(product)}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                        >
                          <div className="shrink-0 rounded-lg bg-slate-50 p-1">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image_url} alt={product.name} className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <DiaryCoverThumbnail colorHex={product.color_hex} category={cat.name} size={32} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-500">
                                {product.product_code}
                              </span>
                              <p className="truncate text-[11px] font-bold text-slate-800">{product.name}</p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              공급원가(내부) {formatWon(product.cost_price)} · 권장소비자가{" "}
                              <span className="font-bold text-blue-600">{formatWon(product.sell_price)}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                      {(productsByCategoryId[cat.id] || []).length === 0 && (
                        <p className="text-[11px] text-slate-300 py-2">등록된 상품이 없습니다.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* 제품 등록/수정 폼 */}
      {formOpen && (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
          >
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="pr-6 text-sm font-black text-slate-900">{form.id ? "상품 수정" : "새 상품 등록"}</h3>

            <div className="mt-3 space-y-2.5">
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              >
                <option value="">소분류 카테고리 선택</option>
                {l3Items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.product_code}
                onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                placeholder="품목코드 * (예: MO-07)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="품목명 *"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={form.spec}
                onChange={(e) => setForm({ ...form, spec: e.target.value })}
                placeholder="한줄 스펙 (예: PU가죽 표지 · 금박 각인 가능)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      cost_price: next,
                      sell_price: prev.sell_price || (next ? String(suggestSellPrice(Number(next))) : ""),
                    }));
                  }}
                  placeholder="공급원가 * (내부 전용)"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <input type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer" />
              </div>
              <input
                type="number"
                value={form.sell_price}
                onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                placeholder={`권장소비자가 (제안값: ${formatWon(suggestedSellPrice)})`}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 focus:outline-hidden focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">딜러/고객 화면에는 권장소비자가만 노출됩니다. 직접 수정 가능.</p>

              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="구글 드라이브 공유 링크 또는 이미지 URL (선택)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={form.cover_size}
                onChange={(e) => setForm({ ...form, cover_size: e.target.value })}
                placeholder="실규격"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.page_count}
                  onChange={(e) => setForm({ ...form, page_count: e.target.value })}
                  placeholder="내지 페이지 수"
                  className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <input
                  type="text"
                  value={form.material_info}
                  onChange={(e) => setForm({ ...form, material_info: e.target.value })}
                  placeholder="원단 정보"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={savingProduct}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {form.id ? "수정 저장" : "카탈로그에 즉시 등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 딜러 맞춤형 카탈로그 생성 모달 */}
      {dealerModalOpen && (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setDealerModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
          >
            <button
              type="button"
              onClick={() => setDealerModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="pr-6 text-sm font-black text-slate-900">🖨 딜러 맞춤 카탈로그 생성</h3>

            <p className="mt-3 text-[11px] font-bold text-slate-700">품목 선택 모드</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {([
                ["SELECTED", "선택한 품목만"],
                ["CATEGORY", "특정 카테고리 전체"],
                ["ALL", "전체 카탈로그 일괄"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDealerMode(value)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-colors ${
                    dealerMode === value ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {dealerMode === "CATEGORY" && (
              <select
                value={dealerCategoryId}
                onChange={(e) => setDealerCategoryId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              >
                <option value="">소분류 선택</option>
                {l3Items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {dealerMode === "SELECTED" && (
              <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-100 p-2 space-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={dealerSelectedIds.includes(p.id)}
                      onChange={() => toggleDealerProduct(p.id)}
                      className="cursor-pointer"
                    />
                    {p.product_code} · {p.name}
                  </label>
                ))}
              </div>
            )}

            <p className="mt-4 text-[11px] font-bold text-slate-700">딜러 브랜딩 정보</p>
            <div className="mt-1.5 space-y-2">
              <input
                type="text"
                value={branding.dealer_name}
                onChange={(e) => setBranding({ ...branding, dealer_name: e.target.value })}
                placeholder="딜러 상호/회사명 *"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={branding.dealer_logo_url || ""}
                onChange={(e) => setBranding({ ...branding, dealer_logo_url: e.target.value || null })}
                placeholder="딜러 로고 이미지 URL (구글드라이브 공유링크 가능)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={branding.contact_name}
                  onChange={(e) => setBranding({ ...branding, contact_name: e.target.value })}
                  placeholder="담당자명"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <input
                  type="text"
                  value={branding.contact_phone}
                  onChange={(e) => setBranding({ ...branding, contact_phone: e.target.value })}
                  placeholder="연락처"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <input
                type="text"
                value={branding.contact_email}
                onChange={(e) => setBranding({ ...branding, contact_email: e.target.value })}
                placeholder="이메일"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={branding.address}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                placeholder="사업장 주소"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <textarea
                value={branding.cover_headline}
                onChange={(e) => setBranding({ ...branding, cover_headline: e.target.value })}
                rows={2}
                placeholder="표지 헤드카피 (자유 작성)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
              />
              <textarea
                value={branding.footer_note}
                onChange={(e) => setBranding({ ...branding, footer_note: e.target.value })}
                rows={2}
                placeholder="맞춤 안내 문구 (자유 작성)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
              />

              <div className="flex gap-1.5">
                {([
                  ["show", "권장소비자가 표기"],
                  ["hide", "가격 미표기 (견적문의형)"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBranding({ ...branding, price_display: value })}
                    className={`flex-1 rounded-xl border px-2 py-2 text-[11px] font-bold cursor-pointer transition-colors ${
                      branding.price_display === value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleGenerateDealerPdf}
                disabled={generatingPdf}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : "📄"}
                PDF 다운로드
              </button>
              <button
                type="button"
                onClick={handleOpenPrintMode}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <Printer className="h-4 w-4" />
                웹 인쇄 모드
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-5 left-1/2 z-100 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  siblings,
  onMove,
  onToggle,
  productCount,
}: {
  category: CatalogCategory;
  siblings: CatalogCategory[];
  onMove: (category: CatalogCategory, direction: -1 | 1) => void;
  onToggle: (id: string, patch: Partial<CatalogCategory>) => void;
  productCount: number;
}) {
  const idx = siblings.findIndex((c) => c.id === category.id);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-1.5 mt-1">
      <span className="text-xs font-bold text-slate-800 flex-1">{category.name}</span>
      {category.depth === 3 && <span className="text-[10px] text-slate-300">{productCount}개 상품</span>}
      <button
        type="button"
        onClick={() => onMove(category, -1)}
        disabled={idx === 0}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
        aria-label="위로"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(category, 1)}
        disabled={idx === siblings.length - 1}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
        aria-label="아래로"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onToggle(category.id, { is_visible: !category.is_visible })}
        className={`rounded-lg p-1 cursor-pointer ${category.is_visible ? "text-blue-600" : "text-slate-300"}`}
        aria-label="노출 토글"
      >
        {category.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
