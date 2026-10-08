"use client";

import { useState } from "react";
import {
  Building2,
  Store,
  GraduationCap,
  Sparkles,
  CircleCheckBig,
} from "lucide-react";

type Tier = {
  id: string;
  name: string;
  amount: number;
  description: string;
};

const TIERS: Tier[] = [
  { id: "chairman", name: "기업 회장사", amount: 100_000_000, description: "최고 등급 파트너십, 전 사업 영역 공동 주관" },
  { id: "vice-chairman", name: "기업 부회장사", amount: 50_000_000, description: "주요 행사 공동 주관 및 브랜드 노출" },
  { id: "director", name: "기업 이사사", amount: 5_000_000, description: "이사회 참여 및 정책 제안권" },
  { id: "corporate", name: "기업 회원사", amount: 3_000_000, description: "협회 공식 파트너사 등재" },
  { id: "good-store", name: "소상공인 회원사 (착한가게)", amount: 500_000, description: "동네 상생 캠페인 가맹점 등록" },
  { id: "individual", name: "일반인 회원", amount: 200_000, description: "정기 소모임 및 봉사활동 참여" },
  { id: "student", name: "대학생 회원", amount: 50_000, description: "청년 프로그램 및 장학 지원 대상" },
  { id: "special", name: "특별회원", amount: 0, description: "추천을 통한 무상 특별 회원" },
];

const TIER_ICON: Record<string, typeof Building2> = {
  chairman: Building2,
  "vice-chairman": Building2,
  director: Building2,
  corporate: Building2,
  "good-store": Store,
  individual: Sparkles,
  student: GraduationCap,
  special: Sparkles,
};

const won = (amount: number) =>
  amount === 0 ? "무료" : `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export default function MembershipSection() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = Boolean(selectedTier) && agreed;

  if (submitted) {
    const tier = TIERS.find((t) => t.id === selectedTier);
    return (
      <section
        id="membership"
        className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm"
      >
        <CircleCheckBig className="mx-auto h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-lg font-bold text-zinc-900">가입 신청이 접수되었습니다</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {tier?.name} 등급으로 신청해주셔서 감사합니다. 담당자가 영업일 기준 1~2일 내 연락드립니다.
        </p>
      </section>
    );
  }

  return (
    <section
      id="membership"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7"
    >
      <h3 className="text-lg font-bold text-zinc-900">파트너십 회원 가입</h3>
      <p className="mt-1 text-sm text-zinc-500">
        한국AI인테리어공간협회와 함께할 8대 회원 등급을 선택해주세요.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {TIERS.map((tier) => {
          const Icon = TIER_ICON[tier.id];
          const selected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                selected
                  ? "border-amber-400 bg-amber-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  selected ? "bg-amber-400" : "bg-zinc-100"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 ${selected ? "text-zinc-900" : "text-zinc-500"}`}
                />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-zinc-900">{tier.name}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{tier.description}</span>
                <span className="mt-1 block text-sm font-bold text-zinc-900">
                  {won(tier.amount)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl bg-zinc-50 p-4 text-sm leading-5 text-zinc-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-amber-400"
        />
        <span>
          본인이 작성·제공한 게시물(사진, 후기, 영상 등)의{" "}
          <b className="text-zinc-900">2차 저작물 제작 및 협회 공식 SNS 게재에 동의</b>하며,
          게시물 작성과 관련하여 발생하는 분쟁에 대해{" "}
          <b className="text-zinc-900">작성자 본인에게 법적 책임이 있음을 확인</b>합니다.
        </span>
      </label>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => setSubmitted(true)}
        className={`mt-5 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
          canSubmit
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : "bg-zinc-100 text-zinc-400"
        }`}
      >
        선택한 등급으로 가입 신청하기
      </button>
    </section>
  );
}
