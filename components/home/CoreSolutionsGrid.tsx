"use client";

import Link from "next/link";
import { TodayAppIcon } from "@/components/brand/TodayLogo";

interface CoreSolution {
  label: string;
  href: string;
  /** 시그니처 T 배지의 포인트 닷 색상 — 솔루션별 구분용 */
  dotColor: string;
}

const CORE_SOLUTIONS: CoreSolution[] = [
  { label: "T.다이어리", href: "/t-diary", dotColor: "#3B82F6" },
  { label: "T.노트", href: "/workspace", dotColor: "#F59E0B" },
  { label: "T.싸인", href: "/t-sign", dotColor: "#6366F1" },
  { label: "T.홈페이지", href: "/biz/apt-sanggye14", dotColor: "#10B981" },
  { label: "T.환급", href: "/t-refund", dotColor: "#F43F5E" },
  { label: "아파트링크", href: "/aptlink", dotColor: "#0EA5E9" },
  { label: "링크픽", href: "/p/ambassador-01", dotColor: "#8B5CF6" },
  { label: "지원단", href: "/t-diary?brand=sme-transform", dotColor: "#14B8A6" },
];

/**
 * 8대 핵심 솔루션 아이콘 그리드 — 모바일 4x2(2줄) / PC 8x1(1줄).
 * 가로 스크롤 없이 한 화면에서 전체 솔루션을 조망할 수 있는 상단 전면 배치용.
 * 모든 셀은 시그니처 'T.' 배지를 공유하고, 포인트 닷 색상으로만 솔루션을 구분한다.
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
            <TodayAppIcon
              theme="light"
              size={32}
              dotColor={item.dotColor}
              className="transition-transform group-hover:scale-110"
            />
            <span className="w-full truncate text-[11px] font-bold text-slate-700 group-hover:text-blue-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
