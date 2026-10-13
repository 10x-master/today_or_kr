"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Sparkles,
  MapPin,
  Trash2,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";
import GroupBuyVoteButton from "@/components/commerce/GroupBuyVoteButton";

interface TodayNotesTabProps {
  bookmarkedNotices: LocalOfficialNotice[];
  onSelect: (notice: LocalOfficialNotice) => void;
  onRemoveBookmark: (id: string) => void;
  onNavigateFeed: () => void;
  apartmentName?: string;
}

// 모바일 혜택 탭 전용 단지 공구 핫딜 리스트
const APARTMENT_GROUP_BUY_ITEMS = [
  {
    id: "src-2",
    manufacturer: "(주)탑소닉 코리아",
    category: "주방·설비 특판",
    title: "탑소닉 초음파 싱크볼 단지 특판",
    discountTag: "35% OFF",
    priceText: "단지 특판가 (무료 시공)",
    description: "초음파 진동으로 세제 없이 과일·채소 잔류농약 세척 및 설거지 시간 단축. 단지 10세대 달성 시 공구 확정.",
    orderFormUrl: "https://topsonic.co.kr/b2b-apt",
  },
  {
    id: "src-1",
    manufacturer: "노원 로컬 프레스",
    category: "한정판·굿즈",
    title: "2027 로컬 탁상달력 300부 한정판",
    discountTag: "직거래 9,900원",
    priceText: "9,900원 (정가 18,000원)",
    description: "상계·노원 사계절 풍경 일러스트 삽입. 아파트 부녀회/관리소 대량 신청 시 단지명 무료 각인 지원.",
    orderFormUrl: "https://form.naver.com/response/calendar2027",
  },
  {
    id: "src-3",
    manufacturer: "맥케어 헬스케어",
    category: "시니어·돌봄",
    title: "McKare 비접촉 시니어 안심 모니터링 센서",
    discountTag: "월 19,800원",
    priceText: "3채널 패키지 (월 19,800원)",
    description: "카메라 없는 밀리미터파 레이더로 사생활 침해 없이 부모님 낙상 및 활동량 24시간 실시간 감지.",
    orderFormUrl: "https://mckare.co.kr/apt-senior",
  },
];

export default function TodayNotesTab({
  bookmarkedNotices,
  onSelect,
  onRemoveBookmark,
  onNavigateFeed,
  apartmentName = "상계주공 14단지",
}: TodayNotesTabProps) {
  const [activeSection, setActiveSection] = useState<"all" | "groupBuy" | "bookmarks">("all");

  return (
    <div className="px-4 py-4 sm:px-6 space-y-6">
      {/* 상단 탭 헤더 */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 text-xs">
              🎁
            </span>
            <h2 className="text-sm font-medium text-slate-900 sm:text-base">
              입주민 전용 혜택 & 보관함
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            {apartmentName}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 font-normal">
          우리 아파트 단지 단위 공동구매 요청(투표) 및 스크랩한 티노트 요약함
        </p>

        {/* 세부 필터 탭 */}
        <div className="mt-3 flex gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection("all")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              activeSection === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체 보기
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("groupBuy")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeSection === "groupBuy"
                ? "bg-amber-500 text-slate-950 font-medium"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="h-3 w-3" />
            <span>단지 공구 투표 ({APARTMENT_GROUP_BUY_ITEMS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("bookmarks")}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeSection === "bookmarks"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Bookmark className="h-3 w-3" />
            <span>스크랩 ({bookmarkedNotices.length})</span>
          </button>
        </div>
      </div>

      {/* 1. 단지 단위 공동구매 혜택 및 실시간 투표 집계 섹션 */}
      {(activeSection === "all" || activeSection === "groupBuy") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-slate-950 text-[10px]">
                🔥
              </span>
              <h3 className="text-xs font-medium text-slate-900">
                우리 단지 실시간 공구 투표 현황
              </h3>
            </div>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-normal">
              10명 모이면 공구 확정
            </span>
          </div>

          <div className="space-y-2.5">
            {APARTMENT_GROUP_BUY_ITEMS.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-slate-50/70 p-3 space-y-2 border border-slate-100/80 transition-colors"
              >
                {/* 상단 라인: 상품명 & 태그 */}
                <div className="flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      ({item.manufacturer})
                    </span>
                  </div>
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 shrink-0">
                    {item.discountTag}
                  </span>
                </div>

                {/* 상품 설명 */}
                <p className="text-[11px] font-normal text-slate-600 line-clamp-1 leading-normal">
                  {item.description}
                </p>

                {/* 공구 성사 게이지 바 & 리퀘스트 버튼 결합 컴포넌트 */}
                <GroupBuyVoteButton
                  itemId={item.id}
                  itemTitle={item.title}
                  apartmentName={apartmentName}
                  orderFormUrl={item.orderFormUrl}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. 나의 티노트 스크랩 보관함 섹션 */}
      {(activeSection === "all" || activeSection === "bookmarks") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 text-[10px]">
                📌
              </span>
              <h3 className="text-xs font-medium text-slate-900">
                스크랩한 티노트 고시 ({bookmarkedNotices.length})
              </h3>
            </div>
            {bookmarkedNotices.length > 0 && (
              <button
                type="button"
                onClick={onNavigateFeed}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                피드 더보기 →
              </button>
            )}
          </div>

          {bookmarkedNotices.length === 0 ? (
            <div className="rounded-xl bg-slate-50/60 p-6 text-center space-y-2 border border-slate-100">
              <Bookmark className="h-6 w-6 text-slate-300 mx-auto" />
              <p className="text-xs font-normal text-slate-500">
                아직 보관함에 담아둔 고시 메모가 없습니다.
              </p>
              <button
                type="button"
                onClick={onNavigateFeed}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-[11px] font-medium text-indigo-700 transition-colors cursor-pointer"
              >
                <span>동네 피드에서 스크랩하기</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarkedNotices.map((notice) => {
                const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
                  label: notice.category,
                  icon: "📌",
                  badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
                };

                return (
                  <article
                    key={notice.id}
                    className="group relative cursor-pointer rounded-xl bg-white p-3 space-y-1.5 border border-slate-100 hover:border-indigo-200 transition-colors"
                    onClick={() => onSelect(notice)}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-normal ${meta.badgeBg}`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(notice.id);
                        }}
                        className="rounded-full p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
                        aria-label="보관함에서 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-medium text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {notice.title}
                    </h4>

                    {notice.impact_zone && (
                      <p className="flex items-center gap-1 text-[10px] font-normal text-amber-700">
                        <MapPin className="h-2.5 w-2.5 shrink-0 text-amber-600" />
                        <span>{notice.impact_zone}</span>
                      </p>
                    )}

                    <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-normal text-slate-600 space-y-0.5">
                      <p className="line-clamp-1">
                        <strong className="font-medium text-slate-800">핵심:</strong> {notice.summary_1}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-normal text-slate-400 pt-0.5">
                      <span>{notice.issuing_agency}</span>
                      <span>{notice.publish_date}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
