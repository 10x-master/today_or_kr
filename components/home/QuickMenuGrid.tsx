"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import {
  ALL_LAUNCHER_APPS,
  ROLE_DEFAULT_QUICK,
  RECENT_APPS_EVENT,
  readRecentAppIds,
  recordRecentApp,
  type AppLauncherItem,
  type RoleGroup,
} from "@/components/Navigation";

const MAX_APP_CELLS = 7; // 7칸 + [전체] 1칸 = 8칸 그리드

interface QuickMenuGridProps {
  roleGroup: RoleGroup;
  /** 홈 내부 탭 전환이 필요한 앱(/?tab=analysis)을 처리하기 위한 콜백 */
  onOpenHomeTab?: (tab: "analysis") => void;
  onOpenAllServices: () => void;
}

/**
 * 홈 퀵메뉴: 최근 사용 → 핀 고정 → 역할 기본 순으로 최대 7칸 + [전체] 버튼.
 * 쓸수록 내가 자주 쓰는 기능이 앞쪽으로 자동 정렬됩니다.
 */
export default function QuickMenuGrid({
  roleGroup,
  onOpenHomeTab,
  onOpenAllServices,
}: QuickMenuGridProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      setRecentIds(readRecentAppIds());
      try {
        const saved = localStorage.getItem("today_pinned_apps");
        setPinnedIds(saved ? JSON.parse(saved) : []);
      } catch {
        setPinnedIds([]);
      }
    };
    load();
    window.addEventListener(RECENT_APPS_EVENT, load);
    window.addEventListener("today_pinned_apps_changed", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(RECENT_APPS_EVENT, load);
      window.removeEventListener("today_pinned_apps_changed", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const apps = useMemo(() => {
    const ordered = [...recentIds.slice(0, 3), ...pinnedIds, ...ROLE_DEFAULT_QUICK[roleGroup]];
    const seen = new Set<string>();
    const result: AppLauncherItem[] = [];
    for (const id of ordered) {
      if (seen.has(id)) continue;
      const app = ALL_LAUNCHER_APPS.find((a) => a.id === id);
      if (!app) continue;
      seen.add(id);
      result.push(app);
      if (result.length >= MAX_APP_CELLS) break;
    }
    return result;
  }, [recentIds, pinnedIds, roleGroup]);

  const cellClass =
    "group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-1 py-3 text-center transition-all hover:border-blue-200 hover:bg-blue-50/60 active:scale-95";

  return (
    <section aria-label="빠른 메뉴" className="px-3 pt-3 pb-1 bg-white">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-xs font-black tracking-tight text-slate-800">빠른 메뉴</h2>
        <span className="text-[10px] text-slate-400">자주 쓰는 순으로 정렬돼요</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {apps.map((app) => {
          const content = (
            <>
              <span className="text-2xl leading-none transition-transform group-hover:scale-110">
                {app.icon}
              </span>
              <span className="w-full truncate text-[11px] font-bold text-slate-700 group-hover:text-blue-700">
                {app.short}
              </span>
            </>
          );

          if (app.href === "/?tab=analysis" && onOpenHomeTab) {
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  recordRecentApp(app.id);
                  onOpenHomeTab("analysis");
                }}
                className={cellClass}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={app.id}
              href={app.href}
              onClick={() => recordRecentApp(app.id)}
              className={cellClass}
            >
              {content}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenAllServices}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white px-1 py-3 text-center transition-all hover:border-blue-400 hover:bg-blue-50/60 active:scale-95"
          aria-label="전체 서비스 보기"
        >
          <LayoutGrid className="h-6 w-6 text-slate-500 group-hover:text-blue-600" />
          <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-700">
            전체
          </span>
        </button>
      </div>
    </section>
  );
}
