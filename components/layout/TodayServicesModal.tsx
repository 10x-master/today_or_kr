"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { TodayAppIcon } from "@/components/brand/TodayLogo";

interface TodayServiceTile {
  label: string;
  href: string;
}

/**
 * [투데이 서비스 ▾] 모달 전용 5대 핵심 서비스 — '아파트링크'/'링크픽'은 별도 전용 채널로
 * 운영되므로 이 모달에서는 완전히 제외한다.
 */
const TODAY_SERVICES: TodayServiceTile[] = [
  { label: "다이어리", href: "/t-diary" },
  { label: "홈페이지", href: "/" },
  { label: "환급", href: "/t-refund" },
  { label: "노트", href: "/t-note" },
  { label: "싸인", href: "/t-sign" },
];

export default function TodayServicesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="투데이 서비스"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-base font-black text-slate-900 tracking-tight">투데이 서비스</h2>
        <p className="mt-0.5 text-xs text-slate-400">필요한 서비스를 바로 열어보세요.</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {TODAY_SERVICES.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onClose}
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 transition-all hover:border-blue-200 hover:bg-blue-50/60 active:scale-95"
            >
              <TodayAppIcon theme="light" size={44} className="shadow-sm transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
