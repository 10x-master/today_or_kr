"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import type { CatalogCategory, DiaryProduct } from "@/types/quote";

interface BrandOption {
  brand_slug: string;
  brand_name: string;
}

/**
 * B2B 카탈로그 사전 계층 카테고리 관리 (독립 화면)
 *
 * 상품을 올릴 때 즉석으로 대/중/소분류를 자동 생성하던 방식을 지양하고, 여기서 관리자가
 * [대분류 → 중분류 → 소분류]를 먼저 만들어 두면, 상품 등록 폼(드롭다운 선택)과 엑셀/구글시트
 * 대량 업로드(이름 정확 매칭) 모두 이 사전 정의된 트리로만 매핑된다. 엑셀 행의 카테고리명이
 * 여기 없으면 자동 생성되지 않고 "미매칭"으로 보고되어 건너뛴다.
 */
export default function AdminCatalogCategoriesPage() {
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [brandSlug, setBrandSlug] = useState("sme-transform");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<DiaryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [newParentId, setNewParentId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    setTimeout(() => setToast(null), 3200);
  };

  const l1Items = useMemo(
    () => categories.filter((c) => c.depth === 1).sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const productCountOf = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.category_id] = (map[p.category_id] || 0) + 1;
    return map;
  }, [products]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/t-diary/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandSlug, name: newName.trim(), parent_id: newParentId || null }),
      });
      if (res.ok) {
        setNewName("");
        loadAll();
        showToast("카테고리가 추가되었습니다.");
      } else {
        const data = await res.json();
        showToast(data.error || "추가에 실패했습니다.");
      }
    } finally {
      setSaving(false);
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

  const startRename = (category: CatalogCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const confirmRename = async () => {
    if (!editingId || !editingName.trim()) return;
    await patchCategory(editingId, { name: editingName.trim() });
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (category: CatalogCategory) => {
    if (!window.confirm(`"${category.name}" 카테고리를 삭제할까요?`)) return;
    const res = await fetch(`/api/t-diary/categories/${category.id}`, { method: "DELETE" });
    if (res.ok) {
      loadAll();
      showToast("카테고리가 삭제되었습니다.");
    } else {
      const data = await res.json();
      showToast(data.error || "삭제에 실패했습니다.");
    }
  };

  const renderRow = (category: CatalogCategory, depthPad: number) => {
    const siblings = categories.filter((c) => c.parent_id === category.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((c) => c.id === category.id);
    const isEditing = editingId === category.id;
    const count = category.depth === 3 ? productCountOf[category.id] || 0 : null;

    return (
      <div key={category.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-1.5 mt-1" style={{ marginLeft: depthPad }}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-blue-300 px-2 py-1 text-xs focus:outline-hidden"
            />
            <button type="button" onClick={confirmRename} className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50 cursor-pointer" aria-label="저장">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="취소">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-slate-800 flex-1">{category.name}</span>
            {count !== null && <span className="text-[10px] text-slate-300">{count}개 상품</span>}
            <button type="button" onClick={() => startRename(category)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="이름 수정">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => moveCategory(category, -1)} disabled={idx === 0} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer" aria-label="위로">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => moveCategory(category, 1)} disabled={idx === siblings.length - 1} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-20 cursor-pointer" aria-label="아래로">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => patchCategory(category.id, { is_visible: !category.is_visible })}
              className={`rounded-lg p-1 cursor-pointer ${category.is_visible ? "text-blue-600" : "text-slate-300"}`}
              aria-label="노출 토글"
            >
              {category.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => handleDelete(category)} className="rounded-lg p-1 text-rose-500 hover:bg-rose-50 cursor-pointer" aria-label="삭제">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-white pb-20">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <UnifiedHomeReturnAnchor currentModule="admin-diaries-catalog-categories" />

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
              <Layers className="h-5 w-5 text-blue-600" />
              카테고리 사전 관리
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              여기서 만든 대/중/소분류만 상품 등록·엑셀 대량 업로드에 매핑됩니다. 이름이 없는 카테고리는 자동 생성되지 않고 건너뜁니다.
            </p>
          </div>
          <Link
            href="/admin/diaries/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Package className="h-3.5 w-3.5" />
            상품 등록 콘솔로 이동
          </Link>
        </div>

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
          <section className="mt-5 rounded-2xl border border-slate-100 p-4">
            <h2 className="text-xs font-black text-slate-700">대분류 → 중분류 → 소분류</h2>
            <div className="mt-3 space-y-1">
              {l1Items.length === 0 && (
                <p className="py-4 text-center text-[11px] text-slate-300">아직 등록된 카테고리가 없습니다. 아래에서 대분류부터 추가해주세요.</p>
              )}
              {l1Items.map((l1) => (
                <div key={l1.id}>
                  {renderRow(l1, 0)}
                  {childrenOf(l1.id).map((l2) => (
                    <div key={l2.id}>
                      {renderRow(l2, 16)}
                      {childrenOf(l2.id).map((l3) => <div key={l3.id}>{renderRow(l3, 32)}</div>)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              >
                <option value="">최상위 대분류로 추가</option>
                {categories
                  .filter((c) => c.depth < 3)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {"　".repeat(c.depth - 1)}
                      {c.name} 하위에 {c.depth === 1 ? "중분류" : "소분류"} 추가
                    </option>
                  ))}
              </select>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="새 카테고리명"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-40 cursor-pointer"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  추가
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {toast && (
        <div className="fixed top-5 left-1/2 z-100 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
