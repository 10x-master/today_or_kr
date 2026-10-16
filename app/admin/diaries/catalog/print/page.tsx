"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { DealerCatalogBranding } from "@/types/quote";

interface PrintProduct {
  product_code: string;
  name: string;
  spec: string | null;
  sell_price: number;
  category: string;
}

interface PrintPayload {
  brandName: string;
  branding: DealerCatalogBranding;
  products: PrintProduct[];
}

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function DealerCatalogPrintPage() {
  const [payload, setPayload] = useState<PrintPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dealer_catalog_print_payload");
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  if (!payload) {
    return <div className="p-10 text-center text-sm text-slate-400">인쇄할 카탈로그 데이터가 없습니다. 관리자 콘솔에서 다시 생성해주세요.</div>;
  }

  const showPrice = payload.branding.price_display === "show";
  const grouped = new Map<string, PrintProduct[]>();
  for (const p of payload.products) {
    const key = p.category || "기타";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-3">
        <p className="text-xs font-bold text-slate-500">웹 카탈로그 인쇄 모드 — A4 규격</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          인쇄하기
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-8 py-10">
        {/* 표지 헤더 */}
        <div className="text-center">
          {payload.branding.dealer_logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.branding.dealer_logo_url} alt={payload.branding.dealer_name} className="mx-auto h-16 object-contain" />
          )}
          <h1 className="mt-3 text-2xl font-black text-slate-900">{payload.branding.dealer_name}</h1>
          {payload.branding.cover_headline && <p className="mt-1 text-sm text-slate-500">{payload.branding.cover_headline}</p>}
          <p className="mt-2 text-[11px] text-slate-400">
            {[payload.branding.contact_name, payload.branding.contact_phone, payload.branding.contact_email, payload.branding.address]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category} className="mb-6 break-inside-avoid">
              <h2 className="text-sm font-black text-blue-600">{category}</h2>
              <table className="mt-2 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-500">
                    <th className="py-1.5 pr-2 font-bold">코드</th>
                    <th className="py-1.5 pr-2 font-bold">품목명</th>
                    <th className="py-1.5 pr-2 font-bold">스펙</th>
                    {showPrice && <th className="py-1.5 text-right font-bold">권장소비자가</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_code} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-500">{item.product_code}</td>
                      <td className="py-1.5 pr-2 font-bold text-slate-800">{item.name}</td>
                      <td className="py-1.5 pr-2 text-slate-400">{item.spec}</td>
                      {showPrice && <td className="py-1.5 text-right font-bold text-slate-800">{formatWon(item.sell_price)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {!showPrice && <p className="mt-2 text-[11px] text-slate-400">가격은 견적 요청 시 별도 안내드립니다.</p>}

        {payload.branding.footer_note && (
          <div className="mt-8 border-t border-slate-200 pt-4">
            <p className="text-xs font-bold text-slate-700">안내사항</p>
            <p className="mt-1 text-[11px] text-slate-500 whitespace-pre-line">{payload.branding.footer_note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
