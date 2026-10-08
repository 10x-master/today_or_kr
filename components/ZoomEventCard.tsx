"use client";

import { useState } from "react";
import { Video, CalendarDays, Clock, Users } from "lucide-react";

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export default function ZoomEventCard({
  title,
  host,
  date,
  time,
  fee,
  capacity,
  registered,
}: {
  title: string;
  host: string;
  date: string;
  time: string;
  fee: number;
  capacity: number;
  registered: number;
}) {
  const [applied, setApplied] = useState(false);
  const associationShare = Math.round(fee * 0.1);

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
          <Video className="h-4.5 w-4.5 text-sky-500" />
        </span>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-600">
          온라인 Zoom 특강 · 30분
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold leading-6 text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">진행자 · {host}</p>

      <div className="mt-4 space-y-2 text-sm text-zinc-600">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span>{time} (30분)</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <span>
            신청 {registered}/{capacity}명
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50 px-3.5 py-3 text-xs leading-5 text-zinc-500">
        참가비 <b className="text-zinc-900">{won(fee)}</b> · 이 중{" "}
        <b className="text-zinc-900">{won(associationShare)}</b>(10%)는 협회 회비로 자동
        분할 적립됩니다.
      </div>

      <button
        type="button"
        disabled={applied}
        onClick={() => setApplied(true)}
        className={`mt-5 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
          applied
            ? "bg-zinc-100 text-zinc-400"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {applied ? "신청 완료" : "참가 신청"}
      </button>
    </article>
  );
}
