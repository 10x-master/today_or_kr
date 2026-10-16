"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Package,
  Plus,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { DiaryCoverThumbnail } from "@/components/diary/DiaryCoverThumbnail";
import { calcSellPrice } from "@/lib/diary/catalogUtils";
import type { DiaryCategory, DiaryProduct } from "@/types/quote";

const BRAND_SLUG = "sme-transform";

function formatWon(n: number) {
  return `${(n || 0).toLocaleString("ko-KR")}원`;
}

interface ProductFormState {
  id?: string;
  category: string;
  product_code: string;
  name: string;
  spec: string;
  cost_price: string;
  color_hex: string;
  image_url: string;
  cover_size: string;
  page_count: string;
  material_info: string;
}

const EMPTY_FORM: ProductFormState = {
  category: "",
  product_code: "",
  name: "",
  spec: "",
  cost_price: "",
  color_hex: "#1B3A5C",
  image_url: "",
  cover_size: "커버 124×180mm / 123×185mm",
  page_count: "256",
  material_info: "이태리 습식 원단",
};

export default function AdminDiaryCatalogConsolePage() {
  const [forceAdminMode, setForceAdminMode] = useState(true);
  const [categories, setCategories] = useState<DiaryCategory[]>([]);
  const [products, setProducts] = useState<DiaryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/t-diary/categories?brand=${BRAND_SLUG}`).then((res) => res.json()),
      fetch(`/api/t-diary/products?brand=${BRAND_SLUG}`).then((res) => res.json()),
    ])
      .then(([categoryData, productData]) => {
        setCategories((categoryData.categories || []).sort((a: DiaryCategory, b: DiaryCategory) => a.sort_order - b.sort_order));
        setProducts(productData.products || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const productsByCategory = useMemo(() => {
    const map: Record<string, DiaryProduct[]> = {};
    for (const p of products) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [products]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/t-diary/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: BRAND_SLUG, name: newCategoryName.trim() }),
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

  const patchCategory = async (id: string, patch: Partial<DiaryCategory>) => {
    await fetch(`/api/t-diary/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadAll();
  };

  const moveCategory = (category: DiaryCategory, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === category.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    patchCategory(category.id, { sort_order: swapWith.sort_order });
    patchCategory(swapWith.id, { sort_order: category.sort_order });
  };

  const openNewProductForm = (categoryName: string) => {
    setForm({ ...EMPTY_FORM, category: categoryName });
    setFormOpen(true);
  };

  const openEditProductForm = (product: DiaryProduct) => {
    setForm({
      id: product.id,
      category: product.category,
      product_code: product.product_code,
      name: product.name,
      spec: product.spec || "",
      cost_price: String(product.cost_price),
      color_hex: product.color_hex,
      image_url: product.image_url || "",
      cover_size: product.cover_size,
      page_count: String(product.page_count),
      material_info: product.material_info,
    });
    setFormOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!form.category || !form.product_code.trim() || !form.name.trim() || !form.cost_price) {
      showToast("카테고리, 품목코드, 품목명, 공급가는 필수입니다.");
      return;
    }
    setSavingProduct(true);
    const payload = {
      brand: BRAND_SLUG,
      category: form.category,
      product_code: form.product_code.trim(),
      name: form.name.trim(),
      spec: form.spec.trim() || null,
      cost_price: Number(form.cost_price),
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

  const previewSellPrice = form.cost_price ? calcSellPrice(Number(form.cost_price)) : 0;

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
            <p className="mt-0.5 text-xs text-slate-400">
              중소기업사업전환지원단 T.홈페이지 카탈로그 — 판매가는 공급가의 200%로 자동 계산됩니다.
            </p>
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

        {loading ? (
          <p className="mt-10 text-center text-xs text-slate-300">불러오는 중...</p>
        ) : (
          <>
            {/* 카테고리 관리 */}
            <section className="mt-6 rounded-2xl border border-slate-100 p-4">
              <h2 className="text-xs font-black text-slate-700">카테고리 관리</h2>
              <div className="mt-3 space-y-1.5">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2">
                    <span className="text-xs font-bold text-slate-800 flex-1">{cat.name}</span>
                    <span className="text-[10px] text-slate-300">{productsByCategory[cat.name]?.length || 0}개 상품</span>
                    <button
                      type="button"
                      onClick={() => moveCategory(cat, -1)}
                      disabled={idx === 0}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      aria-label="위로"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(cat, 1)}
                      disabled={idx === categories.length - 1}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      aria-label="아래로"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => patchCategory(cat.id, { is_visible: !cat.is_visible })}
                      className={`rounded-lg p-1 cursor-pointer ${cat.is_visible ? "text-blue-600" : "text-slate-300"}`}
                      aria-label="노출 토글"
                    >
                      {cat.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="새 카테고리명 (예: 한정판)"
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
                  onClick={() => openNewProductForm(categories[0]?.name || "")}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  새 상품 등록
                </button>
              </div>

              <div className="mt-3 space-y-5">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-[11px] font-bold text-slate-400">{cat.name}</p>
                    <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(productsByCategory[cat.name] || []).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => openEditProductForm(product)}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                        >
                          <div className="shrink-0 rounded-lg bg-slate-50 p-1">
                            <DiaryCoverThumbnail colorHex={product.color_hex} category={product.category} size={32} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-500">
                                {product.product_code}
                              </span>
                              <p className="truncate text-[11px] font-bold text-slate-800">{product.name}</p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              공급가 {formatWon(product.cost_price)} → 판매가{" "}
                              <span className="font-bold text-blue-600">{formatWon(product.sell_price)}</span>
                            </p>
                          </div>
                        </button>
                      ))}
                      {(productsByCategory[cat.name] || []).length === 0 && (
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
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
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
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  placeholder="공급가(원가) *"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <input type="color" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer" />
              </div>
              <p className="text-[11px] font-bold text-emerald-600">
                200% 판매가 자동 계산: {formatWon(previewSellPrice)}
              </p>

              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="제품 사진 URL (선택 · 미입력 시 컬러 커버 자동 생성)"
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

      {toast && (
        <div className="fixed top-5 left-1/2 z-100 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
