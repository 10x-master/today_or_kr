"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Sparkles } from "lucide-react";
import TNoteCalendarDesk from "@/components/note/TNoteCalendarDesk";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function NoteDeskPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="홈으로"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                📝
              </span>
              <h1 className="text-sm font-medium text-slate-900 tracking-tight">
                t.note <span className="text-slate-400 font-normal">스마트 데스크 & 캘린더</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-normal border border-slate-200 transition-colors"
            >
              전체 워크스페이스 →
            </Link>
            <UserAccountDropdown
              currentUser={currentUser}
              onOpenLogin={() => {}}
              onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
              align="right"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        <TNoteCalendarDesk
          userId={currentUser?.id || "ambassador-01"}
          userName={currentUser?.full_name || "김민수 엠버서더"}
          dong="상계동"
        />
      </main>
    </div>
  );
}
