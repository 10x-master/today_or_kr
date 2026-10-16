"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Loader2, Ruler, ShoppingCart, Sparkles } from "lucide-react";
import { TodayWordmark } from "@/components/brand/TodayLogo";
import { DiaryCoverThumbnail } from "@/components/diary/DiaryCoverThumbnail";
import { lightenHex, PRINT_METHOD_INFO } from "@/lib/diary/catalogUtils";
import type { CatalogCategory, DiaryProduct } from "@/types/quote";

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function cartKey(bizId: string) {
  return `today_diary_catalog_cart_${bizId}`;
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const bizId = (params?.bizId as string) || "";
  const productId = (params?.productId as string) || "";

  const [product, setProduct] = useState<DiaryProduct | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/t-diary/products/${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          return fetch(`/api/t-diary/categories?brand=${encodeURIComponent(bizId)}`)
            .then((res) => res.json())
            .then((catData) => {
              const found = (catData.categories || []).find((c: CatalogCategory) => c.id === data.product.category_id);
              if (found) setCategoryName(found.name);
            });
        }
        setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId, bizId]);

  const handleAddToQuote = () => {
    if (!product) return;
    try {
      const raw = localStorage.getItem(cartKey(bizId));
      const cart: Record<string, number> = raw ? JSON.parse(raw) : {};
      if (cart[product.id] === undefined) cart[product.id] = 100;
      localStorage.setItem(cartKey(bizId), JSON.stringify(cart));
      setAdded(true);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <p className="text-sm font-bold text-slate-400">상품을 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => router.push(`/biz/${bizId}/catalog`)}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          카탈로그로 돌아가기
        </button>
      </div>
    );
  }

  const isTwoTone = product.name.includes("투톤");

  return (
    <div className="min-h-screen w-full bg-white pb-28">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
        <button
          type="button"
          onClick={() => router.push(`/biz/${bizId}/catalog`)}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          카탈로그로 돌아가기
        </button>

        {/* 표지 + 내지 펼침 */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center justify-center rounded-2xl bg-slate-50 py-8">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="max-h-40 rounded-xl object-contain" />
            ) : (
              <DiaryCoverThumbnail
                colorHex={product.color_hex}
                secondaryColorHex={isTwoTone ? lightenHex(product.color_hex, 0.4) : undefined}
                category={categoryName}
                size={140}
              />
            )}
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 p-4">
            <DiaryCoverThumbnail colorHex={product.color_hex} category={categoryName} variant="spread" size={160} />
            <p className="text-[10px] text-slate-400">내지 펼침 · {product.page_count}p 괘선</p>
          </div>
        </div>

        {/* 제품 정보 */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{product.product_code}</span>
          {categoryName && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">{categoryName}</span>}
        </div>
        <h1 className="mt-1 text-lg font-black text-slate-900 leading-snug">{product.name}</h1>
        {product.spec && <p className="mt-1 text-xs text-slate-500">{product.spec}</p>}

        <div className="mt-3">
          <p className="text-2xl font-black text-blue-700">{formatWon(product.sell_price)}</p>
          <p className="text-[10px] text-slate-400">권장소비자가</p>
        </div>

        {/* 규격 */}
        <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Ruler className="h-3.5 w-3.5 text-slate-400" />
            제품 규격
          </div>
          <dl className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <dt>32절 실규격</dt>
              <dd className="font-bold text-slate-700">{product.cover_size}</dd>
            </div>
            <div className="flex justify-between">
              <dt>내지 사양</dt>
              <dd className="font-bold text-slate-700">{product.page_count}p</dd>
            </div>
            <div className="flex justify-between">
              <dt>원단 정보</dt>
              <dd className="font-bold text-slate-700">{product.material_info}</dd>
            </div>
          </dl>
        </div>

        {/* 인쇄 방식 안내 */}
        <div className="mt-3 flex items-start gap-1.5 rounded-2xl bg-amber-50/60 p-3.5 text-[11px] text-amber-800">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{PRINT_METHOD_INFO}</p>
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-400">권장소비자가</p>
            <p className="text-sm font-black text-slate-900">{formatWon(product.sell_price)}</p>
          </div>
          {added ? (
            <button
              type="button"
              onClick={() => router.push(`/biz/${bizId}/catalog`)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              담았습니다 · 카탈로그로
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToQuote}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              이 상품 견적서에 담기
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-1.5 py-4 text-[10px] text-slate-300">
        <TodayWordmark theme="light" size="sm" />
        <span>t.다이어리 B2B 카탈로그</span>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
