"use client";

import React, { useState } from "react";
import {
  Megaphone,
  X,
  Sparkles,
  Calendar,
  ExternalLink,
  Building,
  CheckCircle2,
  Coins,
  ShieldCheck,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { LocalAd } from "@/types/officialNotice";

export interface BizboardAdOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBizName?: string;
  defaultLandingUrl?: string;
  defaultDong?: string;
  onOrderSubmitted?: (ad: LocalAd) => void;
}

export default function BizboardAdOrderModal({
  isOpen,
  onClose,
  defaultBizName = "노원 로스터리 상계점",
  defaultLandingUrl = "/biz/store-nowon-roastery",
  defaultDong = "상계동",
  onOrderSubmitted,
}: BizboardAdOrderModalProps) {
  const [packageDays, setPackageDays] = useState<7 | 14 | 30>(14);
  const [partnerName, setPartnerName] = useState(defaultBizName);
  const [representative, setRepresentative] = useState("김대표");
  const [phone, setPhone] = useState("010-9922-1200");
  const [mainCopy, setMainCopy] = useState("상계주공 단지 입주민 특별 혜택! 당일 로스팅 스페셜티 원두 10% 추가할인");
  const [subCopy, setSubCopy] = useState("무료 배송 및 첫 구매 시 싱글 오리진 드립백 2종 증정");
  const [landingUrl, setLandingUrl] = useState(defaultLandingUrl);
  const [targetDong, setTargetDong] = useState(defaultDong);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const packagePricing: Record<7 | 14 | 30, { price: string; discount?: string; points: number }> = {
    7: { price: "50,000원", points: 500 },
    14: { price: "90,000원", discount: "10% 할인", points: 1000 },
    30: { price: "180,000원", discount: "25% 파격할인", points: 2500 },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const endDate = new Date(now.getTime() + packageDays * 24 * 60 * 60 * 1000);

    const newAd: LocalAd = {
      id: `ad-${Date.now()}`,
      partner_name: partnerName.trim() || defaultBizName,
      registered_dong: targetDong,
      target_dongs: targetDong === "전국" ? ["ALL"] : [targetDong],
      main_copy: mainCopy.trim(),
      sub_copy: subCopy.trim(),
      image_url: "/icons/today-192.png",
      landing_url: landingUrl.trim() || defaultLandingUrl,
      package_days: packageDays,
      status: "PENDING",
      is_active: false,
      impressions: 0,
      clicks: 0,
      start_date: now.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      created_at: now.toISOString(),
    };

    // 로컬스토리지 적재
    try {
      const existing = localStorage.getItem("today_custom_ads");
      const list: LocalAd[] = existing ? JSON.parse(existing) : [];
      list.unshift(newAd);
      localStorage.setItem("today_custom_ads", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("today_ad_created", { detail: newAd }));
    } catch (err) {
      console.warn("Failed to persist ad order locally", err);
    }

    if (onOrderSubmitted) {
      onOrderSubmitted(newAd);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-100 p-5 sm:p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* 상단 닫기 & 타이틀 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 text-sm">
              📢
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-slate-900">
                우리 동네 최상단 64px 비즈보드 광고 부스트 신청
              </h3>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                포털 메인 최상단 64px 골든 슬롯에 단독 노출하여 아파트 주민 및 상권 고객 유입을 극대화합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-medium text-slate-900">
                비즈보드 광고 부스트 신청 완료!
              </h4>
              <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                상태가 <strong>'AD_PENDING (심사 대기)'</strong>로 등록되었습니다.
                <br />
                최고관리자 CRM 심사 완료 즉시 선택하신 동네 최상단에 64px 비즈보드가 라이브 송출됩니다.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-2xs"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. 실시간 64px 비즈보드 라이브 프리뷰 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  실시간 64px 비즈보드 미리보기 (송출 화면)
                </span>
                <span className="text-[10px] text-slate-400">포털 최상단 높이 64px 고정 규격</span>
              </div>

              {/* 64px 배너 실물 프리뷰 */}
              <div className="h-16 w-full rounded-xl bg-white border border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold">
                    AD
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate leading-snug">
                      {mainCopy || "헤드라인 카피를 입력해주세요"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                      {subCopy || "서브 카피 및 추가 혜택 문구"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                  <span>자세히 보기</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* 2. 광고 슬롯 기간 선택 */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-700">
                광고 슬롯 기간 선택
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((days) => {
                  const d = days as 7 | 14 | 30;
                  const isSelected = packageDays === d;
                  const info = packagePricing[d];
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPackageDays(d)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{days}일 부스트</span>
                        {info.discount && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded ${
                              isSelected ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {info.discount}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? "text-amber-400" : "text-slate-900"}`}>
                        {info.price}
                      </span>
                      <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        +{info.points}P 적립
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 문구 입력 필드 */}
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  헤드라인 카피 (메인 1줄 문구, 최대 35자)
                </label>
                <input
                  type="text"
                  maxLength={35}
                  value={mainCopy}
                  onChange={(e) => setMainCopy(e.target.value)}
                  placeholder="예: 상계주공 14단지 입주민 특별 혜택! 당일 로스팅 원두 10% 할인"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  서브 카피 (부가 혜택 및 설명, 최대 45자)
                </label>
                <input
                  type="text"
                  maxLength={45}
                  value={subCopy}
                  onChange={(e) => setSubCopy(e.target.value)}
                  placeholder="예: 무료 배송 및 첫 구매 시 싱글 오리진 드립백 2종 증정"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    클릭 시 랜딩할 URL (내 비즈홈 또는 LinkPick 주소)
                  </label>
                  <input
                    type="text"
                    value={landingUrl}
                    onChange={(e) => setLandingUrl(e.target.value)}
                    placeholder="/biz/store-nowon-roastery 또는 linkpick.co.kr/@id"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    타깃 송출 지역
                  </label>
                  <select
                    value={targetDong}
                    onChange={(e) => setTargetDong(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-400"
                  >
                    <option value="상계동">노원구 상계동 전역</option>
                    <option value="중계동">노원구 중계동 전역</option>
                    <option value="하계동">노원구 하계동 전역</option>
                    <option value="전국">전국 전역 송출 (골든 슬롯)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. 사업자 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  상호명
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  대표자 성명
                </label>
                <input
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                  required
                />
              </div>
            </div>

            {/* 하단 결제 및 신청 확인 바 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500">신청 금액:</span>{" "}
                <strong className="text-sm font-semibold text-slate-900">
                  {packagePricing[packageDays].price}
                </strong>
                <span className="text-[10px] text-slate-400 ml-1">
                  (신청 후 관리자 심사 완료 시 과금)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Megaphone className="h-3.5 w-3.5 text-amber-400" />
                  <span>{isSubmitting ? "신청 처리 중..." : "자율 신청 및 심사 제출"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
