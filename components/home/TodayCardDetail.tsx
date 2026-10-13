"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Inbox,
  MapPin,
  PhoneCall,
  Share2,
  User,
  X,
} from "lucide-react";
import type { LocalOfficialNotice } from "@/types/officialNotice";
import { OFFICIAL_NOTICE_CATEGORIES } from "@/types/officialNotice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface TodayCardDetailProps {
  notice: LocalOfficialNotice | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (notice: LocalOfficialNotice) => void;
}

export default function TodayCardDetail({
  notice,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
}: TodayCardDetailProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedType, setSavedType] = useState<"personal" | "complex" | null>(null);

  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!notice) return null;

  const meta = OFFICIAL_NOTICE_CATEGORIES[notice.category] || {
    label: notice.category,
    icon: "📌",
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badgeText: "text-slate-700",
    borderColor: "border-slate-300",
  };

  const handleShare = () => {
    const shareText = `[${notice.issuing_agency}] ${notice.title}\n📍 영향권: ${
      notice.impact_zone || "관내"
    }\n🔗 원문 링크: ${notice.official_link}`;

    if (navigator.share) {
      navigator.share({
        title: notice.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookmarkClick = () => {
    setBookmarked(!bookmarked);
    onToggleBookmark?.(notice);
  };

  const handleSaveToNote = async (target: "personal" | "complex") => {
    if (!notice) return;
    setSaving(true);
    setShowSaveMenu(false);

    // 1. 3줄 요약과 담당부서 직통전화 자동 조합 텍스트
    const combinedContent = `[핵심 팩트 3줄 요약]\n1. ${notice.summary_1}\n2. ${notice.summary_2}\n3. ${notice.summary_3}${
      notice.contact_info ? `\n\n문의 담당부서: ${notice.contact_info}` : ""
    }`;

    const kaptCode = target === "complex" ? "A113501050" : null;

    const payload = {
      title: notice.title,
      content: combinedContent,
      note_type: "SCHEDULE",
      due_date: notice.publish_date || new Date().toISOString().slice(0, 10),
      linked_notice_id: notice.id,
      linked_kapt_code: kaptCode,
    };

    // 2. Supabase today_notes 테이블에 자동 insert 시도
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("today_notes").insert(payload);
      }
    } catch (err) {
      console.warn("Direct Supabase today_notes insert error:", err);
    }

    // 3. API route 연동 및 로컬 스토어 안전 저장
    try {
      await fetch("/api/today-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("API today-notes insert error:", err);
    }

    // 4. 로컬 스토리지 북마크 동기화
    try {
      const stored = localStorage.getItem("today_notes_bookmarks");
      const currentList: LocalOfficialNotice[] = stored ? JSON.parse(stored) : [];
      if (!currentList.some((item) => item.id === notice.id)) {
        const updated = [notice, ...currentList];
        localStorage.setItem("today_notes_bookmarks", JSON.stringify(updated));
      }
    } catch {}

    setBookmarked(true);
    setSavedType(target);
    onToggleBookmark?.(notice);
    setSaving(false);

    // 5. 성공 시 토스트 알림 표시
    const toastText =
      target === "personal"
        ? "티노트에 저장되었습니다. (t.note 탭에서 확인)"
        : "단지 티단노트에 공유되었습니다. (t.note 탭에서 확인)";
    setToastMessage(toastText);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <>
      {/* 토스트 알림 (Toast) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6"
        >
          {/* 상단 드래그 핸들 (모바일) */}
          <div className="mx-auto -mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

          {/* 헤더 액션 바 */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${meta.badgeBg}`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {notice.issuing_agency}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 타이틀 및 메타 */}
          <div className="mt-3.5">
            {notice.notice_no && (
              <p className="font-mono text-xs text-indigo-600 font-semibold">
                {notice.notice_no}
              </p>
            )}
            <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
              {notice.title}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                발행일: {notice.publish_date}
              </span>
              {notice.impact_zone && (
                <span className="flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  {notice.impact_zone}
                </span>
              )}
            </div>
          </div>

          {/* 팩트 중심 3줄 요약 박스 */}
          <div className="mt-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 p-4">
            <h3 className="mb-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              ⚡ 투데이 핵심 팩트 3줄 브리핑
            </h3>
            <div className="space-y-2.5 text-xs leading-relaxed text-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">핵심 결정: </strong>
                  <span>{notice.summary_1}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">일정·규모: </strong>
                  <span>{notice.summary_2}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">주민 영향: </strong>
                  <span>{notice.summary_3}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 상세 설명문 (details_body) */}
          {notice.details_body && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
              <h4 className="mb-1 font-semibold text-slate-900">📋 행정 상세 안내</h4>
              <p>{notice.details_body}</p>
            </div>
          )}

          {/* 담당부서 직통전화 (contact_info) */}
          {notice.contact_info && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <PhoneCall className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">문의 담당부서</p>
                  <p className="font-semibold text-slate-900">{notice.contact_info}</p>
                </div>
              </div>
              {notice.contact_info.match(/[\d-]+/) && (
                <a
                  href={`tel:${notice.contact_info.match(/[\d-]+/)?.[0]}`}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  전화 연결
                </a>
              )}
            </div>
          )}

          {/* [공유하기], [📥 티노트에 담기] CTA 버튼 */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">복사 완료</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>공유하기</span>
                </>
              )}
            </button>

            {/* [📥 티노트에 담기] 드롭다운 및 액션 버튼 */}
            <div className="relative">
              {showSaveMenu && (
                <>
                  {/* 외부 클릭 감지용 투명 백드롭 */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowSaveMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 sm:w-80">
                    <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-800">보관 위치 선택</span>
                      <span className="text-[10px] text-slate-400">원클릭 자동 등록</span>
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleSaveToNote("personal")}
                        disabled={saving}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-indigo-50/80 transition-colors group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">
                            👤 내 티노트에 담기 <span className="font-normal text-slate-400 text-[10px]">(개인 일정)</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            개인 스케줄과 TODO로 보관 및 캘린더 연동
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToNote("complex")}
                        disabled={saving}
                        className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-emerald-50/80 transition-colors group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                            🏢 단지 티단노트에 공유 <span className="font-normal text-slate-400 text-[10px]">(단지 공용)</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {notice.impact_zone || "상계주공5단지"} 단지 협업팀·주민 공유
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (bookmarked) {
                    handleBookmarkClick();
                  } else {
                    setShowSaveMenu(!showSaveMenu);
                  }
                }}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all ${
                  bookmarked
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    <span>{savedType === "complex" ? "단지 공유됨" : "노트에 담김"}</span>
                  </>
                ) : (
                  <>
                    <Inbox className="h-4 w-4" />
                    <span className="flex items-center gap-1">
                      📥 티노트에 담기 <span className="text-[10px] font-normal text-slate-300">(t.note)</span>
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 최하단 공식 원문 대조 확인 ↗ (외부 이탈 방지 완결형 텍스트 링크) */}
          <div className="mt-4 border-t border-slate-100 pt-3 text-center">
          <a
            href={notice.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-400 hover:text-indigo-600 hover:underline transition-colors"
          >
            <span>공식 원문 대조 확인</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
