"use client";

import Link from "next/link";
import { TodayAppIcon } from "@/components/brand/TodayLogo";

interface CoreSolution {
  label: string;
  href: string;
}

const CORE_SOLUTIONS: CoreSolution[] = [
  { label: "다이어리", href: "/t-diary" },
  { label: "노트", href: "/workspace" },
  { label: "싸인", href: "/t-sign" },
  { label: "홈페이지", href: "/biz/sme-transform/catalog" },
  { label: "환급", href: "/t-refund" },
  { label: "아파트링크", href: "/aptlink" },
  { label: "링크픽", href: "/p/ambassador-01" },
  { label: "지원단", href: "/biz/sme-transform/catalog" },
];

/**
 * 8대 핵심 솔루션 아이콘 그리드 — 모바일 4x2(2줄) / PC 8x1(1줄).
 * 가로 스크롤 없이 한 화면에서 전체 솔루션을 조망할 수 있는 상단 전면 배치용.
 * 모든 셀은 공식 't.' 앱 아이콘(순백 배경 + 검정 t + 블루닷)을 동일하게 공유하며,
 * 솔루션 구분은 하단 한글 라벨만으로 한다 (아이콘 색상 분기 없음 — 단일 브랜드 아이덴티티 유지).
 */
export default function CoreSolutionsGrid({ className = "" }: { className?: string }) {
  return (
    <section aria-label="8대 핵심 솔루션" className={`px-3 pt-3 pb-1 bg-white ${className}`}>
      <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
        {CORE_SOLUTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-1 py-3 text-center transition-all hover:border-blue-200 hover:bg-blue-50/60 active:scale-95"
          >
            <TodayAppIcon theme="light" size={32} className="transition-transform group-hover:scale-110" />
            <span className="w-full truncate text-[11px] font-bold text-slate-700 group-hover:text-blue-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
