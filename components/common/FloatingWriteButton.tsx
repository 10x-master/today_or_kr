"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine } from "lucide-react";

// 투데이 시그니처 블루닷과 동일한 컬러. components/brand/TodayLogo.tsx의 TODAY_BRAND_DOT_COLOR와 맞춘다.
const BRAND_BLUE = "#2066FF";

// 스크롤이 멈춘 뒤 이 시간(ms)이 지나야 다시 [텍스트+아이콘] 형태로 펼쳐진다.
const SCROLL_IDLE_DELAY_MS = 900;
// 이 값보다 작은 스크롤 변화는 무시한다 (모바일 바운스/소수점 스크롤 노이즈 방지).
const SCROLL_DELTA_THRESHOLD_PX = 4;

interface FloatingWriteButtonProps {
  /** 펼쳐진 상태에서 아이콘 옆에 보이는 문구 */
  label?: string;
  onClick: () => void;
  className?: string;
}

/**
 * 당근마켓 스타일 스마트 플로팅 글쓰기 버튼.
 * 정지 상태: [연필 아이콘 + 텍스트] 와이드 필 형태.
 * 스크롤 중: 하얀 연필 아이콘만 남는 슬림한 원형으로 축소.
 */
export default function FloatingWriteButton({
  label = "글쓰기",
  onClick,
  className = "",
}: FloatingWriteButtonProps) {
  const [collapsed, setCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      const currentY = window.scrollY;
      const delta = Math.abs(currentY - lastScrollYRef.current);
      lastScrollYRef.current = currentY;

      if (delta > SCROLL_DELTA_THRESHOLD_PX) {
        setCollapsed(true);
      }

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setCollapsed(false), SCROLL_IDLE_DELAY_MS);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ backgroundColor: BRAND_BLUE }}
      className={`fixed bottom-20 right-4 z-30 flex h-13 items-center gap-2 rounded-full text-white shadow-lg transition-all duration-300 ease-out hover:brightness-110 sm:right-6 ${
        collapsed ? "w-13 justify-center px-0" : "px-5"
      } ${className}`}
    >
      <PenLine className="h-5 w-5 shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 ${
          collapsed ? "max-w-0 opacity-0" : "max-w-[80px] opacity-100"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
