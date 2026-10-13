"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  X,
  CheckCircle2,
} from "lucide-react";
import type { LocalPost } from "@/types/local";
import { mockLocalPosts, formatRelativeTime } from "@/lib/db/mockSeed";

interface RealtimeAlertBannerProps {
  onBlindToggle?: (postId: string, isBlinded: boolean) => void;
  className?: string;
}

export default function RealtimeAlertBanner({
  onBlindToggle,
  className = "",
}: RealtimeAlertBannerProps) {
  const [activeAlert, setActiveAlert] = useState<LocalPost | null>(null);
  const [isBlinded, setIsBlinded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 실시간 유저 작성 글 감지 시뮬레이션 및 이벤트 수신
  useEffect(() => {
    // 1. 초기 최근 실제 유저 글 감지 (공공기관 제외)
    const userPosts = mockLocalPosts.filter(
      (p) => p.author.role === "user" || p.author.role === "biz"
    );
    if (userPosts.length > 0) {
      const recent = userPosts[0];
      setActiveAlert(recent);
      setIsBlinded(recent.isBlinded);
    }

    // 2. 외부 또는 웹소켓/커스텀 이벤트 실시간 수신
    const handleRealtimePost = (e: CustomEvent<LocalPost>) => {
      if (e.detail) {
        setActiveAlert(e.detail);
        setIsBlinded(e.detail.isBlinded);
        setDismissed(false);
      }
    };

    window.addEventListener(
      "today_realtime_post" as any,
      handleRealtimePost as EventListener
    );
    return () => {
      window.removeEventListener(
        "today_realtime_post" as any,
        handleRealtimePost as EventListener
      );
    };
  }, []);

  if (dismissed || !activeAlert) return null;

  const handleToggleBlind = () => {
    const nextState = !isBlinded;
    setIsBlinded(nextState);
    activeAlert.isBlinded = nextState;
    onBlindToggle?.(activeAlert.id, nextState);

    // 전역 동기화 이벤트
    window.dispatchEvent(
      new CustomEvent("today_post_blinded", {
        detail: { postId: activeAlert.id, isBlinded: nextState },
      })
    );

    setFeedback(
      nextState
        ? "게시글이 즉시 블라인드 처리되었습니다."
        : "블라인드가 해제되었습니다."
    );
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div
      className={`fixed bottom-24 right-4 z-50 max-w-sm w-full mx-auto sm:right-6 animate-in slide-in-from-bottom-5 duration-200 ${className}`}
    >
      <div className="rounded-2xl border border-rose-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-rose-100">
        {/* 상단 뱃지 & 닫기 버튼 */}
        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-xs font-black text-rose-700 tracking-tight flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              실시간 유저 글 감지 알림
            </span>
            <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[10px] font-bold">
              {formatRelativeTime(activeAlert.createdAt)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="알림 닫기"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 게시글 요약 */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
              📍 {activeAlert.region.dong}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              작성자: {activeAlert.author.name} ({activeAlert.author.badge || "일반주민"})
            </span>
          </div>

          <h4
            className={`text-xs font-bold leading-snug line-clamp-2 ${
              isBlinded ? "line-through text-slate-400" : "text-slate-900"
            }`}
          >
            {activeAlert.title}
          </h4>

          <p
            className={`text-[11px] leading-relaxed line-clamp-1 ${
              isBlinded ? "text-slate-400 italic" : "text-slate-600"
            }`}
          >
            {isBlinded ? "[관리자에 의해 블라인드 처리된 게시글입니다]" : activeAlert.content}
          </p>
        </div>

        {/* 피드백 알림 */}
        {feedback && (
          <div className="mt-2 flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white animate-in fade-in">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* 하단 관리자 액션 바 */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleToggleBlind}
            className={`flex-1 inline-flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              isBlinded
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            {isBlinded ? (
              <>
                <Eye className="h-3.5 w-3.5 text-slate-600" />
                <span>블라인드 해제</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-rose-600" />
                <span>즉시 블라인드</span>
              </>
            )}
          </button>

          <Link
            href="/admin/crm"
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <span>CRM 심사 이동</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
