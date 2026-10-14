import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "@/app/page";
import THomepageView from "@/components/homepage/THomepageView";
import { MOCK_TENANTS, DEFAULT_TENANT } from "@/lib/homepageSeed";

export const instant = false;

const KNOWN_DONGS = ["상계동", "중계동", "하계동", "월계동", "공릉동", "돌산읍"];

export function generateStaticParams() {
  return [
    // 기존 행정동 피드 호환 경로
    { tenant_code: "상계동" },
    { tenant_code: "중계동" },
    { tenant_code: "하계동" },
    { tenant_code: "월계동" },
    { tenant_code: "공릉동" },
    { tenant_code: "돌산읍" },
    // 티홈페이지(t.homepage) 멀티테넌트 쇼룸 경로
    { tenant_code: "hwaro-jungja" },
    { tenant_code: "apex-pangyo" },
    { tenant_code: "smile-yeoksam" },
    { tenant_code: "brewing-sanggye" },
    { tenant_code: "apt-sanggye14" },
  ];
}

/**
 * URL 파라미터 안전 디코딩 헬퍼
 */
function safeDecode(raw: string): string {
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
    if (decoded.includes("%")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {}
    }
  } catch {
    decoded = raw;
  }
  return decoded.trim();
}

/**
 * 행정동 피드 여부 판정 (동, 읍, 면 또는 알려진 동네 목록)
 */
function isDongSlug(slug: string): boolean {
  if (KNOWN_DONGS.includes(slug)) return true;
  if ((slug.endsWith("동") || slug.endsWith("읍") || slug.endsWith("면")) && !MOCK_TENANTS[slug]) {
    return true;
  }
  return false;
}

interface TenantPageProps {
  params: Promise<{ tenant_code: string }>;
}

export async function generateMetadata({
  params,
}: TenantPageProps): Promise<Metadata> {
  const { tenant_code } = await params;
  const decoded = safeDecode(tenant_code);

  if (isDongSlug(decoded)) {
    return {
      title: `${decoded} 로컬 팩트 피드 | Today.`,
      description: `${decoded}의 공식 행정 고시, 국토부 교통 인프라, 아파트 단지 소식을 실시간으로 확인하세요.`,
      openGraph: {
        title: `Today - ${decoded} 로컬 팩트 피드`,
        description: `${decoded} 일원의 검증된 행정·인프라 팩트 피드`,
      },
    };
  }

  const tenant = MOCK_TENANTS[decoded] || DEFAULT_TENANT;
  return {
    title: `${tenant.name} (${tenant.category_name}) | 티홈페이지(t.homepage)`,
    description: `${tenant.short_intro} - 9:16 쇼룸, t.check 출퇴근, 링크픽 상품 및 실시간 구인 공고`,
    openGraph: {
      title: `${tenant.name} | 티홈페이지 공식 쇼룸`,
      description: tenant.short_intro,
    },
  };
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant_code } = await params;
  const decoded = safeDecode(tenant_code);

  // 정적 예약어 또는 리소스 경로 예외 처리
  if (["favicon.ico", "robots.txt", "sitemap.xml", "icons"].includes(decoded)) {
    return null;
  }

  // 1) 행정동 피드 라우트 처리 (동네 팩트 피드 렌더링)
  if (isDongSlug(decoded)) {
    return (
      <Suspense
        fallback={
          <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-xl flex items-center justify-center text-xs text-slate-400">
            동네 소식을 불러오는 중...
          </div>
        }
      >
        <Home initialDong={decoded} />
      </Suspense>
    );
  }

  // 2) 티홈페이지(t.homepage) 멀티테넌트 쇼룸 라우트 처리
  const tenant = MOCK_TENANTS[decoded] || DEFAULT_TENANT;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-400">
          티홈페이지를 불러오는 중...
        </div>
      }
    >
      <THomepageView tenantCode={decoded} initialTenant={tenant} />
    </Suspense>
  );
}
