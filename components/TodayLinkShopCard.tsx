"use client";

import { useState } from "react";
import { ShoppingCart, Truck, Tag, Percent } from "lucide-react";

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export type PriceDisplayMode = "live" | "lowest-button" | "discount-button";

export type TodayLinkShopItem = {
  title: string;
  vendor: "쿠팡 제휴" | "산지 직송";
  price: number;
  originalPrice?: number;
  priceDisplayMode: PriceDisplayMode;
};

export default function TodayLinkShopCard({
  title,
  vendor,
  price,
  originalPrice,
  priceDisplayMode,
}: TodayLinkShopItem) {
  const [revealed, setRevealed] = useState(priceDisplayMode === "live");
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isCoupang = vendor === "쿠팡 제휴";

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
          isCoupang ? "bg-sky-50" : "bg-emerald-50"
        }`}
      >
        {isCoupang ? (
          <ShoppingCart className="h-6 w-6 text-sky-500" />
        ) : (
          <Truck className="h-6 w-6 text-emerald-500" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isCoupang ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <Tag className="h-3 w-3" />
          {vendor}
        </span>
        <h4 className="mt-1 truncate text-sm font-bold text-zinc-900">{title}</h4>

        {revealed ? (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-extrabold text-zinc-900">{won(price)}</span>
            {originalPrice && originalPrice > price && (
              <>
                <span className="text-xs text-zinc-400 line-through">{won(originalPrice)}</span>
                <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500">
                  <Percent className="h-3 w-3" />
                  {discountPercent}%
                </span>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
          >
            {priceDisplayMode === "lowest-button" ? "최저가 보기" : "특별 할인가 보기"}
          </button>
        )}
      </div>

      <button
        type="button"
        className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-zinc-900 hover:bg-amber-300"
      >
        구매하기
      </button>
    </article>
  );
}
