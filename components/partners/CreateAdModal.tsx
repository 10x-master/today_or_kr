"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Crown,
  Globe,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import type { LocalAd } from "@/types/officialNotice";
import { isSuperAdmin } from "@/lib/dong/pinManager";

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthProfile | null;
  defaultDong?: string;
  onSuccess: (newAd: LocalAd) => void;
}

const AVAILABLE_DONGS = [
  "상계동",
  "중계동",
  "하계동",
  "공릉동",
  "월계동",
  "돌산읍",
];

const PRESET_THUMBNAILS = [
  {
    name: "인테리어",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
  },
  {
    name: "카페·식음료",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
  },
  {
    name: "학원·교육",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  },
  {
    name: "뷰티·케어",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
  },
  {
    name: "스포츠·피트니스",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  },
  {
    name: "가전·스마트",
    url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80",
  },
];

export default function CreateAdModal({
  isOpen,
  onClose,
  currentUser,
  defaultDong = "상계동",
  onSuccess,
}: CreateAdModalProps) {
  const superAdmin = isSuperAdmin(currentUser);

  // 단계 상태 (1, 2, 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 1단계: 타겟 지역
  const [targetDongs, setTargetDongs] = useState<string[]>([defaultDong]);
  const [isAllNationwide, setIsAllNationwide] = useState(false);

  // 2단계: 비즈보드 카피 및 이미지
  const [partnerName, setPartnerName] = useState(
    currentUser?.full_name ? `${currentUser.full_name} 비즈니스` : "상계 파트너스"
  );
  const [mainCopy, setMainCopy] = useState("우리 아파트 입주민 전용 특별 혜택");
  const [subCopy, setSubCopy] = useState("주민 인증 시 전 메뉴 10% 현장 할인 제공");
  const [imageUrl, setImageUrl] = useState(PRESET_THUMBNAILS[0].url);
  const [landingUrl, setLandingUrl] = useState("/products");

  // 3단계: 패키지 기간
  const [packageDays, setPackageDays] = useState<number>(14);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 지역 토글
  const toggleDong = (dong: string) => {
    if (isAllNationwide) setIsAllNationwide(false);
    if (targetDongs.includes(dong)) {
      if (targetDongs.length === 1) return; // 최소 1곳 선택 유지
      setTargetDongs(targetDongs.filter((d) => d !== dong));
    } else {
      setTargetDongs([...targetDongs, dong]);
    }
  };

  const handleToggleAllNationwide = () => {
    if (!superAdmin) return;
    setIsAllNationwide(!isAllNationwide);
    if (!isAllNationwide) {
      setTargetDongs(["ALL"]);
    } else {
      setTargetDongs([defaultDong]);
    }
  };

  // 최종 제출
  const handleSubmit = async () => {
    if (!mainCopy.trim() || !subCopy.trim()) {
      setErrorMsg("메인 카피와 서브 카피를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/local-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: currentUser?.id || "partner-guest",
          partner_name: partnerName,
          registered_dong: defaultDong,
          target_dongs: isAllNationwide ? ["ALL"] : targetDongs,
          main_copy: mainCopy.slice(0, 25),
          sub_copy: subCopy.slice(0, 35),
          image_url: imageUrl,
          landing_url: landingUrl || "/products",
          package_days: packageDays,
          is_super_admin: superAdmin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ad) {
        onSuccess(data.ad);
        onClose();
      } else {
        setErrorMsg(data.error || "광고 등록 처리에 실패했습니다.");
      }
    } catch (err) {
      setErrorMsg("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 윈도우 (모바일 뷰포트 max-w-lg) */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* 상단 헤더 & 스텝 인디케이터 */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-2xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                새 비즈보드 광고 부스트 만들기
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className={step === 1 ? "font-bold text-amber-600" : ""}>
                  1. 타겟지역
                </span>
                <span>›</span>
                <span className={step === 2 ? "font-bold text-amber-600" : ""}>
                  2. 카피/이미지
                </span>
                <span>›</span>
                <span className={step === 3 ? "font-bold text-amber-600" : ""}>
                  3. 패키지선택
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 에러 메시지 알림 */}
        {errorMsg && (
          <div className="mx-5 my-2 rounded-xl bg-rose-50 p-2.5 text-xs font-bold text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* 본문 단계별 양식 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ============================================================== */}
          {/* STEP 1: 타겟 지역 선택                                         */}
          {/* ============================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  <span>광고를 노출할 행정동을 선택해 주세요</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  내 가게 주변 인근 행정동을 다중 선택하여 집중 홍보할 수 있습니다.
                </p>
              </div>

              {/* 최고관리자 전역 옵션 */}
              {superAdmin && (
                <div
                  onClick={handleToggleAllNationwide}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isAllNationwide
                      ? "border-amber-400 bg-amber-50 shadow-2xs"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="h-5 w-5 text-amber-600 fill-amber-500" />
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        👑 전국 전역 ALL (광역 무제한 노출)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        최고관리자 권한: 지역 제한 없이 전국 모든 피드에 배너를 롤링 노출합니다.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                      isAllNationwide
                        ? "bg-amber-500 border-amber-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {isAllNationwide && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              )}

              {/* 행정동 선택 칩 */}
              {!isAllNationwide && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    선택된 행정동 ({targetDongs.length}곳)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_DONGS.map((dong) => {
                      const isSelected = targetDongs.includes(dong);
                      const isHome = dong === defaultDong;
                      return (
                        <button
                          key={dong}
                          type="button"
                          onClick={() => toggleDong(dong)}
                          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-amber-500 text-white shadow-2xs ring-1 ring-amber-500"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                          }`}
                        >
                          <span>{dong}</span>
                          {isHome && (
                            <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded">
                              본점
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed">
                💡 <span className="font-bold">광고 노출 원리</span>: 선택된 행정동에 거주하거나 해당 행정동 피드를 조회하는 입주민의 홈 피드 3번째 행에 비즈보드 배너가 우선 노출됩니다.
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: 카피 등록 & 실시간 비즈보드 프리뷰                       */}
          {/* ============================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              {/* 실시간 카카오 비즈보드 배너 프리뷰 */}
              <div>
                <span className="text-[11px] font-black text-amber-700 flex items-center gap-1 mb-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>실시간 비즈보드 배너 라이브 미리보기</span>
                </span>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-md flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-1">
                    {/* 상단 AD 배지 + 상호명 */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-black text-slate-600 border border-slate-200">
                        AD
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">
                        {partnerName || "로컬 파트너"}
                      </span>
                    </div>

                    {/* 메인 카피 */}
                    <p className="truncate text-sm font-black text-slate-900 leading-tight">
                      {mainCopy || "메인 카피를 입력하세요"}
                    </p>

                    {/* 서브 카피 */}
                    <p className="truncate text-xs font-medium text-slate-500 mt-1">
                      {subCopy || "서브 혜택을 입력하세요"}
                    </p>

                    {/* 자세히 보기 CTA */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <span>자세히 보기</span>
                      <span>›</span>
                    </div>
                  </div>

                  {/* 우측 썸네일 */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="비즈보드 썸네일"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* 입력 폼 */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">파트너 상호명</label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="예: 노원 디자인 인테리어 라운지"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      메인 카피 (볼드 1줄, 최대 25자)
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        mainCopy.length > 25 ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {mainCopy.length}/25자
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={25}
                    value={mainCopy}
                    onChange={(e) => setMainCopy(e.target.value)}
                    placeholder="예: 상계주공 올수리 3,000만원대 특가"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      서브 카피 (1줄, 최대 35자)
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        subCopy.length > 35 ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {subCopy.length}/35자
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={35}
                    value={subCopy}
                    onChange={(e) => setSubCopy(e.target.value)}
                    placeholder="예: 공간협회 공인 시공 · 3년 무상 A/S 보증"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* 썸네일 이미지 선택 / 프리셋 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    썸네일 이미지 (업종별 추천 프리셋)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_THUMBNAILS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left transition-all ${
                          imageUrl === preset.url
                            ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-7 w-7 rounded-lg object-cover"
                        />
                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="또는 직접 이미지 URL 입력"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-mono text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">연결 랜딩 링크 (URL)</label>
                  <input
                    type="text"
                    value={landingUrl}
                    onChange={(e) => setLandingUrl(e.target.value)}
                    placeholder="예: https://map.naver.com/... 또는 /products"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: 기간 / 패키지 선택                                     */}
          {/* ============================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800">
                  광고 집행 기간 패키지를 선택해 주세요
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  집행 기간 동안 설정하신 타겟 행정동 피드에 상시 롤링 노출됩니다.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 7일 패키지 */}
                <div
                  onClick={() => setPackageDays(7)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    packageDays === 7
                      ? "border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-500"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">⚡ 7일 패키지</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                        주말 집중
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      단기 이벤트 및 주말 오픈 프로모션 추천
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">30,000 P</p>
                    <p className="text-[10px] text-slate-400">일 약 4,200 P</p>
                  </div>
                </div>

                {/* 14일 패키지 (인기) */}
                <div
                  onClick={() => setPackageDays(14)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    packageDays === 14
                      ? "border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-500"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="absolute -top-2.5 right-4 rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-black text-white shadow-2xs">
                    BEST 인기
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">🔥 14일 패키지</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                        2주 연속
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      지속적인 인지도 각인 및 매장 방문 유도
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-600">55,000 P</p>
                    <p className="text-[10px] text-slate-400">10% 우대 할인</p>
                  </div>
                </div>

                {/* 30일 패키지 */}
                <div
                  onClick={() => setPackageDays(30)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    packageDays === 30
                      ? "border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-500"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">🚀 30일 패키지</span>
                      <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                        월간 보증
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      로컬 상권 점유율 1위 달성 및 최대 노출
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">99,000 P</p>
                    <p className="text-[10px] text-emerald-600 font-bold">25% 절약</p>
                  </div>
                </div>
              </div>

              {/* 최종 요약 카드 */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>타겟 행정동:</span>
                  <span className="font-bold text-slate-900">
                    {isAllNationwide ? "전국 전역 (ALL)" : `${targetDongs.join(", ")}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>집행 기간:</span>
                  <span className="font-bold text-slate-900">{packageDays}일간</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>승인 방식:</span>
                  <span className="font-bold text-amber-600">
                    {superAdmin ? "👑 즉시 승인 및 활성화" : "운영팀 24시간 내 심사 (PENDING)"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 단계 이동 및 완료 버튼 */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>이전</span>
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && targetDongs.length === 0 && !isAllNationwide) {
                  setErrorMsg("최소 1곳 이상의 행정동을 선택해 주세요.");
                  return;
                }
                setErrorMsg(null);
                setStep((step + 1) as 2 | 3);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.99] transition-all"
            >
              <span>다음 단계</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-xs font-black text-white hover:bg-amber-600 active:scale-[0.99] transition-all shadow-md disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>
                {submitting
                  ? "광고 신청 처리 중..."
                  : superAdmin
                  ? "👑 최고관리자 즉시 라이브 발행"
                  : "⚡ 광고 부스트 신청 완료하기"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
