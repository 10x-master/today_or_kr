import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "@/app/page";

export const instant = false;

export function generateStaticParams() {
  return [
    { dong: "상계동" },
    { dong: "중계동" },
    { dong: "하계동" },
    { dong: "월계동" },
    { dong: "공릉동" },
    { dong: "돌산읍" },
  ];
}

/**
 * 한글 행정동 URL 파라미터 인코딩 깨짐 방어 헬퍼
 * URL 인코딩 및 중복 인코딩(%25 등)을 안전하게 원본 한글명으로 복원
 */
function safeDecodeDong(rawDong: string): string {
  if (!rawDong) return "";
  let decoded = rawDong;
  try {
    decoded = decodeURIComponent(rawDong);
    if (decoded.includes("%")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {}
    }
  } catch {
    decoded = rawDong;
  }
  return decoded.trim();
}

interface DongPageProps {
  params: Promise<{ dong: string }>;
}

export async function generateMetadata({
  params,
}: DongPageProps): Promise<Metadata> {
  const { dong } = await params;
  const decodedDong = safeDecodeDong(dong);

  return {
    title: `${decodedDong} 로컬 팩트 피드 | Today.`,
    description: `${decodedDong}의 공식 행정 고시, 국토부 교통 인프라, 아파트 단지 소식을 실시간으로 확인하세요.`,
    openGraph: {
      title: `Today - ${decodedDong} 로컬 팩트 피드`,
      description: `${decodedDong} 일원의 검증된 행정·인프라 팩트 피드`,
    },
  };
}

export default async function DongPage({ params }: DongPageProps) {
  const { dong } = await params;
  const decodedDong = safeDecodeDong(dong);

  // 정적 예약어 또는 리소스 경로 예외 처리
  if (["favicon.ico", "robots.txt", "sitemap.xml", "icons"].includes(decodedDong)) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-xl flex items-center justify-center text-xs text-slate-400">
          동네 소식을 불러오는 중...
        </div>
      }
    >
      <Home initialDong={decodedDong} />
    </Suspense>
  );
}
