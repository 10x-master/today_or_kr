"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronRight, Loader2, ShoppingCart, X } from "lucide-react";
import { TMark, TodayAppIcon, TodayWordmark } from "@/components/brand/TodayLogo";
import { DiaryCoverThumbnail } from "@/components/diary/DiaryCoverThumbnail";
import { lightenHex } from "@/lib/diary/catalogUtils";
import type { DiaryBrand } from "@/types/diary";
import type { CatalogCategory, DiaryProduct, QuoteItem } from "@/types/quote";

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function cartKey(bizId: string) {
  return `today_diary_catalog_cart_${bizId}`;
}

function CategoryTabRow({
  items,
  activeId,
  onSelect,
}: {
  items: CatalogCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (items.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-0.5">
      {items.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeId === cat.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function BizCatalogContent() {
  const params = useParams();
  const router = useRouter();
  const bizId = (params?.bizId as string) || "";

  const [brand, setBrand] = useState<DiaryBrand | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<DiaryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeL1, setActiveL1] = useState("");
  const [activeL2, setActiveL2] = useState("");
  const [activeL3, setActiveL3] = useState("");

  // 선택 상품: productId -> 수량 (상세 페이지와 localStorage로 공유)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [cartLoaded, setCartLoaded] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [printOptions, setPrintOptions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bizId) return;
    Promise.all([
      fetch(`/api/t-diary/products?brand=${encodeURIComponent(bizId)}`).then((res) => res.json()),
      fetch(`/api/t-diary/categories?brand=${encodeURIComponent(bizId)}`).then((res) => res.json()),
    ])
      .then(([productData, categoryData]) => {
        setBrand(productData.brand || null);
        setProducts(productData.products || []);
        const visible: CatalogCategory[] = (categoryData.categories || []).filter((c: CatalogCategory) => c.is_visible);
        setCategories(visible);
        const l1List = visible.filter((c) => c.depth === 1);
        if (l1List.length > 0) setActiveL1(l1List[0].id);
      })
      .finally(() => setLoading(false));
  }, [bizId]);

  const l1Items = useMemo(() => categories.filter((c) => c.depth === 1), [categories]);
  const l2Items = useMemo(() => categories.filter((c) => c.depth === 2 && c.parent_id === activeL1), [categories, activeL1]);
  const l3Items = useMemo(() => categories.filter((c) => c.depth === 3 && c.parent_id === activeL2), [categories, activeL2]);

  useEffect(() => {
    if (l2Items.length > 0 && !l2Items.some((c) => c.id === activeL2)) setActiveL2(l2Items[0].id);
  }, [l2Items, activeL2]);

  useEffect(() => {
    if (l3Items.length > 0 && !l3Items.some((c) => c.id === activeL3)) setActiveL3(l3Items[0].id);
  }, [l3Items, activeL3]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey(bizId));
      if (raw) setSelectedQty(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      setCartLoaded(true);
    }
  }, [bizId]);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem(cartKey(bizId), JSON.stringify(selectedQty));
    } catch {
      // ignore
    }
  }, [selectedQty, bizId, cartLoaded]);

  const categoryProducts = useMemo(
    () => products.filter((p) => p.category_id === activeL3),
    [products, activeL3]
  );

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const toggleSelect = (e: React.MouseEvent, product: DiaryProduct) => {
    e.stopPropagation();
    setSelectedQty((prev) => {
      const next = { ...prev };
      if (next[product.id] !== undefined) {
        delete next[product.id];
      } else {
        next[product.id] = 100;
      }
      return next;
    });
  };

  const updateQty = (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    e.stopPropagation();
    setSelectedQty((prev) => ({ ...prev, [productId]: Math.max(1, Number(e.target.value)) }));
  };

  const selectedItems = useMemo(() => {
    return Object.entries(selectedQty)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;
        return { product, qty, unitPrice: product.sell_price };
      })
      .filter((v): v is { product: DiaryProduct; qty: number; unitPrice: number } => v !== null);
  }, [selectedQty, products]);

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !contactPhone.trim()) {
      setError("회사명, 담당자명, 연락처를 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const items: QuoteItem[] = selectedItems.map(({ product, qty, unitPrice }) => ({
      product_id: product.id,
      product_code: product.product_code,
      product_name: product.name,
      quantity: qty,
      unit_price: unitPrice,
    }));

    try {
      const res = await fetch("/api/t-diary/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: bizId,
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          contact_phone: contactPhone.trim(),
          items,
          print_options: printOptions.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "견적 요청에 실패했습니다.");
        return;
      }
      setSelectedQty({});
      try {
        localStorage.removeItem(cartKey(bizId));
      } catch {
        // ignore
      }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <CheckCircle2 className="h-10 w-10 text-blue-600" />
        <h1 className="mt-3 text-lg font-black text-slate-900">견적 요청이 접수되었습니다</h1>
        <p className="mt-1.5 max-w-xs text-xs text-slate-500 leading-relaxed">
          담당자 확인 후 견적서가 확정되면 카카오톡 알림톡으로 안내드립니다.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white pb-28">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-center gap-2">
          <TodayAppIcon theme="light" size={32} />
          <div>
            <p className="flex items-center gap-1 text-sm font-black text-slate-900">
              {brand?.brand_name || bizId} <TMark size="sm" />
              홈페이지 카탈로그
            </p>
            <p className="text-[11px] text-slate-400">32절 다이어리 B2B 도매 견적</p>
          </div>
        </div>

        {/* 3단 카테고리 탭 (대분류 -> 중분류 -> 소분류) */}
        <div className="mt-5 space-y-1.5">
          <CategoryTabRow items={l1Items} activeId={activeL1} onSelect={setActiveL1} />
          <CategoryTabRow items={l2Items} activeId={activeL2} onSelect={setActiveL2} />
          <CategoryTabRow items={l3Items} activeId={activeL3} onSelect={setActiveL3} />
        </div>

        {/* 상품 목록 */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categoryProducts.length === 0 && (
            <p className="col-span-full py-10 text-center text-xs text-slate-300">해당 카테고리에 등록된 상품이 없습니다.</p>
          )}
          {categoryProducts.map((product) => {
            const isSelected = selectedQty[product.id] !== undefined;
            const qty = selectedQty[product.id] || 100;
            const isTwoTone = product.name.includes("투톤");
            return (
              <div
                key={product.id}
                onClick={() => router.push(`/biz/${bizId}/catalog/${product.id}`)}
                className={`cursor-pointer rounded-2xl border p-3 transition-colors hover:border-slate-300 ${
                  isSelected ? "border-blue-300 bg-blue-50/30" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-16 w-full object-cover rounded-xl" />
                    ) : (
                      <DiaryCoverThumbnail
                        colorHex={product.color_hex}
                        secondaryColorHex={isTwoTone ? lightenHex(product.color_hex, 0.4) : undefined}
                        category={categoryNameById[product.category_id] || ""}
                        size={64}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(e, product)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border cursor-pointer ${
                      isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                    }`}
                    aria-label={`${product.name} 선택`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-500">
                    {product.product_code}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-bold text-slate-900 leading-snug">{product.name}</p>
                {product.spec && <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">{product.spec}</p>}
                <p className="mt-1.5 text-sm font-black text-blue-700">{formatWon(product.sell_price)}</p>

                {isSelected && (
                  <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => updateQty(e, product.id)}
                      className="w-16 rounded-lg border border-slate-200 px-1.5 py-1 text-[11px] focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400">부</span>
                    <span className="ml-auto text-[11px] font-bold text-blue-700">{formatWon(qty * product.sell_price)}</span>
                  </div>
                )}

                <div className="mt-1.5 flex items-center gap-0.5 text-[10px] text-slate-300">
                  상세보기 <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 고정 견적 요청 바 */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400">{selectedItems.length}개 상품 선택됨</p>
              <p className="text-sm font-black text-slate-900">{formatWon(totalAmount)}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              선택 상품 견적 요청하기
            </button>
          </div>
        </div>
      )}

      {/* 견적 요청 폼 모달 */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
          >
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="pr-6 text-sm font-black text-slate-900">견적 요청서 작성</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              선택 상품 {selectedItems.length}건 · 예상 금액 {formatWon(totalAmount)}
            </p>

            <form onSubmit={handleSubmitQuote} className="mt-3 space-y-2.5">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="회사명 *"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="담당자명 *"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="연락처 * (예: 010-1234-5678)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <textarea
                value={printOptions}
                onChange={(e) => setPrintOptions(e.target.value)}
                rows={2}
                placeholder="인쇄 옵션 (로고 각인, 내지 시작월 등)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
              />

              {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "견적 요청 제출"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 하단 t.다이어리 브랜드 표기 */}
      <div className="mt-8 flex items-center justify-center gap-1.5 py-4 text-[10px] text-slate-300">
        <TodayWordmark theme="light" size="sm" />
        <span className="inline-flex items-center gap-1">
          <TMark size="sm" />
          다이어리 B2B 카탈로그
        </span>
      </div>
    </div>
  );
}

export default function BizCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      }
    >
      <BizCatalogContent />
    </Suspense>
  );
}
