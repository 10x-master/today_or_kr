"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Sparkles, Users, Zap } from "lucide-react";
import { DEMO_USER_ID, displayUserName } from "@/lib/demoUser";
import type { CommissionLedgerEntry, UserProfile } from "@/types/auth";

interface CommissionDashboard {
  user: UserProfile;
  totalDownlineCount: number;
  tenXPoints: number;
  levelBreakdown: Array<{ level: number; contributionCount: number; totalAmount: number }>;
  ledgerEntries: CommissionLedgerEntry[];
}

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export default function MyPageTab() {
  const [dashboard, setDashboard] = useState<CommissionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [log, setLog] = useState<CommissionLedgerEntry[]>([]);

  useEffect(() => {
    fetch(`/api/mlm/commission/${DEMO_USER_ID}`)
      .then((res) => res.json())
      .then((data: CommissionDashboard) => setDashboard(data))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!dashboard) return;
    navigator.clipboard.writeText(dashboard.user.referrerCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleTrigger() {
    setTriggering(true);
    try {
      const res = await fetch("/api/mlm/commission/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          contractAmount: 100_000,
          contractType: "10x_insurance_test",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLog((prev) => [...data.distributions, ...prev]);
      }
    } finally {
      setTriggering(false);
    }
  }

  if (loading || !dashboard) {
    return <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>;
  }

  const activeLevels = dashboard.levelBreakdown.filter((l) => l.contributionCount > 0);

  return (
    <div className="flex flex-col px-4 py-6 sm:px-6">
      <section className="border-b border-slate-100 py-6 first:pt-0">
        <p className="text-xs font-semibold text-amber-500">{dashboard.user.name}님의 계정</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-wide text-zinc-900">
            {dashboard.user.referrerCode}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "복사됨" : "추천인 코드 복사"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-zinc-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Users className="h-3.5 w-3.5" />
              산하 조직원 (1~10단계)
            </div>
            <p className="mt-1 text-xl font-extrabold text-zinc-900">
              {dashboard.totalDownlineCount}명
            </p>
          </div>
          <div className="rounded-md bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <Sparkles className="h-3.5 w-3.5" />
              누적 10X 기여 포인트
            </div>
            <p className="mt-1 text-xl font-extrabold text-zinc-900">
              {won(dashboard.tenXPoints)}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 py-6">
        <h3 className="text-sm font-bold text-zinc-900">단계별 기여 내역</h3>
        {activeLevels.length === 0 ? (
          <p className="mt-3 text-xs text-zinc-400">아직 적립된 수당이 없습니다.</p>
        ) : (
          <div className="mt-3 flex flex-col">
            {activeLevels.map((level) => (
              <div
                key={level.level}
                className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-b-0"
              >
                <span className="font-semibold text-zinc-700">{level.level}단계</span>
                <span className="text-zinc-500">{level.contributionCount}건</span>
                <span className="font-bold text-zinc-900">{won(level.totalAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-6">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
            <Zap className="h-4.5 w-4.5 text-amber-300" />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-900">10X 연계 가상 실적 테스트</p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              {dashboard.user.name}님 명의로 10만원 계약이 발생했다고 가정하고, 상위
              추천인에게 2%씩 적립되는 과정을 확인합니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTrigger}
          disabled={triggering}
          className="mt-4 w-full rounded-md bg-zinc-900 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {triggering ? "적립 처리 중..." : "가상 실적 10만원 발생 테스트"}
        </button>

        {log.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-emerald-700">
                  {entry.level}단계 · {displayUserName(entry.beneficiaryUserId)}
                </span>
                <span className="font-bold text-emerald-700">+{won(entry.amount)}</span>
              </div>
            ))}
          </div>
        )}
        {log.length === 0 && (
          <p className="mt-3 text-[11px] text-zinc-400">
            * 상위 추천인이 없는 계정은 적립 내역이 비어 있을 수 있습니다.
          </p>
        )}
      </section>
    </div>
  );
}
