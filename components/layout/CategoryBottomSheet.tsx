"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Coffee,
  Coins,
  Compass,
  FileText,
  GraduationCap,
  HardHat,
  Landmark,
  Layers,
  Package,
  PartyPopper,
  ShieldCheck,
  TrendingUp,
  X,
  ExternalLink,
} from "lucide-react";
import type { OfficialNoticeCategory } from "@/types/officialNotice";

interface CategoryBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: OfficialNoticeCategory) => void;
  onOpenResidentVerify?: () => void;
  onNavigateTab?: (tab: "home" | "feed" | "notes" | "analysis") => void;
}

export default function CategoryBottomSheet({
  isOpen,
  onClose,
  onSelectCategory,
  onOpenResidentVerify,
  onNavigateTab,
}: CategoryBottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCategoryClick = (cat: OfficialNoticeCategory) => {
    onSelectCategory(cat);
    onNavigateTab?.("feed");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* 바깥 배경 터치 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 바텀시트 컨테이너 (max-w-md 정렬) */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-200">
        {/* 상단 드래그 핸들 */}
        <div className="py-2.5 flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">전체 카테고리 & 서비스</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              공식 팩트 고시부터 생활 혜택, 스마트 워크 도구까지 한눈에 탐색
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 스크롤 가능한 본문 카테고리 그리드 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">
          {/* 섹션 1: 행정 / 팩트 고시 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Landmark className="h-4 w-4 text-amber-700" />
              <h3 className="text-xs font-black text-slate-800 tracking-tight">
                행정 / 팩트 고시
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryClick("REDEVELOP")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🏢
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  재개발·실거래
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick("INFRA")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🏗️
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  국토부·교통
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick("SUBSIDY")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  💡
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  지원금·복지
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick("COUNCIL")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🏛️
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  의회·행정
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick("EDU")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🎓
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  AI교육·공모
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick("ALL")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 hover:bg-amber-100 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  ✨
                </div>
                <span className="text-[11px] font-black text-amber-950 text-center leading-tight">
                  전체 고시 모아보기
                </span>
              </button>
            </div>
          </div>

          {/* 섹션 2: 생활 / 상권 / 커뮤니티 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Coffee className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-black text-slate-800 tracking-tight">
                생활 / 상권 / 커뮤니티
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryClick("CAFE")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-100 bg-amber-50/50 p-3 hover:bg-amber-100/60 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  ☕
                </div>
                <span className="text-[11px] font-bold text-amber-950 text-center leading-tight">
                  동네카페 추천
                </span>
              </button>

              <Link
                href="/products"
                onClick={onClose}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🛍️
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  취급제품 쇼룸
                </span>
              </Link>

              <button
                type="button"
                onClick={() => handleCategoryClick("FESTIVAL")}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-amber-50/60 hover:border-amber-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🎪
                </div>
                <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                  축제·행사
                </span>
              </button>

              <Link
                href="/partners"
                onClick={onClose}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-3 hover:border-amber-400 transition-all active:scale-95 shadow-2xs"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg">
                  🤝
                </div>
                <span className="text-[11px] font-black text-amber-950 text-center leading-tight">
                  파트너스 센터
                </span>
              </Link>

              {onOpenResidentVerify && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResidentVerify();
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 hover:bg-emerald-100/60 transition-all active:scale-95 col-span-2 sm:col-span-1"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-lg text-emerald-600">
                    🧾
                  </div>
                  <span className="text-[11px] font-bold text-emerald-950 text-center leading-tight">
                    단지 입주민 인증 이벤트
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 섹션 3: 스마트 도구 / 워크OS */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-800 tracking-tight">
                스마트 도구 / 워크OS
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/workspace"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all active:scale-95"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs text-indigo-600 font-bold text-sm">
                  📅
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    t.note 업무일지
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    구글 캘린더 실시간 동기화
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  onNavigateTab?.("analysis");
                  onClose();
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-indigo-50/60 hover:border-indigo-200 transition-all active:scale-95 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs text-amber-600 font-bold text-sm">
                  📊
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    아파트 분석
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    실거래가 & 인프라 팩트
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
