"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  MapPin,
  PhoneCall,
  Share2,
  Star,
  X,
  CheckCircle2,
} from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";
import type { LocalCafePlace } from "@/types/local";
import type { LocalComplexEvent } from "@/types/officialNotice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface FeedDetailSheetProps {
  notice?: LocalOfficialNotice | null;
  cafe?: LocalCafePlace | null;
  event?: LocalComplexEvent | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (notice: LocalOfficialNotice) => void;
  onOpenResidentVerifyModal?: (event: LocalComplexEvent) => void;
}

export default function FeedDetailSheet({
  notice,
  cafe,
  event,
  isOpen,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  onOpenResidentVerifyModal,
}: FeedDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setToastMessage(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || (!notice && !cafe && !event)) return null;

  // 1. 공고 텍스트 공유
  const handleShare = () => {
    let title = "";
    let text = "";
    let url = typeof window !== "undefined" ? window.location.href : "";

    if (notice) {
      title = notice.title;
      text = `[${notice.issuing_agency}] ${notice.title}\n📍 영향권: ${
        notice.impact_zone || "관내"
      }\n🔗 원문: ${notice.official_link}`;
    } else if (cafe) {
      title = cafe.name;
      text = `[동네카페] ${cafe.name} (${cafe.dong})\n☕ 시그니처: ${cafe.signature_menu}\n🎁 입주민 혜택: ${
        cafe.discount_benefit || "현장 확인"
      }\n📍 주소: ${cafe.address}`;
    } else if (event) {
      title = event.title;
      text = `[단지제휴] ${event.title}\n🎁 혜택: ${
        event.badge_label || event.benefit_summary
      }\n🏢 대상: ${event.complex_name}`;
    }

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 2. t.note에 공고 또는 카페 일정 담기
  const handleSaveToNote = async () => {
    setSavingNote(true);

    try {
      let payload: {
        title: string;
        content: string;
        note_type: string;
        due_date?: string;
        linked_notice_id?: string;
        linked_kapt_code?: string | null;
      };

      if (notice) {
        const combinedContent = `[핵심 팩트 요약]\n1. ${notice.summary_1}\n2. ${
          notice.summary_2
        }\n3. ${notice.summary_3}${
          notice.contact_info ? `\n\n문의 담당: ${notice.contact_info}` : ""
        }\n원문: ${notice.official_link}`;

        payload = {
          title: notice.title,
          content: combinedContent,
          note_type: "SCHEDULE",
          due_date: notice.publish_date || new Date().toISOString().slice(0, 10),
          linked_notice_id: notice.id,
        };

        // 로컬스토리지 북마크 동기화
        try {
          const stored = localStorage.getItem("today_notes_bookmarks");
          const list: LocalOfficialNotice[] = stored ? JSON.parse(stored) : [];
          if (!list.some((item) => item.id === notice.id)) {
            localStorage.setItem(
              "today_notes_bookmarks",
              JSON.stringify([notice, ...list])
            );
          }
        } catch {}

        setBookmarked(true);
        onToggleBookmark?.(notice);
      } else if (cafe) {
        payload = {
          title: `[동네카페 모임] ${cafe.name} (${cafe.dong})`,
          content: `장소: ${cafe.name}\n주소: ${cafe.address}\n시그니처 메뉴: ${
            cafe.signature_menu
          }\n단지 주민 혜택: ${
            cafe.discount_benefit || "입주민 인증 시 우대"
          }\n영업시간: ${cafe.business_hours || "확인 필요"}\n전화: ${
            cafe.phone || "미등록"
          }`,
          note_type: "SCHEDULE",
          due_date: new Date().toISOString().slice(0, 10),
        };
      } else {
        setSavingNote(false);
        return;
      }

      // Supabase & API insert
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("today_notes").insert(payload);
      }
      await fetch("/api/today-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      setToastMessage("t.note 일정에 담겼습니다. (하단 t.note 탭에서 확인)");
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage("t.note에 저장되었습니다.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* 바깥 배경 터치 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 바텀시트 본체 (max-w-md 모바일 컨테이너) */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* 상단 드래그 핸들 */}
        <div className="pt-2.5 pb-1 flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 토스트 알림 메시지 */}
        {toastMessage && (
          <div className="mx-4 my-1 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 상단 네비 바: 닫기 & 공유 */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {notice && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                  OFFICIAL_NOTICE_CATEGORIES[notice.category]?.badgeBg ||
                  "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>{OFFICIAL_NOTICE_CATEGORIES[notice.category]?.icon || "📌"}</span>
                <span>{OFFICIAL_NOTICE_CATEGORIES[notice.category]?.label || notice.category}</span>
              </span>
            )}
            {cafe && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
                <span>☕</span>
                <span>{cafe.category}</span>
              </span>
            )}
            {event && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200">
                <span>🧾</span>
                <span>단지 제휴</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="공유하기"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 상세 내용 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. 카페 상세 내용 */}
          {cafe && (
            <>
              {cafe.image_url && (
                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cafe.image_url}
                    alt={cafe.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-black text-slate-900">{cafe.name}</h1>
                  <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{cafe.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{cafe.address}</span>
                </p>
              </div>

              {/* 입주민 혜택 뱃지 */}
              {cafe.discount_benefit && (
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 p-3.5">
                  <p className="text-[11px] font-bold text-emerald-800">
                    🎁 우리 아파트 입주민 전용 혜택
                  </p>
                  <p className="mt-0.5 text-sm font-black text-emerald-950">
                    {cafe.discount_benefit}
                  </p>
                </div>
              )}

              {/* 시그니처 메뉴 */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                <p className="text-[11px] font-bold text-slate-500">☕ 대표 시그니처 메뉴</p>
                <p className="text-xs font-bold text-slate-800">{cafe.signature_menu}</p>
                {cafe.description && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {cafe.description}
                  </p>
                )}
              </div>

              {/* 영업시간 및 연락처 */}
              <div className="text-xs text-slate-500 space-y-1 pt-1">
                {cafe.business_hours && (
                  <p>⏰ 영업시간: {cafe.business_hours}</p>
                )}
                {cafe.phone && <p>📞 연락처: {cafe.phone}</p>}
              </div>
            </>
          )}

          {/* 2. 공식 행정 고시 상세 내용 */}
          {notice && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  {notice.issuing_agency}
                  {notice.notice_no ? ` · ${notice.notice_no}` : ""}
                </p>
                <h1 className="mt-1 text-base font-black text-slate-900 leading-snug">
                  {notice.title}
                </h1>
                <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-2">
                  <span>게시일: {notice.publish_date.replace(/-/g, ".")}</span>
                  {notice.impact_zone && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-amber-700">
                        영향권: {notice.impact_zone}
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* 핵심 3줄 팩트 요약 카드 */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 space-y-2">
                <p className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>로컬 핵심 팩트 3줄 요약</span>
                </p>
                <div className="space-y-1.5 text-xs text-slate-800 leading-relaxed font-medium">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
                      1
                    </span>
                    <span>{notice.summary_1}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
                      2
                    </span>
                    <span>{notice.summary_2}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
                      3
                    </span>
                    <span>{notice.summary_3}</span>
                  </div>
                </div>
              </div>

              {/* 상세 본문 (있을 경우) */}
              {notice.details_body && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">공고 세부 내용</p>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {notice.details_body}
                  </p>
                </div>
              )}

              {/* 담당 부서 연락처 */}
              {notice.contact_info && (
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <PhoneCall className="h-4 w-4 text-amber-600" />
                    <span>문의처: {notice.contact_info}</span>
                  </div>
                  <a
                    href={`tel:${notice.contact_info.replace(/[^0-9-]/g, "")}`}
                    className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-2xs border border-slate-200 hover:bg-slate-50"
                  >
                    전화걸기
                  </a>
                </div>
              )}
            </>
          )}

          {/* 3. 단지 제휴 이벤트 상세 내용 */}
          {event && (
            <>
              {event.image_url && (
                <div className="overflow-hidden rounded-2xl border border-emerald-100 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-emerald-700">
                  {event.provider_name}
                </span>
                <h1 className="mt-1 text-base font-black text-slate-900 leading-snug">
                  {event.title}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  대상 단지: {event.complex_name}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-bold text-emerald-900">제공 혜택</p>
                <p className="mt-1 text-sm font-black text-emerald-950">
                  {event.badge_label || event.benefit_summary}
                </p>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                  {event.benefit_summary}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 하단 고정 액션 바 */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          {/* t.note 담기 버튼 */}
          {(notice || cafe) && (
            <button
              type="button"
              disabled={savingNote}
              onClick={handleSaveToNote}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              <span>{savingNote ? "저장 중..." : "t.note에 담기"}</span>
            </button>
          )}

          {/* 원문 링크 또는 지도 링크 */}
          {notice?.official_link && (
            <a
              href={notice.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 active:scale-[0.98] transition-all"
            >
              <span>원문 공고 보기</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {cafe?.naver_map_url && (
            <a
              href={cafe.naver_map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100 active:scale-[0.98] transition-all"
            >
              <MapPin className="h-4 w-4 text-emerald-700" />
              <span>네이버 지도</span>
            </a>
          )}

          {event && onOpenResidentVerifyModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenResidentVerifyModal(event);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <span>입주민 인증하고 혜택 받기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
