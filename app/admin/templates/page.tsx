import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Store,
  Building,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import TemplateSelector from "@/components/template/TemplateSelector";

export const metadata: Metadata = {
  title: "t.홈페이지 템플릿 저장 & 선택 엔진 | Today Link Admin",
  description:
    "아파트링크 B2B 공정입찰, 제조사 특판, 동네 매장, 프로 세일즈 4대 표준 템플릿 복제 및 모듈 On/Off 샵인샵 엔진",
};

export default function AdminTemplatesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 헤더 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UnifiedHomeReturnAnchor currentModule="템플릿 엔진" />
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-extrabold text-slate-900">Today Admin</span>
              <span className="text-slate-400">/</span>
              <span className="text-blue-600 font-bold">t.홈페이지 템플릿 센터</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/aptlink"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>🏢 아파트링크 포털 보기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 상단 인트로 타이틀 */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>t.홈페이지 샵인샵(Shop-in-Shop) 다중 복제 아키텍처</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            t.홈페이지 템플릿 저장 & 선택 엔진
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
            아파트링크의 완성된 구조(`APTLINK_B2B`)를 포함한 4대 표준 프리셋 중 하나를 선택하고,
            상호명과 모듈(음성 Q&A, t.sign 전자계약, 시공 카탈로그, 구글 캘린더 등)을 On/Off 하여
            신규 입점사용 독립 홈페이지(today.or.kr/shop/[id])를 즉시 발행하세요.
          </p>
        </div>

        {/* 템플릿 셀렉터 및 커스텀 생성기 컴포넌트 */}
        <TemplateSelector />
      </main>

      {/* 순백 심플 푸터 */}
      <footer className="border-t border-slate-100 py-8 px-4 text-center text-xs text-slate-400">
        <p>© 2026 Today Link (today.or.kr). t.홈페이지 샵인샵 템플릿 엔진</p>
      </footer>
    </div>
  );
}
