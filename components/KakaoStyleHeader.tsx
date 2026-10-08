"use client";

import { useState } from "react";
import Link from "next/link";
import { HandHeart, Menu, X } from "lucide-react";

const REGIONS = ["전체", "노원", "도봉", "의정부"] as const;
type Region = (typeof REGIONS)[number];

const NAV_LINKS = [
  { label: "모금함", href: "#funding" },
  { label: "소모임", href: "#events" },
  { label: "회원가입", href: "#membership" },
  { label: "협회 소개", href: "#about" },
];

export default function KakaoStyleHeader({
  onRegionChange,
}: {
  onRegionChange?: (region: Region) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSelectRegion(region: Region) {
    setSelectedRegion(region);
    onRegionChange?.(region);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
            <HandHeart className="h-4.5 w-4.5 text-zinc-900" />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Today<span className="text-amber-500">.or.kr</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 md:hidden"
          aria-label="메뉴 열기"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-3 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => handleSelectRegion(region)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedRegion === region
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
