"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TodayPickFilterBar, { type TodayPickRegion } from "@/components/TodayPickFilterBar";
import LocalCultureSection from "@/components/LocalCultureSection";
import TodayLinkShopCard, { type TodayLinkShopItem } from "@/components/TodayLinkShopCard";
import KakaoSubmitBanner from "@/components/KakaoSubmitBanner";
import MckareFundingCard from "@/components/MckareFundingCard";
import ZoomEventCard from "@/components/ZoomEventCard";
import MembershipSection from "@/components/MembershipSection";
import Footer from "@/components/Footer";

const ZOOM_EVENTS = [
  {
    title: "독거노인 안전확인, 우리 동네가 함께하는 법",
    host: "한국AI인테리어공간협회 교육팀",
    date: "2026년 10월 15일 (목)",
    time: "오후 7:00 ~ 7:30",
    fee: 10_000,
    capacity: 50,
    registered: 32,
  },
  {
    title: "소상공인을 위한 착한가게 캠페인 참여 가이드",
    host: "노원 상생협의회",
    date: "2026년 10월 18일 (일)",
    time: "오전 10:00 ~ 10:30",
    fee: 0,
    capacity: 40,
    registered: 17,
  },
];

const LINK_SHOP_ITEMS: TodayLinkShopItem[] = [
  {
    title: "산지 직송 반건조 생선 선물세트",
    vendor: "산지 직송",
    price: 38_000,
    originalPrice: 52_000,
    priceDisplayMode: "live",
  },
  {
    title: "주방 올인원 블렌더",
    vendor: "쿠팡 제휴",
    price: 49_900,
    originalPrice: 79_900,
    priceDisplayMode: "lowest-button",
  },
  {
    title: "겨울 극세사 가족 이불세트",
    vendor: "쿠팡 제휴",
    price: 32_900,
    originalPrice: 45_000,
    priceDisplayMode: "discount-button",
  },
  {
    title: "친환경 인증 쌀 10kg",
    vendor: "산지 직송",
    price: 29_000,
    priceDisplayMode: "live",
  },
];

export default function Home() {
  const [region, setRegion] = useState<TodayPickRegion | undefined>(undefined);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <section id="about" className="text-center">
          <p className="text-sm font-semibold text-amber-500">
            한국AI인테리어공간협회 주관 전국 로컬 공익 정보 및 상생 큐레이션 포털
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            오늘 내 삶과 가족을 위한 맞춤 발견
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">
            우리 동네 꿀정보부터 소비 연금 링크까지 — 투데이픽이 매일 챙겨드립니다.
          </p>
        </section>

        <TodayPickFilterBar onRegionChange={setRegion} />

        <LocalCultureSection region={region} />

        <section id="link-shop" className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-500">링크픽(LinkPick) 샵</p>
            <h2 className="text-xl font-bold text-zinc-900">
              쿠팡 제휴 & 산지 직송 오늘의 픽
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINK_SHOP_ITEMS.map((item) => (
              <TodayLinkShopCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <KakaoSubmitBanner />

        <MckareFundingCard />

        <section id="events" className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-zinc-900">이번 주 온라인 소모임</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ZOOM_EVENTS.map((event) => (
              <ZoomEventCard key={event.title} {...event} />
            ))}
          </div>
        </section>

        <MembershipSection />

        <Footer />
      </main>
    </div>
  );
}
