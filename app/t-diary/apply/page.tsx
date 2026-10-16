"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import type { DiaryProviderType } from "@/types/diary";

const PROVIDER_TYPE_OPTIONS: Array<{ value: DiaryProviderType; label: string }> = [
  { value: "LOCAL_BIZ", label: "🏪 지역 소상공인" },
  { value: "ENTERPRISE", label: "🏢 기업/인쇄" },
  { value: "PUBLIC", label: "🏛️ 지자체/공공" },
  { value: "CREATOR", label: "🎬 강사/크리에이터" },
];

export default function TDiaryApplyPage() {
  const [brandName, setBrandName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [providerType, setProviderType] = useState<DiaryProviderType>("LOCAL_BIZ");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [intro, setIntro] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!brandName.trim() || !contactInfo.trim() || !regionCode.trim()) {
      setError("상호명, 담당자 연락처, 활동 지역은 필수 입력 항목입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/t-diary/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          contact_info: contactInfo.trim(),
          region_code: regionCode.trim(),
          provider_type: providerType,
          business_reg_no: businessRegNo.trim() || null,
          intro: intro.trim() || null,
          youtube_channel: youtubeChannel.trim() || null,
          website_url: websiteUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "신청 처리 중 오류가 발생했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("네트워크 오류로 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="text-lg font-black text-slate-900">신청이 접수되었습니다</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            관리자 심사(통상 1~2 영업일) 후 승인되면 t.다이어리 검색 포털과 우리 동네 소식에 자동으로 노출됩니다.
          </p>
          <Link
            href="/t-diary"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            t.다이어리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        <Link
          href="/t-diary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          t.다이어리로 돌아가기
        </Link>

        <h1 className="mt-4 text-xl font-black text-slate-900 tracking-tight">제공자 등록 신청</h1>
        <p className="mt-1 text-xs text-slate-400">
          신청 즉시 심사 대기(PENDING) 상태로 등록되며, 관리자 승인 후 공개 검색 결과에 노출됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">상호명 *</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="예: 노원 전통시장 상인회"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">담당자 연락처 *</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="예: 02-1234-5678 또는 010-1234-5678"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">활동 지역 (법정동/구) *</label>
            <input
              type="text"
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              placeholder="예: 노원구"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">제공자 유형</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROVIDER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProviderType(opt.value)}
                  className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold transition-colors cursor-pointer ${
                    providerType === opt.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">사업자 등록번호 (선택)</label>
            <input
              type="text"
              value={businessRegNo}
              onChange={(e) => setBusinessRegNo(e.target.value)}
              placeholder="예: 123-45-67890"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">소개글</label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="어떤 행사/소식을 제공하실 예정인지 간단히 소개해주세요."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">대표 유튜브 채널 URL</label>
            <input
              type="url"
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              placeholder="https://www.youtube.com/@..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">인스타그램 또는 홈페이지 링크</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://instagram.com/... 또는 https://..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>신청 처리 중...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>제공자 등록 신청하기</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
