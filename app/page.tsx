"use client";

import { useState } from "react";
import MobileHeader from "@/components/mobile/MobileHeader";
import BottomTabBar, { type MobileTab } from "@/components/mobile/BottomTabBar";
import FeedTab from "@/components/mobile/tabs/FeedTab";
import FundingTab from "@/components/mobile/tabs/FundingTab";
import StoreTab from "@/components/mobile/tabs/StoreTab";
import MyPageTab from "@/components/mobile/tabs/MyPageTab";
import { DEFAULT_REGION } from "@/lib/demoRegions";
import type { Region } from "@/types/local";

export default function Home() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [activeTab, setActiveTab] = useState<MobileTab>("feed");

  return (
    <div
      className="flex min-h-screen w-full max-w-md flex-1 flex-col bg-zinc-50
        sm:min-h-0 sm:h-[840px] sm:max-h-[88vh] sm:my-8 sm:overflow-y-auto
        sm:rounded-[2.5rem] sm:border sm:border-zinc-300/70 sm:shadow-2xl sm:shadow-zinc-400/30"
    >
      <MobileHeader region={region} onRegionChange={setRegion} />

      <main className="flex-1">
        {activeTab === "feed" && <FeedTab region={region} />}
        {activeTab === "funding" && <FundingTab />}
        {activeTab === "store" && <StoreTab />}
        {activeTab === "mypage" && <MyPageTab />}
      </main>

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
