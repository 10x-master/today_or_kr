"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Gift, Sparkles, X } from "lucide-react";
import type { AdCampaign } from "@/types/officialNotice";

interface SponsoredCardProps {
  campaign: AdCampaign;
  onActionClick?: (campaign: AdCampaign) => void;
}

export default function SponsoredCard({
  campaign,
  onActionClick,
}: SponsoredCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(campaign);
    } else {
      setModalOpen(true);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setSubmitting(true);
    try {
      // marketing_leads 테이블에 접수
      await fetch("https://jyjbsjfjzdfjawwrrhpu.supabase.co/rest/v1/marketing_leads", {
        method: "POST",
        headers: {
          apikey: "sb_publishable_3ZfOLH6y4GUrAJaRL18Hsg_xJKhurN8",
          Authorization: "Bearer sb_publishable_3ZfOLH6y4GUrAJaRL18Hsg_xJKhurN8",
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          subscribed_keyword: campaign.title.slice(0, 30),
          district_code: "1135010500",
          is_marketing_agreed: true,
          source_funnel: "SPONSORED_CARD",
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setModalOpen(false);
        setSubmitted(false);
        setPhoneNumber("");
      }, 2000);
    } catch (err) {
      console.warn("Failed to submit lead:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <article className="group relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 p-4.5 shadow-[0_2px_8px_rgba(79,70,229,0.06)] transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_8px_20px_rgba(79,70,229,0.12)] sm:p-5">
        {/* 상단 라벨 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
              <Gift className="h-3 w-3" />
              <span>{campaign.badge_label || "제휴혜택"}</span>
            </span>
            <span className="text-[11px] font-medium text-indigo-700/80">
              투데이 3+1 네이티브 스폰서드
            </span>
          </div>

          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-amber-500" />
            PARTNER
          </span>
        </div>

        {/* 타이틀 */}
        <h3 className="mt-2.5 text-base font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors sm:text-lg">
          {campaign.title}
        </h3>

        {/* 혜택 요약 */}
        <div className="mt-2.5 rounded-xl bg-white/90 border border-indigo-100 p-3 text-xs leading-relaxed text-slate-700 shadow-2xs">
          <strong className="text-indigo-900 font-semibold">🎁 제휴 혜택: </strong>
          <span>{campaign.benefit_summary}</span>
        </div>

        {/* 하단 CTA 버튼 */}
        <div className="mt-3.5 flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            우리동네 입주민·소상공인 전용 우대
          </span>

          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <span>{campaign.cta_button_text || "혜택 확인하기 ↗"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>

      {/* 혜택 신청 팝업 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {campaign.badge_label || "제휴혜택"}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h4 className="mt-3 text-sm font-bold text-slate-900">
              {campaign.title}
            </h4>
            <p className="mt-1 text-xs text-slate-600">
              {campaign.benefit_summary}
            </p>

            {submitted ? (
              <div className="mt-4 flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-xs font-bold text-slate-900">
                  신청이 접수되었습니다!
                </p>
                <p className="text-[11px] text-slate-500">
                  담당 상담사가 입력하신 번호로 빠르게 안내드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "접수 중..." : "1분 무료 진단/안내 받기"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
