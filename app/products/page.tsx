"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  ShieldCheck,
  BookmarkPlus,
  Check,
  Sparkles,
  Star,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  X,
  Send,
  ExternalLink,
} from "lucide-react";
import type { PlatformProduct } from "@/types/officialNotice";

const CATEGORY_TABS: Array<{ id: string; label: string; icon: string }> = [
  { id: "ALL", label: "전체", icon: "✨" },
  { id: "INTERIOR", label: "주방·인테리어", icon: "🍳" },
  { id: "ELECTRONICS", label: "스마트전자·센서", icon: "📡" },
  { id: "LIVING", label: "생활복지", icon: "🛋️" },
];

const CATEGORY_MAP: Record<string, { label: string; badgeClass: string }> = {
  INTERIOR: { label: "주방·인테리어", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" },
  ELECTRONICS: { label: "스마트전자·센서", badgeClass: "bg-blue-50 text-blue-800 border-blue-200" },
  COMMERCE: { label: "로컬커머스", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  LIVING: { label: "생활복지", badgeClass: "bg-purple-50 text-purple-800 border-purple-200" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedNotesIds, setSavedNotesIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 공급 상담 문의 모달 상태
  const [consultProduct, setConsultProduct] = useState<PlatformProduct | null>(null);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState("");
  const [consultOrg, setConsultOrg] = useState("");
  const [consultContent, setConsultContent] = useState("");
  const [isConsultSubmitting, setIsConsultSubmitting] = useState(false);
  const [isConsultDone, setIsConsultDone] = useState(false);

  // URL query 체크 (?admin=true)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("admin") === "true") {
        setIsAdmin(true);
      }
    }
  }, []);

  // 제품 목록 조회
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin
        ? "/api/platform-products?include_private=true"
        : "/api/platform-products";
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      }
    } catch (err) {
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. 최고관리자: 공개/비공개 토글
  const handleTogglePublic = async (product: PlatformProduct) => {
    const nextPublic = !(product.is_public ?? true);

    // 낙관적 UI 업데이트
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_public: nextPublic } : p))
    );

    try {
      const res = await fetch("/api/platform-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          is_public: nextPublic,
        }),
      });
      if (res.ok) {
        showToast(
          nextPublic
            ? `[${product.title}] 공개 상태로 전환되었습니다.`
            : `[${product.title}] 비공개(숨김) 처리되었습니다.`
        );
      }
    } catch {
      fetchProducts();
    }
  };

  // 2. 최고관리자: 메인 롤링 노출 토글
  const handleToggleHeroRolling = async (product: PlatformProduct) => {
    const nextRolling = !(product.is_hero_rolling ?? false);

    // 낙관적 UI 업데이트
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_hero_rolling: nextRolling } : p))
    );

    try {
      const res = await fetch("/api/platform-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          is_hero_rolling: nextRolling,
        }),
      });
      if (res.ok) {
        showToast(
          nextRolling
            ? `[${product.title}] 메인 롤링 배너에 노출됩니다.`
            : `[${product.title}] 메인 롤링에서 제외되었습니다.`
        );
      }
    } catch {
      fetchProducts();
    }
  };

  // 3. 최고관리자: 파트너 등급 순환 변경 (ALL -> NORMAL -> VIP -> EXCLUSIVE)
  const handleCycleGrade = async (product: PlatformProduct) => {
    const grades = ["ALL", "NORMAL", "VIP", "EXCLUSIVE"];
    const current = product.min_partner_grade || "ALL";
    const nextGrade = grades[(grades.indexOf(current) + 1) % grades.length];

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, min_partner_grade: nextGrade } : p))
    );

    try {
      await fetch("/api/platform-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          min_partner_grade: nextGrade,
        }),
      });
      showToast(`허용 파트너 등급이 [${nextGrade}] 로 변경되었습니다.`);
    } catch {
      fetchProducts();
    }
  };

  // 4. 티노트(t.note) 업무 담기
  const handleSaveToTodayNote = async (product: PlatformProduct) => {
    try {
      const res = await fetch("/api/today-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[제품공급] ${product.title}`,
          content: `【사양 및 특장점】\n${product.spec_summary || "사양 정보 없음"}\n\n【공급가/특판 정책】\n${product.price_info || "별도 협의"}\n\n【직통 문의】\n${product.contact_phone || "1588-0000"}`,
          note_type: "SCHEDULE",
          due_date: new Date().toISOString().split("T")[0],
          linked_kapt_code: null,
        }),
      });

      if (res.ok) {
        setSavedNotesIds((prev) => [...prev, product.id]);
        showToast("📥 티노트(t.note)에 제품 정보가 스크랩되었습니다!");
      }
    } catch (err) {
      console.error("Save to t.note error:", err);
      showToast("티노트 저장에 실패했습니다.");
    }
  };

  // 5. 공급 상담 폼 전송
  const handleSubmitConsult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultPhone.trim()) {
      alert("연락처를 입력해 주세요.");
      return;
    }
    setIsConsultSubmitting(true);
    setTimeout(() => {
      setIsConsultSubmitting(false);
      setIsConsultDone(true);
    }, 600);
  };

  // 필터링 적용
  const filteredProducts = products.filter((p) => {
    if (!isAdmin && p.is_public === false) return false;
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "LIVING") {
      return p.category === "LIVING" || p.category === "COMMERCE";
    }
    return p.category === selectedCategory;
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-1 flex-col bg-slate-50/50">
      {/* 토스트 피드백 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              title="홈으로 돌아가기"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  취급제품 및 공식 공급 솔루션
                </span>
                <span className="rounded-full bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  B2B·B2G
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-medium">
                공동주택 특판 및 B2B 파트너사를 위한 공식 공급 라인업입니다.
              </p>
            </div>
          </div>

          {/* 최고관리자 모드 온/오프 토글 스위치 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                isAdmin
                  ? "bg-slate-900 text-amber-300 shadow-md ring-2 ring-amber-400/40"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="최고관리자 권한 토글 바"
            >
              <Settings className={`h-3.5 w-3.5 ${isAdmin ? "animate-spin" : ""}`} />
              <span>{isAdmin ? "관리자 모드: ON" : "관리자 제어"}</span>
            </button>

            <Link
              href="/workspace"
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <span>t.note</span>
            </Link>
          </div>
        </div>

        {/* 2. 카테고리 필터 칩 */}
        <div className="border-t border-slate-100 bg-white px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. 본문 컨텐츠 영역 */}
      <main className="flex-1 px-4 py-5 sm:px-6">
        {/* 관리자 모드 안내 배너 */}
        {isAdmin && (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black">
                ★
              </span>
              <span className="font-bold">
                최고관리자 원클릭 제어 모드가 활성화되었습니다. (비공개 제품도 표시됩니다)
              </span>
            </div>
            <span className="text-[11px] text-amber-700">실시간 Supabase DB 반영</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">
            취급제품 라인업을 불러오는 중입니다...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center rounded-3xl bg-white border border-slate-200/80 p-8 shadow-xs">
            <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-700">해당 카테고리의 취급제품이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">상단에서 전체 카테고리를 선택해 보세요.</p>
          </div>
        ) : (
          /* Pure White 모듈러 카드 그리드 */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredProducts.map((product) => {
              const cat = CATEGORY_MAP[product.category] || {
                label: product.category,
                badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
              };
              const isSaved = savedNotesIds.includes(product.id);
              const isPublic = product.is_public !== false;
              const isHeroRolling = product.is_hero_rolling === true;

              return (
                <div
                  key={product.id}
                  className={`group relative flex flex-col rounded-3xl bg-white border shadow-xs hover:shadow-lg transition-all overflow-hidden ${
                    !isPublic
                      ? "border-dashed border-red-300 opacity-80 ring-2 ring-red-100"
                      : "border-slate-200/90"
                  }`}
                >
                  {/* 최고관리자 간이 제어 바 (Admin Inline Bar) */}
                  {isAdmin && (
                    <div className="bg-slate-900 text-white px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[11px]">
                      {/* 공개/비공개 토글 */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublic(product)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition-colors ${
                          isPublic
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        }`}
                        title="공개 상태 토글"
                      >
                        {isPublic ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>공개</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>비공개</span>
                          </>
                        )}
                      </button>

                      {/* 메인 롤링 노출 토글 */}
                      <button
                        type="button"
                        onClick={() => handleToggleHeroRolling(product)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition-colors ${
                          isHeroRolling
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                        title="메인 최상단 롤링 배너 노출 여부"
                      >
                        <Star className={`h-3 w-3 ${isHeroRolling ? "fill-amber-300" : ""}`} />
                        <span>{isHeroRolling ? "메인 롤링 ON" : "롤링 OFF"}</span>
                      </button>

                      {/* 등급 배지 토글 */}
                      <button
                        type="button"
                        onClick={() => handleCycleGrade(product)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 font-mono text-[10px] text-slate-300"
                        title="클릭 시 허용 등급 변경"
                      >
                        등급: {product.min_partner_grade || "ALL"}
                      </button>
                    </div>
                  )}

                  {/* 제품 대표 이미지 */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.main_image_url}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* 카테고리 배지 */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md ${cat.badgeClass}`}
                      >
                        {cat.label}
                      </span>
                      {product.is_hero_rolling && (
                        <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                          ⭐ 메인 롤링
                        </span>
                      )}
                    </div>

                    {/* 공급 인증 마크 */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        협회 정품 B2B 솔루션
                      </span>
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="text-base font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    {product.subtitle && (
                      <p className="mt-1 text-xs font-medium text-slate-500 line-clamp-2">
                        {product.subtitle}
                      </p>
                    )}

                    {/* 주요 사양 요약 박스 (모듈러) */}
                    {product.spec_summary && (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          핵심 사양
                        </p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {product.spec_summary}
                        </p>
                      </div>
                    )}

                    {/* 공급 및 가격 정책 */}
                    {product.price_info && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50/70 border border-amber-200/70 px-3 py-2 text-xs font-bold text-amber-900">
                        <span>🏷️</span>
                        <span className="line-clamp-1">{product.price_info}</span>
                      </div>
                    )}

                    {/* 하단 액션 버튼 */}
                    <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100">
                      {/* [📞 공급 문의] */}
                      <button
                        type="button"
                        onClick={() => {
                          setConsultProduct(product);
                          setIsConsultDone(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>공급 문의</span>
                      </button>

                      {/* [📥 t.note 업무 담기] */}
                      <button
                        type="button"
                        onClick={() => handleSaveToTodayNote(product)}
                        disabled={isSaved}
                        className={`flex items-center justify-center gap-1 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                          isSaved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title="티노트에 담기"
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>담김</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-3.5 w-3.5 text-slate-500" />
                            <span>t.note</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 공급 상담 및 B2B 문의 모달 */}
      {consultProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 이미지 헤더 */}
            <div className="relative h-40 w-full bg-slate-900 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={consultProduct.main_image_url}
                alt={consultProduct.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <button
                type="button"
                onClick={() => setConsultProduct(null)}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="inline-block rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white mb-1">
                  공식 공급 상담
                </span>
                <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">
                  {consultProduct.title}
                </h3>
              </div>
            </div>

            {/* 모달 본문 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* 공급 안내 및 전화 직통 버튼 */}
              <div className="rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">공급 상담 직통 번호</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    평일 09:00 ~ 18:00 (단지 및 사업자 특판 전담)
                  </p>
                </div>
                <a
                  href={`tel:${consultProduct.contact_phone || "1588-0000"}`}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>전화 연결</span>
                </a>
              </div>

              {isConsultDone ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-2">
                    <Check className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    상담 신청이 완료되었습니다!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    담당 오퍼레이터가 확인 후 입력하신 연락처로 신속히 안내드리겠습니다.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitConsult} className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800">
                    B2B / B2G 공급 상담 접수 양식
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="성함 / 담당자명"
                      value={consultName}
                      onChange={(e) => setConsultName(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="연락처 (010-0000-0000)"
                      value={consultPhone}
                      onChange={(e) => setConsultPhone(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="소속 단지명 또는 기업명 (예: 상계주공 5단지 / OO인테리어)"
                    value={consultOrg}
                    onChange={(e) => setConsultOrg(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="문의 내용 (예: 세대 일괄 시공 견적 문의, 지자체 보조금 연계 여부 등)"
                    value={consultContent}
                    onChange={(e) => setConsultContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isConsultSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isConsultSubmitting ? "접수 중..." : "상담 신청하기"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* 하단 닫기 바 */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setConsultProduct(null)}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
