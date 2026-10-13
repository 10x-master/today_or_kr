"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import type { PlatformProduct } from "@/types/officialNotice";

interface HeroProductRollingProps {
  products?: PlatformProduct[];
  onSelectProduct?: (product: PlatformProduct) => void;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  INTERIOR: { label: "프리미엄 인테리어·주방", color: "bg-amber-500/90 text-white" },
  ELECTRONICS: { label: "스마트케어·레이더", color: "bg-blue-600/90 text-white" },
  COMMERCE: { label: "로컬 커머스·특판", color: "bg-emerald-600/90 text-white" },
  LIVING: { label: "주거 편의·라이프", color: "bg-purple-600/90 text-white" },
};

export default function HeroProductRolling({
  products = [],
  onSelectProduct,
}: HeroProductRollingProps) {
  const [items, setItems] = useState<PlatformProduct[]>(products);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PlatformProduct | null>(null);

  // 공급 상담 간이 신청 모달 상태
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactOrg, setContactOrg] = useState("");
  const [contactMemo, setContactMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 전달받은 products가 없으면 API에서 가져옴
  useEffect(() => {
    if (products.length > 0) {
      setItems(products);
      return;
    }

    async function fetchHeroProducts() {
      try {
        const res = await fetch("/api/platform-products?hero_only=true");
        if (res.ok) {
          const json = await res.json();
          if (json.products && json.products.length > 0) {
            setItems(json.products);
          }
        }
      } catch (err) {
        console.error("Hero products fetch error:", err);
      }
    }

    fetchHeroProducts();
  }, [products]);

  // 자동 롤링 타이머 (5초)
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isPaused]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const catConfig = CATEGORY_MAP[current.category] || {
    label: current.category,
    color: "bg-slate-700 text-white",
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleCardClick = (product: PlatformProduct) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      setSelectedProduct(product);
      setIsSubmitted(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) {
      alert("연락처를 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    // 모의 전송 딜레이
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <>
      <section
        className="relative mb-4 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl ring-1 ring-slate-900/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* 제품 슬라이드 카드 */}
        <div
          onClick={() => handleCardClick(current)}
          className="group relative cursor-pointer block min-h-[200px] sm:min-h-[220px]"
        >
          {/* 배경 이미지 & 그라디언트 오버레이 */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.main_image_url}
              alt={current.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* 어두운 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent sm:block hidden" />
          </div>

          {/* 슬라이드 텍스트 컨텐츠 */}
          <div className="relative z-10 flex min-h-[200px] sm:min-h-[220px] flex-col justify-between p-4 sm:p-5">
            {/* 상단 뱃지 영역 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-md ${catConfig.color}`}
                >
                  <Sparkles className="h-3 w-3" />
                  {catConfig.label}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-slate-200 backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  협회 공식 취급제품
                </span>
              </div>

              {/* 우측: [취급제품 전체보기 ↗] 및 페이지네이션 카운터 */}
              <div className="flex items-center gap-1.5">
                <Link
                  href="/products"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md transition-colors"
                  title="취급제품 쇼룸으로 이동"
                >
                  <span>취급제품 전체보기 ↗</span>
                </Link>

                <div className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-slate-300 backdrop-blur-md">
                  {currentIndex + 1} / {items.length}
                </div>
              </div>
            </div>

            {/* 하단 타이틀 & 스펙 정보 */}
            <div className="mt-4">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                {current.title}
              </h2>
              {current.subtitle && (
                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-300">
                  {current.subtitle}
                </p>
              )}

              {/* 가격/공급 정책 및 CTA 버튼 */}
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                <div className="flex items-center gap-2">
                  {current.price_info && (
                    <span className="text-xs font-bold text-amber-300">
                      🏷️ {current.price_info}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-300 group-hover:translate-x-0.5 transition-transform">
                  <span>상세 및 공급상담</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 좌우 이동 화살표 (2개 이상일 때) */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="이전 제품"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="다음 제품"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* 인디케이터 점선 */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`슬라이드 ${idx + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 제품 상세 & B2B/B2G 공급 상담 바텀시트 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 헤더 이미지 & 닫기 버튼 */}
            <div className="relative h-44 w-full bg-slate-900 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedProduct.main_image_url}
                alt={selectedProduct.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="inline-block rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white mb-1">
                  {CATEGORY_MAP[selectedProduct.category]?.label || selectedProduct.category}
                </span>
                <h3 className="text-lg font-black text-white line-clamp-1">
                  {selectedProduct.title}
                </h3>
                {selectedProduct.subtitle && (
                  <p className="text-xs text-slate-200 line-clamp-1">
                    {selectedProduct.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* 바디 스크롤 영역 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* 핵심 사양 요약 */}
              {selectedProduct.spec_summary && (
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>핵심 사양 및 특장점</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {selectedProduct.spec_summary}
                  </p>
                </div>
              )}

              {/* 공급 및 가격 정보 */}
              {selectedProduct.price_info && (
                <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-100 flex items-start gap-2.5">
                  <span className="text-base">🏷️</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">공급 및 특판 정책</h4>
                    <p className="text-xs font-medium text-amber-800 mt-0.5">
                      {selectedProduct.price_info}
                    </p>
                  </div>
                </div>
              )}

              {/* 공급 상담 및 B2B 문의 섹션 */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-indigo-600" />
                    B2B / B2G 공급 상담 접수
                  </h4>
                  {selectedProduct.contact_phone && (
                    <a
                      href={`tel:${selectedProduct.contact_phone}`}
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      전화 직통: {selectedProduct.contact_phone}
                    </a>
                  )}
                </div>

                {isSubmitted ? (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-800">
                      상담 신청이 정상 접수되었습니다!
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      전문 담당 오퍼레이터가 1영업일 이내에 연락드립니다.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="성함 / 담당자명"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="연락처 (010-0000-0000)"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="소속 단지명 또는 업체명 (예: 상계주공5단지 / 인테리어사)"
                      value={contactOrg}
                      onChange={(e) => setContactOrg(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="문의 내용 (예: 세대 공동구매, 특판 단가 문의 등)"
                      value={contactMemo}
                      onChange={(e) => setContactMemo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmitting ? "접수 중..." : "공급 상담 및 자료 신청하기"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* 하단 닫기 바 */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
