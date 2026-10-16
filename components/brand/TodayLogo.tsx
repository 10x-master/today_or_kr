/**
 * today. 공식 브랜드 로고 시스템 (SSOT 제11장 로고 규격)
 *
 * - 본체 컬러: Deep Black/Charcoal (#1E232E)
 * - 포인트 블루닷 컬러: Vivid Electric Blue (#2066FF)
 * - 메인 워드마크: 라운드 볼드 'today' + 블루 닷
 * - 서브 패밀리: 't.' 심볼(라운드 t + 블루 닷) + 접미사(Note/Sign/Check/Sales/Home)
 * - 테마 자동 대응: light(흰 배경 전용, 차콜 글씨) / dark(검정 배경 전용, 흰 글씨) — 블루 닷은 항상 동일
 * - 웹아이콘(파비콘/PWA): 순백 배경(#FFFFFF) + 중앙 차콜 소문자 't' + 블루닷 단독 배치
 *
 * 블루 닷은 글꼴의 마침표 글리프 대신 항상 <circle> SVG(TodayDotSymbol)로 그려 두 테마·모든
 * 브라우저에서 동일한 원형·동일한 색상(#2066FF)을 보장하며, 직경은 본문 글자 높이(fontSize)
 * 대비 약 0.3배 비율로 고정한다 (DOT_DIAMETER_RATIO).
 */

export type LogoTheme = "light" | "dark";
export type SubBrandSuffix = "Note" | "Sign" | "Check" | "Sales" | "Home";
export type LogoSize = "sm" | "md" | "lg";

/** 본체 컬러 — Deep Black/Charcoal */
export const TODAY_BRAND_BODY_COLOR = "#1E232E";
/** 포인트 블루닷 컬러 — Vivid Electric Blue */
export const TODAY_BRAND_DOT_COLOR = "#2066FF";
/** 블루닷 직경 / 본문 글자 높이(fontSize) 비율 — 원본 로고 비례 고정값 */
export const DOT_DIAMETER_RATIO = 0.3;

const SIZE_MAP: Record<LogoSize, { text: string; fontSizePx: number; dot: number }> = {
  sm: { text: "text-sm", fontSizePx: 14, dot: Math.round(14 * DOT_DIAMETER_RATIO) },
  md: { text: "text-base", fontSizePx: 16, dot: Math.round(16 * DOT_DIAMETER_RATIO) },
  lg: { text: "text-2xl", fontSizePx: 24, dot: Math.round(24 * DOT_DIAMETER_RATIO) },
};

/** 공용 블루닷 벡터 심볼 — today. 브랜드의 포인트 닷을 어디서든 동일하게 재사용 */
export function TodayDotSymbol({
  size,
  color = TODAY_BRAND_DOT_COLOR,
  className = "",
}: {
  size: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="5" fill={color} />
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
  const fg = theme === "dark" ? "text-white" : "text-[#1E232E]";
  const cfg = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight ${cfg.text} ${fg} select-none ${className}`}
    >
      <span>t</span>
      <TodayDotSymbol size={cfg.dot} className="relative -top-[0.12em] mx-px" />
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
  const fg = theme === "dark" ? "text-white" : "text-[#1E232E]";
  const cfg = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-baseline font-black tracking-tight ${cfg.text} ${fg} select-none ${className}`}
    >
      <span>today</span>
      <TodayDotSymbol size={cfg.dot} className="relative -top-[0.12em] ml-px" />
    </span>
  );
}

/** 3. 앱 아이콘 — 순백 배경(#FFFFFF) 중앙에 차콜 소문자 't' + 원본 비례 블루닷 단독 배치 */
interface TodayAppIconProps {
  theme?: LogoTheme;
  size?: number;
  className?: string;
  /** 블루닷 색상 — 미지정 시 시그니처 블루(#2066FF) */
  dotColor?: string;
}

export function TodayAppIcon({ theme = "light", size = 28, className = "", dotColor }: TodayAppIconProps) {
  const bg = theme === "dark" ? TODAY_BRAND_BODY_COLOR : "#FFFFFF";
  const fg = theme === "dark" ? "#FFFFFF" : TODAY_BRAND_BODY_COLOR;
  const dot = dotColor || TODAY_BRAND_DOT_COLOR;
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
      {/* 블루닷 — 't' 높이(20) 대비 약 0.3배 비율 */}
      <circle cx="21.2" cy="19.4" r={(20 * DOT_DIAMETER_RATIO) / 2} fill={dot} />
    </svg>
  );
}
