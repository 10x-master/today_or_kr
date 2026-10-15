"use client";

import { ChevronDown } from "lucide-react";

interface TodayWordmarkProps {
  /** 행정동명 (예: 방학동, 돌산읍, 역삼동) */
  dong: string;
  /** 시·군·구 (예: 도봉구, 여수시) — 동명 위에 작게 표기 */
  gugun?: string;
  /** 동네 변경 시트 열기 */
  onClick: () => void;
  size?: "md" | "lg";
  className?: string;
}

/**
 * 「행정동명⌄ 투데이●」 워드마크.
 * 파란 동네 이름과 꺾쇠(동네 바꾸기)가 '투데이' 글자에 바짝 붙어,
 * "방학동 투데이." / "역삼동 투데이." 처럼 하나의 브랜드 이름으로 읽히도록 구성했습니다.
 */
export default function TodayWordmark({
  dong,
  gugun,
  onClick,
  size = "md",
  className = "",
}: TodayWordmarkProps) {
  const isLg = size === "lg";
  const name = dong || "내 동네";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`현재 동네 ${gugun ? `${gugun} ` : ""}${name}. 눌러서 동네 변경`}
      className={`group flex min-w-0 flex-col items-start text-left leading-none focus:outline-hidden active:opacity-70 transition-opacity ${className}`}
    >
      {gugun && (
        <span
          className={`mb-0.5 ml-0.5 font-bold tracking-tight text-blue-500/80 ${
            isLg ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {gugun}
        </span>
      )}

      <span className="flex min-w-0 items-center">
        {/* 동네 이름 (푸른색) */}
        <span
          className={`truncate font-black text-blue-600 transition-colors group-hover:text-blue-700 ${
            isLg ? "max-w-[11rem] text-[1.75rem]" : "max-w-[7.5rem] text-[1.4rem]"
          }`}
          style={{ letterSpacing: "-0.06em" }}
        >
          {name}
        </span>

        {/* 동네 바꾸기 꺾쇠 — 이름과 겹치듯 바짝 붙임 */}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={3.25}
          className={`-ml-0.5 -mr-1 shrink-0 text-blue-600 transition-transform group-hover:translate-y-0.5 ${
            isLg ? "h-5 w-5" : "h-4 w-4"
          }`}
        />

        {/* 투데이 (진한 남색) + 큰 파란 점 */}
        <span
          className={`shrink-0 font-black text-slate-900 ${
            isLg ? "text-[1.75rem]" : "text-[1.4rem]"
          }`}
          style={{ letterSpacing: "-0.07em" }}
        >
          투데이
        </span>
        <span
          aria-hidden="true"
          className={`ml-[3px] shrink-0 self-end rounded-full bg-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] ${
            isLg ? "mb-[5px] h-[0.7rem] w-[0.7rem]" : "mb-[4px] h-[0.58rem] w-[0.58rem]"
          }`}
        />
      </span>
    </button>
  );
}
