"use client";

import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookmarkPlus,
  Coins,
} from "lucide-react";
import type { LinkPickProduct } from "@/types/commerce";
import { mockLinkPickProducts } from "@/lib/db/mockSeed";

interface LinkBlockToggleProps {
  products?: LinkPickProduct[];
  defaultExpanded?: boolean;
  onSaveToNote?: (product: LinkPickProduct) => void;
  className?: string;
}

export default function LinkBlockToggle({
  products = mockLinkPickProducts,
  defaultExpanded = true,
  onSaveToNote,
  className = "",
}: LinkBlockToggleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleCopyLink = async (e: React.MouseEvent, product: LinkPickProduct) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(product.affiliateUrl);
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveNote = (e: React.MouseEvent, product: LinkPickProduct) => {
    e.stopPropagation();
    setSavedId(product.id);
    onSaveToNote?.(product);
    setTimeout(() => setSavedId(null), 2000);
  };

  const getProductTypeMeta = (type: LinkPickProduct["productType"]) => {
    switch (type) {
      case "local_specialty":
        return {
          icon: "🐟",
          label: "로컬 특산물",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          commissionText: "수수료 15% 적립",
        };
      case "welfare_device":
        return {
          icon: "🩺",
          label: "복지/가전",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
          commissionText: "기부금 5,000원 적립",
        };
      case "coupang_affiliate":
      default:
        return {
          icon: "⚡",
          label: "파트너스 제휴",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          commissionText: "활동 수수료 지급",
        };
    }
  };

  return (
    <div className={`w-full rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs ${className}`}>
      {/* 헤더 토글 바 */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-900">
                인포크형 제휴 링크픽 블록
              </span>
              <span className="rounded-full bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 border border-rose-200/80">
                추천 제휴 {products.length}선
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              링크 공유 시 서포터즈 적립금 최대 15% 정산
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            {isExpanded ? "접기" : "펼치기"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* 인포크링크형 모듈러 블록 목록 */}
      {isExpanded && (
        <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
          {products.map((product) => {
            const meta = getProductTypeMeta(product.productType);
            const isCopied = copiedId === product.id;
            const isSaved = savedId === product.id;

            return (
              <div
                key={product.id}
                className="group relative flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 p-2.5 transition-all hover:border-amber-300 hover:shadow-xs active:bg-slate-100/60"
              >
                {/* 좌측 메타 & 상품명 */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-lg shadow-2xs">
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${meta.badgeColor}`}
                      >
                        {meta.label}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                        <Coins className="h-2.5 w-2.5" />
                        {meta.commissionText}
                      </span>
                    </div>

                    <h4 className="mt-0.5 text-xs font-bold text-slate-900 truncate group-hover:text-amber-950">
                      {product.title}
                    </h4>

                    {product.price && (
                      <span className="text-[11px] font-black text-rose-600">
                        {product.price.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </div>

                {/* 우측 인포크링크 액션 버튼군 */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* 링크 복사 */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(e, product)}
                    className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2 text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                    title="제휴 링크 복사"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline">복사</span>
                      </>
                    )}
                  </button>

                  {/* t.note 담기 */}
                  {onSaveToNote && (
                    <button
                      type="button"
                      onClick={(e) => handleSaveNote(e, product)}
                      className="flex h-7 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2 text-[10px] font-bold text-indigo-700 transition-colors cursor-pointer"
                      title="t.note 일정/메모에 담기"
                    >
                      {isSaved ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <BookmarkPlus className="h-3 w-3 text-indigo-600" />
                      )}
                      <span className="hidden sm:inline">담기</span>
                    </button>
                  )}

                  {/* 즉시 이동 */}
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 text-[10px] font-bold shadow-2xs transition-colors"
                    title="제휴 상품 바로가기"
                  >
                    <span>바로가기</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
