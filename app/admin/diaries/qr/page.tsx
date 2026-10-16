"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { TodayAppIcon, TodayWordmark } from "@/components/brand/TodayLogo";
import type { DiaryBrand } from "@/types/diary";

const SITE_ORIGIN = "https://today.or.kr";

export default function DiaryQrConsolePage() {
  const [diaries, setDiaries] = useState<DiaryBrand[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/t-diary/admin/providers")
      .then((res) => res.json())
      .then((data) => {
        const list: DiaryBrand[] = data.providers || [];
        setDiaries(list);
        if (list.length > 0) setSelectedSlug(list[0].brand_slug);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = diaries.find((d) => d.brand_slug === selectedSlug) || null;

  const targetUrl = useMemo(
    () => (selectedSlug ? `${SITE_ORIGIN}/t-diary?brand=${encodeURIComponent(selectedSlug)}` : ""),
    [selectedSlug]
  );

  const previewSrc = selectedSlug ? `/api/t-diary/qr?brand=${encodeURIComponent(selectedSlug)}&format=png&size=400` : "";
  const svgDownloadHref = selectedSlug ? `/api/t-diary/qr?brand=${encodeURIComponent(selectedSlug)}&format=svg&download=1` : "";
  const pngDownloadHref = selectedSlug
    ? `/api/t-diary/qr?brand=${encodeURIComponent(selectedSlug)}&format=png&size=1200&download=1`
    : "";

  const handleCopyUrl = () => {
    if (!targetUrl) return;
    navigator.clipboard?.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <UnifiedHomeReturnAnchor currentModule="admin-diaries-qr" />

        <h1 className="mt-4 flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
          <QrCode className="h-5 w-5 text-blue-600" />
          B2B 인쇄 QR 발급 콘솔
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          오프라인 인쇄 다이어리·탁상달력에 부착할 today.or.kr/t-diary 연결 QR을 발급합니다.
        </p>

        {loading ? (
          <p className="mt-10 text-center text-xs text-slate-300">불러오는 중...</p>
        ) : (
          <>
            {/* 엔티티 선택 */}
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
            >
              {diaries.map((d) => (
                <option key={d.brand_slug} value={d.brand_slug}>
                  {d.brand_name} ({d.brand_slug})
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* 좌측: QR 미리보기 및 다운로드 */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h2 className="text-xs font-black text-slate-900">QR 코드</h2>

                  <div className="mt-3 flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewSrc} alt={`${selected.brand_name} QR`} className="h-48 w-48" />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <input
                      readOnly
                      value={targetUrl}
                      className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 cursor-pointer"
                      aria-label="URL 복사"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={svgDownloadHref}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      SVG (벡터)
                    </a>
                    <a
                      href={pngDownloadHref}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PNG (300DPI)
                    </a>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    PNG는 1200×1200px(300DPI 기준 10.16cm×10.16cm 정사각 인쇄 규격)로 내려받습니다.
                  </p>
                </div>

                {/* 우측: 인쇄용 스티커/내지 프리뷰 */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h2 className="text-xs font-black text-slate-900">인쇄용 스티커 프리뷰</h2>
                  <p className="mt-0.5 text-[10px] text-slate-400">5cm × 6cm 스티커 규격 예시</p>

                  <div className="mt-3 flex items-center justify-center rounded-2xl bg-slate-50/70 p-6">
                    <div className="w-40 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 text-center shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewSrc} alt="" className="mx-auto h-24 w-24" />
                      <p className="mt-2 truncate text-[11px] font-bold text-slate-900">{selected.brand_name}</p>
                      <div className="mt-1.5 flex items-center justify-center gap-1">
                        <TodayAppIcon theme="light" size={14} />
                        <TodayWordmark theme="light" size="sm" className="text-[10px]" />
                      </div>
                      <p className="mt-0.5 text-[8px] text-slate-400">스캔하고 t.다이어리 시작하기</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 text-center">
                    점선은 재단선(컷 라인) 표시이며 실제 인쇄물에는 포함되지 않습니다.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
