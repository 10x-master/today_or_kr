"use client";

import Link from "next/link";

interface CoreSolution {
  label: string;
  icon: string;
  href: string;
}

const CORE_SOLUTIONS: CoreSolution[] = [
  { label: "t.다이어리", icon: "📅", href: "/t-diary" },
  { label: "t.노트", icon: "🎙", href: "/workspace" },
  { label: "t.싸인", icon: "✍️", href: "/t-sign" },
  { label: "t.홈피", icon: "🏠", href: "/biz/apt-sanggye14" },
  { label: "t.refund", icon: "💳", href: "/t-refund" },
  { label: "아파트링크", icon: "🏢", href: "/aptlink" },
  { label: "링크픽", icon: "🔗", href: "/p/ambassador-01" },
  { label: "지원단", icon: "🤝", href: "/t-diary?brand=sme-transform" },
];

/**
 * 8대 핵심 솔루션 아이콘 그리드 — 모바일 4x2(2줄) / PC 8x1(1줄).
 * 가로 스크롤 없이 한 화면에서 전체 솔루션을 조망할 수 있는 상단 전면 배치용.
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
            <span className="text-2xl leading-none transition-transform group-hover:scale-110">
              {item.icon}
            </span>
            <span className="w-full truncate text-[11px] font-bold text-slate-700 group-hover:text-blue-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
