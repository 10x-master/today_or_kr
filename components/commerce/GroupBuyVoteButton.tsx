"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Flame,
  ArrowRight,
} from "lucide-react";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";

export interface GroupBuyVoteButtonProps {
  itemId: string;
  itemTitle: string;
  initialCount?: number;
  targetCount?: number;
  apartmentName?: string;
  orderFormUrl?: string;
  onVoteChange?: (newCount: number, hasVoted: boolean) => void;
  compact?: boolean;
}

interface StoredVoteData {
  [itemId: string]: {
    count: number;
    voters: string[];
  };
}

const STORAGE_KEY = "today_group_buy_votes";

// 단지별 기본 시드 카운트 (초기 진입 시 70%, 90%, 40% 등의 생생한 게이지 바 제공)
const DEFAULT_SEED_COUNTS: Record<string, number> = {
  "src-1": 7, // 7/10 (70%)
  "src-2": 9, // 9/10 (90%) - 1명만 더 모이면 확정!
  "src-3": 4, // 4/10 (40%)
};

export default function GroupBuyVoteButton({
  itemId,
  itemTitle,
  initialCount,
  targetCount = 10,
  apartmentName = "상계주공 14단지",
  orderFormUrl,
  onVoteChange,
  compact = false,
}: GroupBuyVoteButtonProps) {
  const seedCount =
    initialCount !== undefined
      ? initialCount
      : DEFAULT_SEED_COUNTS[itemId] ?? 5;

  const [count, setCount] = useState<number>(seedCount);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 로컬 스토리지 및 로그인 사용자 동기화
  useEffect(() => {
    let uid: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const savedAuth = localStorage.getItem("today_auth_user");
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          uid = parsed.id || null;
        }
      } catch {}

      if (!uid) {
        getCurrentAuthUser().then((user) => {
          if (user?.id) {
            setCurrentUserId(user.id);
            syncVoteState(user.id);
          }
        });
      } else {
        setCurrentUserId(uid);
        syncVoteState(uid);
      }
    }
  }, [itemId]);

  const syncVoteState = (userId: string | null) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: StoredVoteData = JSON.parse(raw);
        if (data[itemId]) {
          setCount(data[itemId].count);
          if (userId && data[itemId].voters.includes(userId)) {
            setHasVoted(true);
          }
        }
      }
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 공구 투표 / 신청 핸들러
  const handleVoteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. 비로그인 시 처리
    let activeUserId = currentUserId;
    if (!activeUserId && typeof window !== "undefined") {
      try {
        const savedAuth = localStorage.getItem("today_auth_user");
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          activeUserId = parsed.id || null;
        }
      } catch {}
    }

    if (!activeUserId) {
      showToast("⚠️ 로그인 후 단지 공구에 참여할 수 있습니다.");
      // 로그인 모달 이벤트 브로드캐스트
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("today_open_login_modal"));
      }
      return;
    }

    // 2. 투표 토글 로직
    let rawData: StoredVoteData = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) rawData = JSON.parse(raw);
    } catch {}

    const currentItemData = rawData[itemId] || {
      count: count,
      voters: [],
    };

    let nextCount = count;
    let nextVoted = false;

    if (hasVoted) {
      // 투표 취소
      nextCount = Math.max(0, count - 1);
      nextVoted = false;
      currentItemData.voters = currentItemData.voters.filter(
        (v) => v !== activeUserId
      );
      showToast(`취소 완료: [${apartmentName}] 공구 참여가 취소되었습니다.`);
    } else {
      // 투표 완료
      nextCount = count + 1;
      nextVoted = true;
      if (!currentItemData.voters.includes(activeUserId)) {
        currentItemData.voters.push(activeUserId);
      }
      showToast(`✅ [${apartmentName}] 공구 신청이 완료되었습니다!`);
    }

    currentItemData.count = nextCount;
    rawData[itemId] = currentItemData;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    } catch {}

    setCount(nextCount);
    setHasVoted(nextVoted);
    onVoteChange?.(nextCount, nextVoted);
  };

  // 진행률 계산
  const percent = Math.min(100, Math.round((count / targetCount) * 100));
  const isAchieved = count >= targetCount;
  const remaining = Math.max(0, targetCount - count);

  return (
    <div className="w-full space-y-1.5 pt-1">
      {/* 1. 단지별 공구 성사 게이지 바 (Threshold Gauge) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-normal text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            <span>우리 단지 공구 달성률 ({apartmentName})</span>
          </span>

          {isAchieved ? (
            <span className="font-medium text-emerald-600 flex items-center gap-0.5">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span>🎉 공구 진행 확정! 특판가 적용</span>
            </span>
          ) : (
            <span className="font-normal text-amber-700">
              <strong className="font-medium">{count}/{targetCount}명</strong> ({percent}%) · {remaining}명 남음
            </span>
          )}
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAchieved
                ? "bg-emerald-500 shadow-xs"
                : "bg-gradient-to-r from-amber-400 to-amber-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 2. 인터랙티브 투표 버튼 */}
      <div className="flex items-center gap-1.5">
        {hasVoted ? (
          <button
            type="button"
            onClick={handleVoteToggle}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 py-1.5 px-2.5 text-[11px] font-normal transition-colors cursor-pointer"
            title="클릭 시 신청이 취소됩니다"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              신청 완료 (<strong className="font-medium">{count}명</strong> 참여 중)
            </span>
            <span className="text-[10px] text-emerald-600/70 underline ml-1">
              취소
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVoteToggle}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-200/60 py-1.5 px-2.5 text-[11px] font-normal transition-all cursor-pointer active:scale-[0.99]"
          >
            <span>🙋</span>
            <span>
              우리 아파트도 공구 열어주세요 (현재{" "}
              <strong className="font-medium text-amber-950">{count}명</strong> 신청)
            </span>
          </button>
        )}

        {/* 10명 이상 성사 시 단체 주문서 작성 딥링크 활성화 */}
        {isAchieved && orderFormUrl && (
          <a
            href={orderFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2.5 text-[11px] font-medium transition-colors shadow-2xs"
            title="목표 인원 달성! 입주민 단체 특판 주문서를 엽니다"
          >
            <span>단체 주문서</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* 실시간 피드백 토스트 (부드러운 애니메이션 및 2초 자동 소멸) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-normal shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xs">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
