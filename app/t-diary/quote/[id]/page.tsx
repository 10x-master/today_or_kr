"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock, CreditCard, FileSignature, Loader2 } from "lucide-react";
import { TodayWordmark } from "@/components/brand/TodayLogo";
import type { QuoteRequest, QuoteStatus } from "@/types/quote";

const STATUS_BADGE: Record<QuoteStatus, { label: string; cls: string }> = {
  REQUESTED: { label: "견적 검토중", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  QUOTED: { label: "견적서 도착", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SIGNED: { label: "전자계약 완료", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  PAID: { label: "결제/세금계산서 요청됨", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatWon(n: number) {
  return `${(n || 0).toLocaleString("ko-KR")}원`;
}

function QuoteConfirmContent() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const loadQuote = () => {
    fetch(`/api/t-diary/quotes/${id}`)
      .then((res) => res.json())
      .then((data) => setQuote(data.quote || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const res = await fetch(`/api/t-diary/quotes/${id}/sign`, { method: "POST" });
      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
        showToast("✍️ 모바일 간편 서명으로 전자계약이 체결되었습니다.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handlePaymentRequest = async () => {
    setIsPaying(true);
    try {
      const res = await fetch(`/api/t-diary/quotes/${id}/payment`, { method: "POST" });
      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
        showToast("💳 결제 및 전자세금계산서 발행을 요청했습니다.");
      }
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-5 text-center">
        <p className="text-xs text-slate-400">견적 요청을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const badge = STATUS_BADGE[quote.status];

  return (
    <div className="min-h-screen w-full bg-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        <div className="flex items-center justify-center">
          <TodayWordmark theme="light" size="md" />
        </div>

        <h1 className="mt-4 text-center text-lg font-black text-slate-900">견적서 확인</h1>
        <div className="mt-2 flex justify-center">
          <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {quote.status === "REQUESTED" ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <Clock className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">담당자가 견적 내역을 확인 중입니다. 확정되면 알림톡으로 안내드립니다.</p>
          </div>
        ) : (
          <>
            {/* 세부 내역 */}
            <div className="mt-5 rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-900">{quote.company_name}</p>
              <p className="text-[11px] text-slate-400">{quote.contact_name} · {quote.contact_phone}</p>

              <div className="mt-3 space-y-1.5">
                {quote.items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate">
                      [{item.product_code}] {item.product_name} × {item.quantity.toLocaleString("ko-KR")}부
                    </span>
                    <span className="shrink-0 font-bold text-slate-900">{formatWon(item.quantity * item.unit_price)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>상품 합계</span>
                  <span>{formatWon(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>박비</span>
                  <span>{formatWon(quote.packaging_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>배송비</span>
                  <span>{formatWon(quote.shipping_fee)}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-xs font-bold text-slate-500">최종 공급가</span>
                <span className="text-base font-black text-blue-700">{formatWon(quote.final_amount)}</span>
              </div>

              {quote.admin_memo && (
                <p className="mt-2 rounded-lg bg-slate-50/70 p-2 text-[10px] text-slate-500">{quote.admin_memo}</p>
              )}
            </div>

            {/* 액션 */}
            <div className="mt-4 space-y-2">
              {quote.status === "QUOTED" && (
                <button
                  type="button"
                  onClick={handleSign}
                  disabled={isSigning}
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                  ✍️ 싸인 전자계약 체결하기
                </button>
              )}
              {quote.status === "SIGNED" && (
                <button
                  type="button"
                  onClick={handlePaymentRequest}
                  disabled={isPaying}
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  💳 결제 / 전자세금계산서 발행 요청
                </button>
              )}
              {quote.status === "PAID" && (
                <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  결제 및 세금계산서 발행이 요청되었습니다
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function QuoteConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      }
    >
      <QuoteConfirmContent />
    </Suspense>
  );
}
