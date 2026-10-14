import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Building,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Users,
  ChevronRight,
  Layers,
  PhoneCall,
  ExternalLink,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import AptAuditHero from "@/components/aptlink/AptAuditHero";
import RepairEduVoiceRoom from "@/components/aptlink/RepairEduVoiceRoom";

export const metadata: Metadata = {
  title: "아파트링크(AptLink) | 내 아파트 입찰 공사비 적정성 진단 & 장기수선 실무스쿨",
  description:
    "CERA-PMS 비공개 입찰 분석 리포트, 1초 입주민 인증 락인, 국토교통부·LH 2025 장기수선계획 65개 법정 가이드라인 음성 AI 질의응답",
};

export default function AptLinkPortalPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. 최상단 순백 슬림 헤더 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* 좌측: 전사 통합 복귀 앵커 + 아파트링크 엠블럼 */}
          <div className="flex items-center gap-3">
            <UnifiedHomeReturnAnchor currentModule="아파트링크" />
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                🏢
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                  아파트링크
                </span>
                <span className="ml-1.5 text-[11px] font-semibold text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100/60 hidden sm:inline">
                  AptLink Portal
                </span>
              </div>
            </div>
          </div>

          {/* 중앙 네비게이션 앵커 (데스크톱) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#audit-section" className="hover:text-blue-600 transition-colors">
              공사비 적정가 진단
            </a>
            <a href="#voice-edu-section" className="hover:text-blue-600 transition-colors">
              장기수선 실무스쿨 (음성AI)
            </a>
            <a href="#shop-in-shop-section" className="hover:text-blue-600 transition-colors">
              샵인샵 템플릿 복제
            </a>
          </nav>

          {/* 우측 관리자/입점 CTA */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin/templates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>템플릿 센터</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 전국 아파트 실시간 지표 팩트 롤링 배너 */}
      <section className="bg-slate-50/70 border-b border-slate-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs text-slate-600">
                전국 아파트 K-apt 입찰 공사비 평균 편차율{" "}
                <strong className="text-red-600 font-bold">+32.4%</strong> (표준가 대비 초과)
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-xs text-slate-600">
                장기수선충당금 과소 적립 단지 비율{" "}
                <strong className="text-amber-600 font-bold">74.2%</strong> (추가 분담금 리스크)
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
              <p className="text-xs text-slate-600">
                CERA-PMS 정밀 입찰 진단 완료{" "}
                <strong className="text-blue-600 font-bold">1,842개 단지</strong> (빅데이터 검증)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 킬러 섹션: 내 아파트 입찰 공사비 적정한가? (AptAuditHero) */}
      <section id="audit-section">
        <AptAuditHero />
      </section>

      {/* 4. 순백 미니멀 3대 핵심 가치 그리드 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            CERA-PMS Professional Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            아파트 입찰의 불투명성을 걷어내는 3단계 안전장치
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            관리비 낭비를 차단하고 입대의와 관리사무소의 법적 리스크를 원천 예방합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 카드 1 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              1. 빅데이터 표준 단가 역산출
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              전국 16,000개 단지의 K-apt 실거래 낙찰가와 LH 표준품셈을 역산출하여 0.1% 단위로
              표준 시공 단가를 제시합니다. 담합 및 고가 발주 정황을 1초 만에 감지합니다.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
              <span>표준 대비 편차율 자동 산출</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 카드 2 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              2. 국토부 법정 65개 항목 준수
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              전면수선 최소단위를 위반한 편법 부분수선 처리, 수선유지비 전용을 사전에 차단합니다.
              지자체 감사 시 가장 빈번한 2,000만원 과태료 처분을 빈틈없이 방어합니다.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
              <span>3년 정기검토 법률 요건 검증</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 카드 3 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              3. 비대면 t.sign 공정 입찰 계약
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              시공업체 선정 후 계약서 날인, 하자보수보증금 예치, 주민 10인 공구 청원까지 모바일
              t.sign 전자약정으로 1초 만에 법적 효력을 갖춘 계약을 체결합니다.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <span>블록체인 타임스탬프 공증</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. 장기수선 실무스쿨 (Web Speech 무료 음성 질의응답) */}
      <section id="voice-edu-section">
        <RepairEduVoiceRoom />
      </section>

      {/* 6. 샵인샵 템플릿 복제 CTA 배너 */}
      <section
        id="shop-in-shop-section"
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100"
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>t.홈페이지 샵인샵 재사용 템플릿 엔진</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              아파트링크와 동일한 공정입찰 포털을
              <br />
              내 사업에도 1초 만에 그대로 복제하세요
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
              관리사무소, 장기수선 컨설팅사, 엘리베이터/도색 시공사부터 제조사 B2B 특판까지!
              표준 템플릿을 선택하고 음성 Q&A, 전자계약, 카탈로그 모듈을 On/Off 하여 고유 웹사이트를
              즉시 발행할 수 있습니다.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/templates"
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <span>4대 표준 템플릿 저장 & 선택 엔진 열기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop/aptlink-official"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>공식 템플릿 라이브 미리보기</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 순백 통일 푸터 & Today 플랫폼 공식 주력 서비스 공인 명시 */}
      <footer className="bg-white border-t border-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 공식 주력 서비스 공인 배지 */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/70 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                T.
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  아파트링크(AptLink)는 Today 통합 플랫폼의 공식 주력 서비스입니다.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  국토교통부 공동주택관리정보시스템(K-apt) 및 CERA-PMS 기술자문 기준을 엄격히 준수합니다.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-end sm:self-auto inline-flex items-center gap-1"
            >
              <span>Today 포털 홈 바로가기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-500">
            <div>
              <h5 className="font-bold text-slate-900 mb-2">아파트링크 (AptLink)</h5>
              <p className="text-[11px] leading-relaxed">
                공동주택 입찰 공사비 적정성 진단, 주민 인증 락인 게이트 및 장기수선계획 실무 가이드라인 연구원
              </p>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-2">공정입찰 진단 서비스</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>CERA-PMS 비공개 분석 리포트</li>
                <li>1초 입주민 영수증 인증 게이트</li>
                <li>승강기·옥상방수 적정 공사비 산정</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-2">장기수선 실무스쿨</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>국토부·LH 2025 개정 65개 법정 항목</li>
                <li>비용 0원 Web Speech 음성 질의응답</li>
                <li>지자체 감사 과태료 방어 솔루션</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-2">고객지원 및 기술자문</h5>
              <p className="text-[11px] leading-relaxed">
                문의: support@today.or.kr
                <br />
                직통: 02-1588-0000 (평일 09:00 - 18:00)
                <br />
                서울특별시 노원구 동일로 1414
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>© 2026 Today Link (today.or.kr). All rights reserved. AptLink™ is an official property of Today.</p>
            <p>개인정보처리방침 · 서비스이용약관 · 적격심사기준 고지</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
