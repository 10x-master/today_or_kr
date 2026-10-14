"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileCheck2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Users,
  Smartphone,
  Share2,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import {
  APTLINK_DEFAULT_SHOP_CONFIG,
  TEMPLATE_PRESETS,
  type ShopInShopConfig,
  type TemplateModuleKey,
} from "@/types/template";
import RepairEduVoiceRoom from "@/components/aptlink/RepairEduVoiceRoom";

const STORAGE_KEY = "today_shop_in_shop_configs";

function ShopInShopContent() {
  const params = useParams();
  const router = useRouter();
  const shopId = (params?.id as string) || "aptlink-official";

  const [shopConfig, setShopConfig] = useState<ShopInShopConfig>(APTLINK_DEFAULT_SHOP_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<string | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractSuccess, setContractSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState("2026-10-20");
  const [bookingTime, setBookingTime] = useState("14:00");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [petitionCount, setPetitionCount] = useState(7);
  const [hasPetitioned, setHasPetitioned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ShopInShopConfig[] = JSON.parse(stored);
        const found = parsed.find((s) => s.id === shopId);
        if (found) {
          setShopConfig(found);
          setIsLoading(false);
          return;
        }
      }

      // 기본 공식 템플릿 매칭
      if (shopId === "aptlink-official") {
        setShopConfig(APTLINK_DEFAULT_SHOP_CONFIG);
      } else {
        // 프리셋 기본값 복원 폴백
        const fallbackConfig: ShopInShopConfig = {
          ...APTLINK_DEFAULT_SHOP_CONFIG,
          id: shopId,
          shopName: `${shopId.toUpperCase()} 파트너 공식 샵`,
          tagline: "Today 플랫폼 공인 샵인샵 독립 포털",
        };
        setShopConfig(fallbackConfig);
      }
    } catch (e) {
      console.warn("Failed to load shop configuration:", e);
      setShopConfig(APTLINK_DEFAULT_SHOP_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const isEnabled = (key: TemplateModuleKey) => {
    return !!shopConfig.enabledModules?.[key];
  };

  const handleContractSign = () => {
    setContractSuccess(true);
    setTimeout(() => {
      setContractSuccess(false);
      setIsContractModalOpen(false);
      alert("t.sign 비대면 전자계약이 체결되었습니다. (계약서 고유 해시 블록체인 등록 완료)");
    }, 1500);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const handlePetitionClick = () => {
    if (hasPetitioned) return;
    setPetitionCount((prev) => prev + 1);
    setHasPetitioned(true);
  };

  const primaryColor = shopConfig.primaryColor || "#2563EB";

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. 상단 순백 슬림 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UnifiedHomeReturnAnchor currentModule={shopConfig.shopName} />
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {shopConfig.logoText.slice(0, 2)}
              </div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                {shopConfig.shopName}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 hidden sm:inline">
                {shopConfig.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/templates"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>템플릿 재설정</span>
            </Link>
            <a
              href={`tel:${shopConfig.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>상담 문의</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. 상점 메인 히어로 배너 (순백 미니멀 & 포인트) */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 mb-4">
          <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          <span>Today Link 공인 샵인샵 독립 파트너</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {shopConfig.tagline}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          {shopConfig.description}
        </p>

        {/* 상점 정보 칩 (대표자 / 연락처 / 위치) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>대표: {shopConfig.representativeName}</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{shopConfig.phone}</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{shopConfig.roadAddress}</span>
          </span>
        </div>

        {/* 히어로 CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isEnabled("TSIGN_CONTRACT") && (
            <button
              type="button"
              onClick={() => setIsContractModalOpen(true)}
              className="px-5 py-3 rounded-xl text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>t.sign 1초 비대면 약정서 체결</span>
            </button>
          )}

          {isEnabled("CALENDAR") && (
            <a
              href="#calendar-section"
              className="px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>방문 상담 일정 예약</span>
            </a>
          )}
        </div>
      </section>

      {/* 3. 모듈 1: PWA 앱 설치 배너 (PWA_BANNER) */}
      {isEnabled("PWA_BANNER") && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                📲
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  [{shopConfig.shopName}] 스마트폰 홈 화면에 바로가기 앱 추가
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  앱스토어 다운로드 없이 브라우저에서 1초 만에 네이티브 앱처럼 설치됩니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert("스마트폰 브라우저 공유 메뉴에서 '홈 화면에 추가'를 누르시면 1초 만에 설치됩니다.")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
            >
              홈 화면 1초 추가
            </button>
          </div>
        </section>
      )}

      {/* 4. 모듈 2: 카탈로그 & 시공 실적 갤러리 (CATALOG) */}
      {isEnabled("CATALOG") && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold mb-2">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>공식 카탈로그 & 주요 실적</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              주요 서비스 및 납품 솔루션 라인업
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              투데이 플랫폼 보증 및 표준 사양 준수 공인 제품
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(shopConfig.catalogItems || APTLINK_DEFAULT_SHOP_CONFIG.catalogItems || []).map(
              (item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100/60 inline-block mb-3">
                        {item.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-600">{item.priceText}</span>
                    <button
                      type="button"
                      onClick={() => setIsContractModalOpen(true)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 inline-flex items-center gap-0.5"
                    >
                      <span>신청/약정</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* 5. 모듈 3: 국토부·LH 가이드라인 음성 AI 실무스쿨 (VOICE_QA) */}
      {isEnabled("VOICE_QA") && (
        <section className="border-t border-slate-100">
          <RepairEduVoiceRoom />
        </section>
      )}

      {/* 6. 모듈 4: 10인 단지 입주민 공동구매 청원 (GROUP_BUY) */}
      {isEnabled("GROUP_BUY") && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>10인 단지 입주민 공동구매 청원</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              우리 아파트 단지 주민 10명이 모이면 특판 공구 오픈!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              인근 단지 입주민들과 함께 청원 버튼을 누르시면 시공 단가 최대 25% 인하 혜택이 적용됩니다.
            </p>

            <div className="max-w-xs mx-auto mb-6">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600">현재 청원 참여:</span>
                <span className="text-blue-600 font-extrabold">{petitionCount} / 10명 달성</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (petitionCount / 10) * 100)}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePetitionClick}
              disabled={hasPetitioned}
              className={`px-6 py-3 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all ${
                hasPetitioned
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hasPetitioned ? "청원 참여 완료 (대기중)" : "우리 단지 10인 공구 청원 동참하기"}</span>
            </button>
          </div>
        </section>
      )}

      {/* 7. 모듈 5: 실시간 방문 상담 예약 (CALENDAR) */}
      {isEnabled("CALENDAR") && (
        <section
          id="calendar-section"
          className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-100"
        >
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  현장 방문 & 실시간 대면 기술 상담 예약
                </h3>
                <p className="text-xs text-slate-500">
                  구글 캘린더 양방향 동기화로 중복 없이 실시간 일정을 조율합니다.
                </p>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-900">예약이 정상 접수되었습니다!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  지정하신 일시({bookingDate} {bookingTime})에 담당 기술사가 사전 연락 후 방문드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      희망 방문 일자
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      희망 상담 시간
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="10:00">오전 10:00</option>
                      <option value="14:00">오후 02:00</option>
                      <option value="16:00">오후 04:00</option>
                      <option value="19:00">오후 07:00 (입대의 회의 야간 상담)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      신청 단지명 / 직함
                    </label>
                    <input
                      type="text"
                      placeholder="예: 상계주공 14단지 관리소장"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      연락처 (휴대폰 번호)
                    </label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Clock className="w-4 h-4" />
                    <span>실시간 캘린더 확정 예약 신청</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* 8. 모달: t.sign 모바일 전자계약/약정 팝업 */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  t.sign 비대면 모바일 공정 약정서
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 mb-4 font-mono text-slate-600">
              <p>
                <strong>약정 당사자:</strong> {shopConfig.shopName} (갑) ↔ 신청인 (을)
              </p>
              <p>
                <strong>주요 조건:</strong> 국토부 K-apt 적격심사 기준 준수 및 100% 실거래 역산출 단가 보증
              </p>
              <p>
                <strong>법적 효력:</strong> 전자서명법 제3조에 의한 공인 전자문서 타임스탬프 부여
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleContractSign}
                disabled={contractSuccess}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{contractSuccess ? "전자서명 생성 중..." : "1초 모바일 서명 완료"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. 푸터 및 Today 플랫폼 샵인샵 보증 */}
      <footer className="bg-white border-t border-slate-100 py-10 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-slate-800">
            {shopConfig.shopName} · 대표: {shopConfig.representativeName} · 연락처: {shopConfig.phone}
          </p>
          <p className="text-[11px] text-slate-400">{shopConfig.roadAddress}</p>
          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            본 샵인샵 독립 포털은 <strong>Today Multi-Tenant Engine</strong>에 의해 안전하게 호스팅되며,
            Today Link 공식 표준 가이드라인을 준수합니다.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ShopInShopStorefrontPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>샵인샵 포털을 불러오는 중입니다...</span>
        </div>
      }
    >
      <ShopInShopContent />
    </Suspense>
  );
}
