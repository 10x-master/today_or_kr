"use client";

import { useEffect, useState } from "react";
import { ImageOff, ShoppingCart, Sprout, Wrench } from "lucide-react";
import type { LinkPickProduct, ProductType } from "@/types/commerce";

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  coupang_affiliate: "쿠팡 제휴",
  local_specialty: "지역 특산물",
  welfare_device: "복지기기",
};

const PRODUCT_TYPE_ICONS: Record<ProductType, typeof ShoppingCart> = {
  coupang_affiliate: ShoppingCart,
  local_specialty: Sprout,
  welfare_device: Wrench,
};

const FILTERS: Array<{ label: string; value: ProductType | "all" }> = [
  { label: "전체", value: "all" },
  { label: "쿠팡 제휴", value: "coupang_affiliate" },
  { label: "지역 특산물", value: "local_specialty" },
  { label: "복지기기", value: "welfare_device" },
];

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

function ProductThumbnail({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
        <ImageOff className="h-5 w-5 text-zinc-300" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="h-14 w-14 shrink-0 rounded-xl object-cover"
    />
  );
}

function ProductCard({ product }: { product: LinkPickProduct }) {
  const [revealed, setRevealed] = useState(product.priceDisplayMode === "show_price");
  const Icon = PRODUCT_TYPE_ICONS[product.productType];

  function openAffiliateLink() {
    window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  }

  function handleButtonClick() {
    setRevealed(true);
    openAffiliateLink();
  }

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm">
      <ProductThumbnail src={product.thumbnail} alt={product.title} />

      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
          <Icon className="h-3 w-3" />
          {PRODUCT_TYPE_LABELS[product.productType]}
        </span>
        <h4 className="mt-1 truncate text-sm font-bold text-zinc-900">{product.title}</h4>

        {revealed && product.price !== undefined ? (
          <p className="mt-1 text-base font-extrabold text-zinc-900">{won(product.price)}</p>
        ) : (
          !revealed && (
            <button
              type="button"
              onClick={handleButtonClick}
              className="mt-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
            >
              {product.priceDisplayMode === "lowest_price_btn" ? "최저가 보러가기" : "특가 확인"}
            </button>
          )
        )}

        {product.donationPerSale !== undefined && (
          <p className="mt-1 text-[11px] font-medium text-rose-500">
            구매 시 {won(product.donationPerSale)} 착한소비 적립
          </p>
        )}
      </div>

      {revealed && (
        <button
          type="button"
          onClick={openAffiliateLink}
          className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-zinc-900 hover:bg-amber-300"
        >
          구매하기
        </button>
      )}
    </article>
  );
}

export default function StoreTab() {
  const [products, setProducts] = useState<LinkPickProduct[]>([]);
  const [filter, setFilter] = useState<ProductType | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = filter === "all" ? "" : `?type=${filter}`;
    fetch(`/api/commerce/products${query}`)
      .then((res) => res.json())
      .then((data: { products: LinkPickProduct[] }) => setProducts(data.products))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>}

      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
