"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, ImageOff, ShieldCheck } from "lucide-react";
import type { DonationCampaign } from "@/types/commerce";

type CampaignWithRate = DonationCampaign & { achievementRate: number };

type CompletedReport = DonationCampaign["completedReports"][number] & {
  campaignId: string;
  campaignTitle: string;
  targetRegion: string;
  beneficiaryDevice: DonationCampaign["beneficiaryDevice"];
};

const DEVICE_LABELS: Record<DonationCampaign["beneficiaryDevice"], string> = {
  mckare: "맥케어",
  ultrasonic_washer: "초음파세척기",
};

/** 데모용: 참여하기 클릭 시 적립을 발생시키는 기준 상품 (복지기기, 건당 5,000원) */
const FUNDING_PRODUCT_ID = "product-003";

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

function ReportThumbnail({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
        <ImageOff className="h-5 w-5 text-zinc-300" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="h-14 w-14 shrink-0 rounded-xl object-cover"
    />
  );
}

export default function FundingTab() {
  const [campaigns, setCampaigns] = useState<CampaignWithRate[]>([]);
  const [reports, setReports] = useState<CompletedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [participatingId, setParticipatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/commerce/funding").then((res) => res.json()),
      fetch("/api/commerce/funding/reports").then((res) => res.json()),
    ])
      .then(([fundingData, reportsData]) => {
        setCampaigns(fundingData.campaigns);
        setReports(reportsData.reports);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleParticipate(campaignId: string) {
    setParticipatingId(campaignId);
    try {
      const res = await fetch("/api/commerce/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, productId: FUNDING_PRODUCT_ID, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error ?? "참여에 실패했습니다.");
        return;
      }

      const updated: CampaignWithRate = data.campaign;
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));

      setToast(
        data.justAchieved
          ? `🎉 목표 달성! ${updated.installNotice?.message}`
          : `${won(data.donatedAmount)}이 적립되었습니다.`
      );
    } finally {
      setParticipatingId(null);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {toast && (
        <div className="rounded-xl bg-zinc-900 px-3.5 py-2.5 text-xs font-medium text-white">
          {toast}
        </div>
      )}

      {campaigns.map((campaign) => {
        const percent = Math.round(campaign.achievementRate * 100);
        return (
          <section
            key={campaign.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <HeartHandshake className="h-5 w-5 text-rose-500" />
              </span>
              <div>
                <p className="text-xs font-semibold text-rose-500">{campaign.targetRegion}</p>
                <h3 className="text-base font-bold text-zinc-900">{campaign.title}</h3>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-zinc-900">
                  {won(campaign.currentAmount)}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  목표 {won(campaign.targetAmount)}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">
                {percent}% 달성 {campaign.isAchieved && "· 목표 달성 완료 🎉"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleParticipate(campaign.id)}
              disabled={participatingId === campaign.id}
              className="mt-4 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              {participatingId === campaign.id ? "적립 중..." : "펀딩 참여하기"}
            </button>
          </section>
        );
      })}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-zinc-900">투명 설치 인증 리포트</h3>
        {reports.map((report) => (
          <article
            key={report.id}
            className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm"
          >
            <ReportThumbnail src={report.photoUrl} alt={report.title} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600">{report.reportNo}</span>
                <span className="text-[11px] text-zinc-400">
                  {DEVICE_LABELS[report.beneficiaryDevice]}
                </span>
              </div>
              <h4 className="mt-1 truncate text-sm font-bold text-zinc-900">{report.title}</h4>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                설치일 {report.installDate} · {report.byline}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
