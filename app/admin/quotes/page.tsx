"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Copy, Download, Send, ShieldCheck } from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import type { QuoteItem, QuoteRequest, QuoteStatus } from "@/types/quote";

const STATUS_BADGE: Record<QuoteStatus, { label: string; cls: string }> = {
  REQUESTED: { label: "요청 접수", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  QUOTED: { label: "견적서 발송됨", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SIGNED: { label: "전자계약 완료", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  PAID: { label: "결제/세금계산서 요청됨", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatWon(n: number) {
  return `${(n || 0).toLocaleString("ko-KR")}원`;
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [forceAdminMode, setForceAdminMode] = useState(true);

  // 견적 확정 편집 상태
  const [editItems, setEditItems] = useState<QuoteItem[]>([]);
  const [packagingFee, setPackagingFee] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [adminMemo, setAdminMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const loadQuotes = () => {
    setLoading(true);
    fetch("/api/t-diary/quotes")
      .then((res) => res.json())
      .then((data) => setQuotes(data.quotes || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const selected = quotes.find((q) => q.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    setEditItems(selected.items);
    setPackagingFee(selected.packaging_fee);
    setShippingFee(selected.shipping_fee);
    setAdminMemo(selected.admin_memo || "");
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = useMemo(() => editItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [editItems]);
  const finalAmount = subtotal + packagingFee + shippingFee;

  const updateItemPrice = (idx: number, price: number) => {
    setEditItems((prev) => prev.map((item, i) => (i === idx ? { ...item, unit_price: price } : item)));
  };

  const handleSaveQuote = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/t-diary/quotes/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editItems, packaging_fee: packagingFee, shipping_fee: shippingFee, admin_memo: adminMemo }),
      });
      const data = await res.json();
      if (data.quote) {
        setQuotes((prev) => prev.map((q) => (q.id === selected.id ? data.quote : q)));
        showToast("견적 내역이 저장되었습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAlimtalk = async () => {
    if (!selected) return;
    await handleSaveQuote();
    setIsSending(true);
    try {
      const res = await fetch(`/api/t-diary/quotes/${selected.id}/alimtalk`, { method: "POST" });
      const data = await res.json();
      if (data.quote) {
        setQuotes((prev) => prev.map((q) => (q.id === selected.id ? data.quote : q)));
        showToast("💬 카카오 알림톡으로 견적서를 발송했습니다 (데모).");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyCustomerLink = () => {
    if (!selected) return;
    const url = `${window.location.origin}/t-diary/quote/${selected.id}`;
    navigator.clipboard?.writeText(url);
    showToast("고객 확인 링크를 복사했습니다.");
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <UnifiedHomeReturnAnchor currentModule="admin-quotes" />
          <button
            type="button"
            onClick={() => setForceAdminMode(!forceAdminMode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              forceAdminMode ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            관리자 권한 {forceAdminMode ? "ON" : "OFF"}
          </button>
        </div>

        <h1 className="mt-4 text-xl font-black text-slate-900 tracking-tight">B2B 견적서 발송 콘솔</h1>
        <p className="mt-0.5 text-xs text-slate-400">접수된 견적 요청을 확인하고 단가·박비·배송비를 확정해 견적서를 발송합니다.</p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* 견적 요청 목록 */}
          <div className="space-y-1.5">
            {loading ? (
              <p className="text-xs text-slate-300">불러오는 중...</p>
            ) : quotes.length === 0 ? (
              <p className="text-xs text-slate-300">접수된 견적 요청이 없습니다.</p>
            ) : (
              quotes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedId(q.id)}
                  className={`block w-full rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    selectedId === q.id ? "border-blue-300 bg-blue-50/50" : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{q.company_name}</p>
                  <p className="text-[10px] text-slate-400">{q.contact_name} · {q.items.length}개 상품</p>
                  <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.2 text-[9px] font-bold ${STATUS_BADGE[q.status].cls}`}>
                    {STATUS_BADGE[q.status].label}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* 상세 / 견적 확정 */}
          {selected ? (
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-sm font-black text-slate-900">{selected.company_name}</h2>
                  <p className="text-[11px] text-slate-400">
                    {selected.contact_name} · {selected.contact_phone}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[selected.status].cls}`}>
                  {STATUS_BADGE[selected.status].label}
                </span>
              </div>

              {selected.print_options && (
                <p className="mt-2 rounded-xl bg-slate-50/70 p-2 text-[11px] text-slate-600">{selected.print_options}</p>
              )}

              {/* 상품별 단가 조정 */}
              <div className="mt-3 space-y-1.5">
                {editItems.map((item, idx) => (
                  <div key={item.product_id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">
                        [{item.product_code}] {item.product_name}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.quantity.toLocaleString("ko-KR")}부</p>
                    </div>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItemPrice(idx, Number(e.target.value))}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="w-20 shrink-0 text-right text-xs font-bold text-slate-700">
                      {formatWon(item.quantity * item.unit_price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* 박비/배송비 */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">박비(포장비)</label>
                  <input
                    type="number"
                    value={packagingFee}
                    onChange={(e) => setPackagingFee(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">배송비</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={2}
                placeholder="비고 (관리자 메모)"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
              />

              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2">
                <span className="text-xs font-bold text-slate-500">최종 공급가</span>
                <span className="text-base font-black text-slate-900">{formatWon(finalAmount)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  저장
                </button>
                <a
                  href={`/api/t-diary/quotes/${selected.id}/pdf`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  📄 견적서 PDF 다운로드
                </a>
                <button
                  type="button"
                  onClick={handleSendAlimtalk}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE500] px-3 py-2 text-xs font-bold text-[#191919] hover:bg-[#FDD800] disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  💬 카카오 알림톡 견적서 푸시 발송
                </button>
                <button
                  type="button"
                  onClick={handleCopyCustomerLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  고객 확인 링크 복사
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-300">좌측에서 견적 요청을 선택해주세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
