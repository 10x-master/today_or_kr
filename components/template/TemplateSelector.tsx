"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Sparkles,
  Check,
  ChevronRight,
  ExternalLink,
  Store,
  Building,
  Package,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  Settings2,
  Trash2,
  Plus,
  ArrowRight,
  Eye,
} from "lucide-react";
import {
  TEMPLATE_PRESETS,
  TEMPLATE_MODULES,
  APTLINK_DEFAULT_SHOP_CONFIG,
  type TemplatePresetId,
  type TemplateModuleKey,
  type ShopInShopConfig,
} from "@/types/template";

interface TemplateSelectorProps {
  initialTemplateId?: TemplatePresetId;
  onShopCreated?: (shopConfig: ShopInShopConfig) => void;
}

const STORAGE_KEY = "today_shop_in_shop_configs";

export default function TemplateSelector({
  initialTemplateId = "APTLINK_B2B",
  onShopCreated,
}: TemplateSelectorProps) {
  const router = useRouter();
  const [selectedPresetId, setSelectedPresetId] = useState<TemplatePresetId>(initialTemplateId);

  // 상점 커스텀 폼 상태
  const [shopSlug, setShopSlug] = useState("my-aptlink-portal");
  const [shopName, setShopName] = useState("아파트링크 노원 공식 포털");
  const [tagline, setTagline] = useState("우리 아파트 공사비 적정성 진단 및 장기수선 실무스쿨");
  const [repName, setRepName] = useState("입대의 기술자문단");
  const [phone, setPhone] = useState("02-1588-0000");
  const [roadAddress, setRoadAddress] = useState("서울특별시 노원구 동일로 1414");
  const [dong, setDong] = useState("상계동");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");

  // 모듈 On/Off 상태
  const [enabledModules, setEnabledModules] = useState<Record<TemplateModuleKey, boolean>>(
    TEMPLATE_PRESETS[initialTemplateId].defaultModules
  );

  // 저장된 샵인샵 목록
  const [savedShops, setSavedShops] = useState<ShopInShopConfig[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [justCreatedShopId, setJustCreatedShopId] = useState<string | null>(null);

  // 초기화 및 로컬 스토리지 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedShops(parsed);
          return;
        }
      }
      // 기본값으로 APTLINK_DEFAULT_SHOP_CONFIG 저장
      setSavedShops([APTLINK_DEFAULT_SHOP_CONFIG]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([APTLINK_DEFAULT_SHOP_CONFIG]));
    } catch (e) {
      console.warn("Failed to load saved shops:", e);
      setSavedShops([APTLINK_DEFAULT_SHOP_CONFIG]);
    }
  }, []);

  // 프리셋 변경 핸들러
  const handleSelectPreset = (presetId: TemplatePresetId) => {
    setSelectedPresetId(presetId);
    const preset = TEMPLATE_PRESETS[presetId];
    setEnabledModules({ ...preset.defaultModules });
    setPrimaryColor(preset.accentColor);

    if (presetId === "APTLINK_B2B") {
      setShopSlug("apt-nowon14");
      setShopName("아파트링크 노원 14단지 전용 포털");
      setTagline("CERA-PMS 비공개 입찰 분석 & 2025 장기수선 실무스쿨");
    } else if (presetId === "MANUFACTURER_B2B") {
      setShopSlug("clean-ultrasonic");
      setShopName("에코소닉 산업용 초음파세척기");
      setTagline("국내 1위 주방/산업용 초음파세척기 공장 직판 & t.sign 전자계약");
    } else if (presetId === "LOCAL_STORE") {
      setShopSlug("cafe-jeongja");
      setShopName("정자동 모리 베이커리 & 카페");
      setTagline("단지 입주민 10% 상생 할인 & 스마트폰 PWA 바로가기");
    } else if (presetId === "PRO_SALES") {
      setShopSlug("partner-sales-desk");
      setShopName("t.note 필드 세일즈 엠버서더 허브");
      setTagline("AI 일정 비서, 음성 퀵 캡처 & 링크픽 N차 정산 데스크");
    }
  };

  // 모듈 토글
  const toggleModule = (moduleKey: TemplateModuleKey) => {
    setEnabledModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  // 샵인샵 생성 및 저장
  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || `shop-${Date.now()}`;
    const selectedPreset = TEMPLATE_PRESETS[selectedPresetId];

    const newShopConfig: ShopInShopConfig = {
      id: cleanSlug,
      templateId: selectedPresetId,
      shopName: shopName.trim() || selectedPreset.name,
      category: selectedPreset.category,
      tagline: tagline.trim() || selectedPreset.heroTagline,
      description: selectedPreset.description,
      representativeName: repName.trim() || "대표 관리자",
      phone: phone.trim() || "02-1588-0000",
      email: "support@today.or.kr",
      roadAddress: roadAddress.trim(),
      dong: dong.trim() || "역삼동",
      logoText: shopName.slice(0, 4) || "Shop",
      logoBgColor: primaryColor,
      primaryColor,
      enabledModules,
      catalogItems: selectedPresetId === "APTLINK_B2B" ? APTLINK_DEFAULT_SHOP_CONFIG.catalogItems : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newShopConfig, ...savedShops.filter((s) => s.id !== cleanSlug)];
    setSavedShops(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("Storage save error:", err);
      }
    }

    setJustCreatedShopId(cleanSlug);
    if (onShopCreated) {
      onShopCreated(newShopConfig);
    }
  };

  const handleDeleteShop = (shopId: string) => {
    if (shopId === "aptlink-official") {
      alert("공식 기본 템플릿은 삭제할 수 없습니다.");
      return;
    }
    const updated = savedShops.filter((s) => s.id !== shopId);
    setSavedShops(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const copyUrl = (id: string) => {
    const url = `https://today.or.kr/shop/${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white">
      {/* 4대 표준 프리셋 카드 선택 그리드 */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              표준 템플릿 선택 (4대 샵인샵 프리셋)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">원클릭 레이아웃 복제</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(TEMPLATE_PRESETS) as TemplatePresetId[]).map((presetKey) => {
            const preset = TEMPLATE_PRESETS[presetKey];
            const isSelected = selectedPresetId === presetKey;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative text-left p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-blue-50/20 border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {preset.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">{preset.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {preset.description}
                </p>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] text-slate-400 font-medium block mb-1">
                    추천 입점 대상:
                  </span>
                  <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
                    {preset.recommendedFor}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 템플릿 상세 커스터마이징 & 모듈 스위치 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* 좌측: 상호 정보 및 고유 주소 설정 (6열) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              [1단계] 입점사 기본 정보 & 전용 URL 슬러그
            </h4>
          </div>

          <form onSubmit={handleCreateShop} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                전용 URL 슬러그 (ID)
              </label>
              <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-500">
                <span className="text-slate-400">today.or.kr/shop/</span>
                <input
                  type="text"
                  value={shopSlug}
                  onChange={(e) => setShopSlug(e.target.value)}
                  placeholder="my-shop-id"
                  className="bg-transparent border-none text-blue-700 font-semibold focus:outline-none flex-1 ml-1"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                영문 소문자, 숫자, 하이픈(-) 조합으로 고유 접속 주소가 부여됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  상호명 (홈페이지 타이틀)
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  대표자 / 담당 팀명
                </label>
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                대표 슬로건 (헤더 배너 문구)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  대표 연락처 (문의/접수)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  소재지 행정동 (예: 상계동)
                </label>
                <input
                  type="text"
                  value={dong}
                  onChange={(e) => setDong(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                상세 도로명 주소
              </label>
              <input
                type="text"
                value={roadAddress}
                onChange={(e) => setRoadAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200/80 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>선택 템플릿 기반 t.홈페이지 즉시 생성 & 저장</span>
              </button>
            </div>
          </form>
        </div>

        {/* 우측: 7대 모듈 On/Off 스위처 (6열) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                [2단계] 샵인샵 기능 모듈 On/Off 설정
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">실시간 동적 반영</span>
          </div>

          <div className="space-y-3">
            {TEMPLATE_MODULES.map((mod) => {
              const isEnabled = !!enabledModules[mod.key];

              return (
                <div
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isEnabled
                      ? "bg-blue-50/20 border-blue-200"
                      : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{mod.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                        {mod.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-medium">
                            {mod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{mod.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={isEnabled ? "모듈 비활성화" : "모듈 활성화"}
                    className="shrink-0 text-slate-400"
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-7 h-7 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 성공 피드백 알림 배너 */}
          {justCreatedShopId && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-800">
                  샵인샵 홈페이지가 성공적으로 생성되었습니다!
                </span>
              </div>
              <Link
                href={`/shop/${justCreatedShopId}`}
                target="_blank"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 underline"
              >
                <span>페이지 열기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 저장된 샵인샵 포털 리스트 관리 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              현재 발행된 샵인샵 포털 목록 ({savedShops.length}개)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              각 입점사별로 독립된 고유 URL 경로가 제공되며, 언제든 모듈을 재구성할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {savedShops.map((shop) => (
            <div
              key={shop.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: shop.primaryColor || "#2563EB" }}
                >
                  {shop.logoText.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{shop.shopName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {shop.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 mt-0.5 font-mono text-[11px]">
                    <span>today.or.kr/shop/{shop.id}</span>
                    <span>·</span>
                    <span>{shop.dong}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => copyUrl(shop.id)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>주소복사</span>
                </button>

                <Link
                  href={`/shop/${shop.id}`}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>미리보기</span>
                </Link>

                {shop.id !== "aptlink-official" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShop(shop.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
