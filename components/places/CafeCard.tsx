"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  ExternalLink,
  Gift,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import type { CafeCategory, LocalCafePlace } from "@/types/local";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface CafeCardProps {
  cafe: LocalCafePlace;
  onSaveToNote?: (cafe: LocalCafePlace) => void;
  viewMode?: "card" | "list";
}

const CAFE_CATEGORY_META: Record<
  CafeCategory,
  { label: string; icon: string; badgeClass: string }
> = {
  ROASTERY: {
    label: "로스팅 전문",
    icon: "☕",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  BAKERY_CAFE: {
    label: "베이커리 카페",
    icon: "🥐",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
  },
  STUDY: {
    label: "스터디·미팅",
    icon: "📚",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  DESSERT: {
    label: "디저트 맛집",
    icon: "🍰",
    badgeClass: "bg-pink-50 text-pink-800 border-pink-200",
  },
  COMMUNITY: {
    label: "주민 커뮤니티",
    icon: "🏡",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export default function CafeCard({
  cafe,
  onSaveToNote,
  viewMode = "card",
}: CafeCardProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const catMeta = CAFE_CATEGORY_META[cafe.category] || {
    label: cafe.category,
    icon: "☕",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  };

  // t.note에 모임 일정으로 자동 저장
  const handleSaveToTNote = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const noteTitle = `[카페 모임] ${cafe.name}`;
    const noteContent = `📍 장소: ${cafe.name} (${cafe.dong})
🏠 주소: ${cafe.address}
☕ 시그니처 메뉴: ${cafe.signature_menu}${
      cafe.discount_benefit ? `\n🎁 입주민 혜택: ${cafe.discount_benefit}` : ""
    }${cafe.business_hours ? `\n⏰ 영업시간: ${cafe.business_hours}` : ""}`;

    const newNote = {
      id: `cafe-note-${Date.now()}`,
      title: noteTitle,
      content: noteContent,
      note_type: "SCHEDULE",
      due_date: new Date().toISOString().slice(0, 10),
      alert_time: "14:00",
      status: "TODO",
      created_at: new Date().toISOString(),
    };

    // 1. Supabase insert 시도
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("today_notes").insert({
          title: newNote.title,
          content: newNote.content,
          note_type: newNote.note_type,
          due_date: newNote.due_date,
          status: newNote.status,
        });
      }
    } catch (err) {
      console.warn("Direct Supabase today_notes insert warning:", err);
    }

    // 2. LocalStorage today_notes 동기화
    try {
      const savedNotes = localStorage.getItem("today_notes_local");
      const list = savedNotes ? JSON.parse(savedNotes) : [];
      list.unshift(newNote);
      localStorage.setItem("today_notes_local", JSON.stringify(list));
    } catch {}

    setIsSaved(true);
    setToastMessage(`[${cafe.name}] 모임 일정이 t.note에 저장되었습니다!`);

    if (onSaveToNote) {
      onSaveToNote(cafe);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 지도 URL 생성 (네이버 지도 우선, 없으면 검색 링크)
  const mapUrl =
    cafe.naver_map_url ||
    cafe.kakao_map_url ||
    `https://map.naver.com/p/search/${encodeURIComponent(
      `${cafe.name} ${cafe.dong}`
    )}`;

  if (viewMode === "list") {
    return (
      <article className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all">
        {toastMessage && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg animate-in fade-in duration-150">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cafe.image_url}
              alt={cafe.name}
              className="h-20 w-20 rounded-xl object-cover shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${catMeta.badgeClass}`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                </span>
                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{cafe.rating.toFixed(1)}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cafe.dong}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {cafe.name}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-1">
                ☕ {cafe.signature_menu}
              </p>

              {cafe.discount_benefit && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  <Gift className="h-3 w-3 text-purple-600" />
                  <span>{cafe.discount_benefit}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
            >
              <span>🗺️ 지도</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <button
              type="button"
              onClick={handleSaveToTNote}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Calendar className="h-3 w-3" />
              <span>{isSaved ? "담김 완료" : "t.note 담기"}</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Pure White 모듈러 카드 기본 모드
  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-indigo-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-1.5 rounded-2xl bg-slate-900/95 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="line-clamp-1">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/workspace")}
            className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] text-white hover:bg-indigo-500 shrink-0 font-bold"
          >
            열기
          </button>
        </div>
      )}

      <div>
        {/* 1. 상단 썸네일 이미지 및 플로팅 배지 */}
        <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cafe.image_url}
            alt={cafe.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* 좌측 상단 카테고리 칩 */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs border border-white/40">
              <span>{catMeta.icon}</span>
              <span>{catMeta.label}</span>
            </span>
          </div>

          {/* 우측 상단 평점 */}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{cafe.rating.toFixed(1)}</span>
          </div>

          {/* 하단 입주민 혜택 뱃지 (보라색 / 초록색 포인트) */}
          {cafe.discount_benefit && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/95 backdrop-blur-xs px-3 py-1.5 text-xs font-extrabold text-white shadow-md border border-purple-400/50">
                <Gift className="h-3.5 w-3.5 text-amber-300 animate-bounce" />
                <span className="line-clamp-1">{cafe.discount_benefit}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. 카페 본문 정보 */}
        <div className="mt-4 space-y-2">
          {/* 상호명 및 위치 */}
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {cafe.name}
            </h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {cafe.dong}
            </span>
          </div>

          {/* 주소 */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{cafe.address}</span>
          </div>

          {/* 시그니처 메뉴 박스 */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3">
            <div className="flex items-start gap-2">
              <Coffee className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-amber-900">시그니처 메뉴</p>
                <p className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                  {cafe.signature_menu}
                </p>
              </div>
            </div>
          </div>

          {/* 간이 소개글 */}
          {cafe.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-0.5">
              {cafe.description}
            </p>
          )}

          {/* 영업시간 */}
          {cafe.business_hours && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
              <Clock className="h-3 w-3" />
              <span>{cafe.business_hours}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 하단 액션 버튼 2개: [🗺️ 지도 보기] + [📅 t.note에 모임 일정 담기] */}
      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 py-2.5 text-xs font-bold text-slate-700 transition-all text-center shadow-2xs"
          title="네이버/카카오 지도에서 장소 보기"
        >
          <span>🗺️ 지도 보기</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>

        <button
          type="button"
          onClick={handleSaveToTNote}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
          title="이 카페를 모임 장소로 t.note에 담기"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>{isSaved ? "담김 완료 ✓" : "📅 t.note 담기"}</span>
        </button>
      </div>
    </article>
  );
}
