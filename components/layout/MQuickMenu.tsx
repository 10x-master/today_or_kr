"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { TMark } from "@/components/brand/TodayLogo";
import TodayServicesModal from "@/components/layout/TodayServicesModal";

interface MQuickMenuItem {
  emoji: string;
  name: string;
  /** true면 이름 앞에 't.' 패밀리 심볼(TMark)을 렌더링 */
  isFamily?: boolean;
  href: string;
}

const TIER_1: MQuickMenuItem[] = [
  { emoji: "📅", name: "다이어리", isFamily: true, href: "/t-diary" },
  { emoji: "🎙", name: "노트", isFamily: true, href: "/workspace" },
];

const TIER_2: MQuickMenuItem[] = [
  { emoji: "🏠", name: "홈페이지", isFamily: true, href: "/biz/sme-transform/catalog" },
  { emoji: "✍️", name: "싸인", isFamily: true, href: "/t-sign" },
];

const TIER_3: MQuickMenuItem[] = [
  { emoji: "💳", name: "환급", isFamily: true, href: "/t-refund" },
  { emoji: "🏢", name: "아파트 링크", href: "/aptlink" },
  { emoji: "🔗", name: "링크픽", href: "/p/ambassador-01" },
];

export default function MQuickMenu({
  className = "",
  variant = "icon",
}: {
  className?: string;
  /** "icon": 기존 둥근 M 뱃지 / "text": "투데이 서비스 ▾" 텍스트 트리거 (PC GNB용) */
  variant?: "icon" | "text";
}) {
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
    // "text" variant는 전체화면 모달을 열므로 호버만으로 열리지 않고 클릭으로만 연다
    if (variant !== "icon" || !canHover) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (variant !== "icon" || !canHover) return;
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const renderTier = (items: MQuickMenuItem[]) => (
    <div className="grid grid-cols-2 gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors truncate"
        >
          <span className="shrink-0">{item.emoji}</span>
          {item.isFamily && <TMark size="sm" className="shrink-0" />}
          <span className="truncate">{item.name}</span>
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
      {variant === "text" ? (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="투데이 서비스 전체보기"
          aria-label="투데이 서비스 전체보기"
          aria-expanded={isOpen}
        >
          <span>투데이 서비스</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      ) : (
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
      )}

      {variant === "text" ? (
        <TodayServicesModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : (
        isOpen && (
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
        )
      )}
    </div>
  );
}
