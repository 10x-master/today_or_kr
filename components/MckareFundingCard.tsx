"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Store, ShieldCheck } from "lucide-react";

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export default function MckareFundingCard({
  goalAmount = 30_000_000,
  initialAmount = 18_420_000,
  partnerRestaurants = 42,
  devicesDelivered = 61,
}: {
  goalAmount?: number;
  initialAmount?: number;
  partnerRestaurants?: number;
  devicesDelivered?: number;
}) {
  const [currentAmount, setCurrentAmount] = useState(initialAmount);

  useEffect(() => {
    const tick = setInterval(() => {
      setCurrentAmount((amount) => {
        if (amount >= goalAmount) return amount;
        const next = amount + Math.floor(Math.random() * 15_000) + 5_000;
        return Math.min(next, goalAmount);
      });
    }, 4000);
    return () => clearInterval(tick);
  }, [goalAmount]);

  const percent = Math.min(100, Math.round((currentAmount / goalAmount) * 100));

  return (
    <section
      id="funding"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
          <HeartHandshake className="h-5.5 w-5.5 text-rose-500" />
        </span>
        <div>
          <p className="text-sm font-semibold text-rose-500">동네 식당 상생 모금</p>
          <h3 className="text-lg font-bold text-zinc-900">
            독거노인 안전지킴이 &apos;맥케어&apos; 보급 프로젝트
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-600">
        가맹 식당에서 결제하시면 결제금액의 <b className="text-zinc-900">10%</b>가 비접촉
        심호흡 감지기 &apos;맥케어&apos;를 독거노인 가정에 보급하는 기금으로 자동 적립됩니다.
      </p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-zinc-900">{won(currentAmount)}</span>
          <span className="text-sm font-medium text-zinc-500">목표 {won(goalAmount)}</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs font-medium text-zinc-500">{percent}% 달성 · 실시간 집계</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5">
          <Store className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-600">
            참여 식당 <b className="text-zinc-900">{partnerRestaurants}곳</b>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-600">
            보급 완료 <b className="text-zinc-900">{devicesDelivered}대</b>
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-amber-300"
      >
        맥케어 보급 응원하기
      </button>
    </section>
  );
}
