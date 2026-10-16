"use client";

import Link from "next/link";
import { Mic, Package, CalendarDays, FileSignature, type LucideIcon } from "lucide-react";
import { TMark } from "@/components/brand/TodayLogo";

interface TopSolution {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  tint: string;
  /** true면 제목 앞에 't.' 패밀리 심볼(TMark)을 렌더링 */
  isFamily?: boolean;
}

const TOP_SOLUTIONS: TopSolution[] = [
  {
    title: "노트 작성",
    desc: "음성 2초 캡처로 바로 기록",
    href: "/workspace",
    icon: Mic,
    tint: "bg-indigo-50 text-indigo-600",
    isFamily: true,
  },
  {
    title: "B2B 카탈로그·제안서",
    desc: "딜러 맞춤 카탈로그 PDF 발송",
    href: "/biz/apt-sanggye14/catalog",
    icon: Package,
    tint: "bg-blue-50 text-blue-600",
  },
  {
    title: "스마트 다이어리",
    desc: "우리 동네 행사·일정 한눈에",
    href: "/t-diary",
    icon: CalendarDays,
    tint: "bg-amber-50 text-amber-600",
    isFamily: true,
  },
  {
    title: "전자계약",
    desc: "본인인증 전자서명 1분 완료",
    href: "/t-sign",
    icon: FileSignature,
    tint: "bg-emerald-50 text-emerald-600",
    isFamily: true,
  },
];

/**
 * 핵심 기능 카드 랙(Top Solutions Grid) — 방문자가 첫눈에 "무엇을 하는 곳인지" 알 수 있도록
 * 4대 핵심 솔루션을 뉴닉형 모듈러 카드(아이콘 + 제목 + 한 줄 설명)로 상단에 명확히 배치한다.
 */
export default function TopSolutionsGrid({ className = "" }: { className?: string }) {
  return (
    <section aria-label="핵심 솔루션" className={`px-3 pt-3 pb-1 bg-white ${className}`}>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {TOP_SOLUTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.title}
              href={item.href}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-blue-200 hover:shadow-sm active:scale-[0.98]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tint}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-slate-900 group-hover:text-blue-700">
                {item.isFamily && <TMark size="sm" className="shrink-0" />}
                {item.title}
              </span>
              <span className="text-[11px] leading-snug text-slate-400 font-normal">
                {item.desc}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
