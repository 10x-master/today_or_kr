"use client";

import React, { useEffect } from "react";
import { Sparkles, Check } from "lucide-react";
import type { UserPersona } from "@/types/persona";
import { PERSONA_OPTIONS } from "@/types/persona";

export interface PersonaRoleSelectorProps {
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
}

export const PERSONA_STORAGE_KEY = "today_user_persona";

export default function PersonaRoleSelector({
  activePersona,
  onSelectPersona,
}: PersonaRoleSelectorProps) {
  // 컴포넌트 마운트 시 로컬스토리지 동기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PERSONA_STORAGE_KEY) as UserPersona | null;
        if (saved && PERSONA_OPTIONS.some((p) => p.id === saved)) {
          onSelectPersona(saved);
        }
      } catch {}
    }
  }, []);

  const handleSelect = (persona: UserPersona) => {
    onSelectPersona(persona);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PERSONA_STORAGE_KEY, persona);
        window.dispatchEvent(
          new CustomEvent("today_persona_changed", { detail: persona })
        );
      } catch {}
    }
  };

  const currentOption =
    PERSONA_OPTIONS.find((p) => p.id === activePersona) || PERSONA_OPTIONS[0];

  return (
    <div className="w-full bg-white px-3 py-2 border-b border-slate-100 space-y-1.5 select-none">
      {/* 1. 알약형 가로 스크롤 탭 바 */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[10px] text-slate-400 font-normal shrink-0 mr-0.5">
          맞춤 역할:
        </span>

        {PERSONA_OPTIONS.map((item) => {
          const isActive = activePersona === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[9px] font-semibold leading-tight">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. 선택된 역할별 1줄 혜택 가이드 배너 */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70 rounded-lg px-2.5 py-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
          <p className="truncate font-normal text-slate-700">
            <strong className="font-medium text-slate-900">
              [{currentOption.label}]
            </strong>{" "}
            {currentOption.tagline}
          </p>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 font-normal ml-2">
          중기부·소진공 실시간 연동
        </span>
      </div>
    </div>
  );
}
