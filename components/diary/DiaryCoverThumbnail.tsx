"use client";

import { darkenHex } from "@/lib/diary/catalogUtils";

interface DiaryCoverThumbnailProps {
  colorHex: string;
  /** 투톤 디자인용 보조 색상 (예: 3단 투톤 핑크) */
  secondaryColorHex?: string;
  category: string;
  size?: number;
  className?: string;
  /** cover: 표지 썸네일(기본) / spread: 내지 펼침(포켓·괘선) 미리보기 */
  variant?: "cover" | "spread";
}

/**
 * 실사 제품 사진이 없는 상품을 위한 컬러·바인딩 스타일 기반 생성 커버 썸네일.
 * 카테고리별 제본 방식(양장 리본/스프링 링/시스템 바인더 구멍/한정특가 뱃지)을 시각적으로 반영한다.
 */
export function DiaryCoverThumbnail({
  colorHex,
  secondaryColorHex,
  category,
  size = 96,
  className = "",
  variant = "cover",
}: DiaryCoverThumbnailProps) {
  const w = size;
  const h = Math.round(size * 1.3);
  const dark = darkenHex(colorHex, 0.35);
  const gradId = `grad-${colorHex.replace("#", "")}-${category}-${variant}`;

  if (variant === "spread") {
    const pw = w;
    const ph = Math.round(w * 0.72);
    return (
      <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} className={className} role="img" aria-label={`${category} 다이어리 내지 펼침 미리보기`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAFAF9" />
            <stop offset="100%" stopColor="#F1F1EF" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width={pw - 2} height={ph - 2} rx="4" fill={`url(#${gradId})`} stroke="#E5E7EB" />
        <rect x={pw / 2 - 1} y="1" width="2" height={ph - 2} fill="#D4D4D8" />
        {/* 좌/우 페이지 괘선 (256p 내지) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i}>
            <rect x={10} y={14 + i * ((ph - 28) / 7)} width={pw / 2 - 20} height="2" rx="1" fill="#D4D4D8" />
            <rect x={pw / 2 + 10} y={14 + i * ((ph - 28) / 7)} width={pw / 2 - 20} height="2" rx="1" fill="#D4D4D8" />
          </g>
        ))}
        {/* 내측 라인 포켓 */}
        <rect x={pw / 2 + 10} y={ph - 22} width={pw / 2 - 20} height="14" rx="3" fill="none" stroke={colorHex} strokeWidth="1.4" strokeDasharray="3 2" />
      </svg>
    );
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label={`${category} 다이어리 커버 미리보기`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorHex} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>

      {/* 커버 베이스 */}
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="6" fill={`url(#${gradId})`} />

      {/* 투톤 (예: 3단 투톤 핑크) */}
      {secondaryColorHex && (
        <rect x="2" y={h / 2} width={w - 4} height={h / 2 - 2} rx="6" fill={secondaryColorHex} opacity="0.92" />
      )}

      {/* 책등 그림자 */}
      <rect x="2" y="2" width="6" height={h - 4} fill="black" opacity="0.18" />

      {category.includes("양장") && (
        <>
          <rect x="9" y="9" width={w - 18} height={h - 18} rx="3" fill="none" stroke="#F2D98A" strokeWidth="1" opacity="0.55" />
          <rect x={w - 20} y="0" width="7" height="22" fill="#B91C1C" opacity="0.85" />
        </>
      )}

      {category.includes("스프링") && (
        <g opacity="0.9">
          {Array.from({ length: 7 }).map((_, i) => (
            <circle key={i} cx="9" cy={10 + i * ((h - 20) / 6)} r="2.6" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.6" />
          ))}
        </g>
      )}

      {category.includes("시스템") && (
        <g opacity="0.85">
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx="11" cy={14 + i * ((h - 28) / 5)} r="1.6" fill="#1F2937" />
          ))}
        </g>
      )}

      {category.includes("한정특가") && (
        <g>
          <polygon points={`${w - 1},0 ${w - 1},26 ${w - 27},0`} fill="#FACC15" />
          <text x={w - 9} y="12" fontSize="6" fontWeight="900" fill="#78350F" textAnchor="end">
            특가
          </text>
        </g>
      )}
    </svg>
  );
}
