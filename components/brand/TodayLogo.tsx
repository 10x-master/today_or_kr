/**
 * Today. 공식 브랜드 로고 시스템 (SSOT 제11장 로고 규격)
 *
 * - 메인 워드마크: 라운드 볼드 'today' + 블루 닷(#3B82F6)
 * - 서브 패밀리: 't.' 심볼(라운드 t + 블루 닷) + 접미사(Note/Sign/Check/Sales/Home)
 * - 테마 자동 대응: light(흰 배경 전용, 검정 글씨) / dark(검정 배경 전용, 흰 글씨) — 블루 닷은 항상 동일
 * - 앱 아이콘: 블루 스퀴클 안의 화이트 소문자 't' + 하단 우측 오렌지 체크(✓) 뱃지
 *
 * 블루 닷은 글꼴의 마침표 글리프 대신 항상 <circle> SVG로 그려 두 테마·모든 브라우저에서
 * 동일한 원형·동일한 색상(#3B82F6)을 보장한다.
 */

export type LogoTheme = "light" | "dark";
export type SubBrandSuffix = "Note" | "Sign" | "Check" | "Sales" | "Home";
export type LogoSize = "sm" | "md" | "lg";

export const TODAY_BRAND_DOT_COLOR = "#3B82F6";

const SIZE_MAP: Record<LogoSize, { text: string; dot: number }> = {
  sm: { text: "text-sm", dot: 4 },
  md: { text: "text-base", dot: 5 },
  lg: { text: "text-2xl", dot: 7 },
};

function TodayDot({ size, className = "" }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="5" fill={TODAY_BRAND_DOT_COLOR} />
    </svg>
  );
}

/** 1. 't.' 심볼 마크 — 단독 또는 서브 브랜드 접미사(Note/Sign/Check/Sales/Home)와 결합 */
interface TMarkProps {
  theme?: LogoTheme;
  suffix?: SubBrandSuffix;
  size?: LogoSize;
  className?: string;
}

export function TMark({ theme = "light", suffix, size = "md", className = "" }: TMarkProps) {
  const fg = theme === "dark" ? "text-white" : "text-slate-900";
  const cfg = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight ${cfg.text} ${fg} select-none ${className}`}
    >
      <span>t</span>
      <TodayDot size={cfg.dot} className="relative -top-[0.12em] mx-px" />
      {suffix && <span className="font-bold">{suffix}</span>}
    </span>
  );
}

/** 2. 'today.' 풀 워드마크 */
interface TodayWordmarkProps {
  theme?: LogoTheme;
  size?: LogoSize;
  className?: string;
}

export function TodayWordmark({ theme = "light", size = "md", className = "" }: TodayWordmarkProps) {
  const fg = theme === "dark" ? "text-white" : "text-slate-900";
  const cfg = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight ${cfg.text} ${fg} select-none ${className}`}
    >
      <span>today</span>
      <TodayDot size={cfg.dot} className="relative -top-[0.12em] ml-px" />
    </span>
  );
}

/** 3. 앱 아이콘 — 둥근 스퀴클(Squircle) 안의 공식 소문자 't' 심볼 + 오렌지 체크 뱃지 */
interface TodayAppIconProps {
  theme?: LogoTheme;
  size?: number;
  className?: string;
  /** 하단 체크 뱃지 색상 — 미지정 시 시그니처 오렌지(#F97316) */
  dotColor?: string;
}

export function TodayAppIcon({ theme = "light", size = 28, className = "", dotColor }: TodayAppIconProps) {
  const bg = theme === "dark" ? "#FFFFFF" : "#3B82F6";
  const fg = theme === "dark" ? "#3B82F6" : "#FFFFFF";
  const badgeColor = dotColor || "#F97316";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="today. 앱 아이콘"
    >
      {/* 스퀴클: rx가 큰 라운드 사각형으로 근사 */}
      <rect x="0" y="0" width="32" height="32" rx="11" fill={bg} />
      {/* 중앙 소문자 't' — 공식 CI 시그니처 심볼 */}
      <text
        x="12.5"
        y="23"
        fontFamily="var(--font-geist-sans), ui-rounded, system-ui, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill={fg}
        textAnchor="middle"
      >
        t
      </text>
      {/* 하단 우측 오렌지 체크(완료/인증) 뱃지 */}
      <circle cx="24" cy="23.5" r="6" fill={badgeColor} stroke={bg} strokeWidth="1.6" />
      <path
        d="M 21.1 23.5 L 23.2 25.5 L 27.2 20.9"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
