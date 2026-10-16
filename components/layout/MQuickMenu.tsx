"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface MQuickMenuItem {
  label: string;
  href: string;
}

const TIER_1: MQuickMenuItem[] = [
  { label: "📅 t.다이어리", href: "/t-diary" },
  { label: "🎙 t.노트", href: "/workspace" },
];

const TIER_2: MQuickMenuItem[] = [
  { label: "🏠 t.홈페이지", href: "/biz/sme-transform/catalog" },
  { label: "✍️ t.싸인", href: "/t-sign" },
];

const TIER_3: MQuickMenuItem[] = [
  { label: "💳 t.환급", href: "/t-refund" },
  { label: "🏢 아파트 링크", href: "/aptlink" },
  { label: "🔗 링크픽", href: "/p/ambassador-01" },
];

export default function MQuickMenu({ className = "" }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 호버 가능 기기(마우스)인지 감지 — 터치 기기에서는 호버 오픈을 비활성화해
  // 탭 시 mouseenter(열림)+click(토글로 닫힘)이 동시에 발생해 메뉴가 안 열리는 문제를 방지
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 외부 터치/클릭 시 자동 닫힘 (모바일 터치 포함)
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (!canHover) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!canHover) return;
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const renderTier = (items: MQuickMenuItem[]) => (
    <div className="grid grid-cols-2 gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsOpen(false)}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors truncate"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
        title="t.솔루션 퀵메뉴"
        aria-label="t.솔루션 퀵메뉴"
        aria-expanded={isOpen}
      >
        M
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {renderTier(TIER_1)}
          <div className="my-1.5 border-t border-slate-100" />
          {renderTier(TIER_2)}
          <div className="my-1.5 border-t border-slate-100" />
          {renderTier(TIER_3)}
        </div>
      )}
    </div>
  );
}
