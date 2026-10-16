"use client";

import { ExternalLink, FileSignature, Mic, X } from "lucide-react";
import { extractFirstUrl, extractYoutubeId } from "@/lib/diary/dateUtils";
import type { DiaryEvent } from "@/types/diary";

const SIGN_STATUS_BADGE: Record<NonNullable<DiaryEvent["sign_status"]>, { label: string; cls: string } | null> = {
  NONE: null,
  REQUESTED: { label: "✍️ 전자서명 요청중", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "✅ 서명 완료", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function DiaryEventDetailModal({
  event,
  providerName,
  canManage = false,
  onClose,
  onOpenNote,
  onOpenSign,
}: {
  event: DiaryEvent;
  providerName?: string;
  /** 선생님/운영자 등 액션바(t.note·t.sign) 노출 여부 */
  canManage?: boolean;
  onClose: () => void;
  onOpenNote?: () => void;
  onOpenSign?: () => void;
}) {
  const youtubeId = event.media_type === "YOUTUBE" ? extractYoutubeId(event.media_url) : null;
  const legacyImageUrls =
    event.media_type === "IMAGE" && event.media_url
      ? event.media_url.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const imageUrls = Array.from(new Set([...legacyImageUrls, ...(event.image_urls || [])]));
  const applyUrl = extractFirstUrl(event.description);
  const signBadge = event.sign_status ? SIGN_STATUS_BADGE[event.sign_status] : null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {providerName && (
            <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {providerName}
            </span>
          )}
          {signBadge && (
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${signBadge.cls}`}>
              {signBadge.label}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 pr-6 text-sm font-black text-slate-900">{event.title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {event.event_date}
          {event.record_date && event.record_date !== event.event_date && (
            <span className="ml-1.5 text-slate-300">(기록일: {event.record_date})</span>
          )}
        </p>

        {event.description && (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600 whitespace-pre-line">{event.description}</p>
        )}

        {/* 유튜브 임베드 */}
        {youtubeId && (
          <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-slate-950">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={event.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}

        {/* 다중 사진 슬라이더 */}
        {imageUrls.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {imageUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={url}
                alt={`${event.title} 사진 ${idx + 1}`}
                className="h-40 w-auto shrink-0 rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        {/* 음성 청취 */}
        {event.voice_url && (
          <audio controls src={event.voice_url} className="mt-3 w-full">
            <track kind="captions" />
          </audio>
        )}

        {/* 웹링크 스크랩 북마크 카드 */}
        {event.bookmark_urls && event.bookmark_urls.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {event.bookmark_urls.map((b) => (
              <a
                key={b.url}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-100 p-2 hover:bg-slate-50 transition-colors"
              >
                {b.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image} alt={b.title} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-800">{b.title}</p>
                  {b.description && <p className="truncate text-[10px] text-slate-400">{b.description}</p>}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 신청 링크 */}
        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            신청 링크 바로가기
          </a>
        )}

        {/* 통합 액션바: t.note / t.sign */}
        {(onOpenNote || (canManage && onOpenSign)) && (
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
            {onOpenNote && (
              <button
                type="button"
                onClick={onOpenNote}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Mic className="h-3.5 w-3.5" />
                t.note
              </button>
            )}
            {canManage && onOpenSign && (
              <button
                type="button"
                onClick={onOpenSign}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileSignature className="h-3.5 w-3.5" />
                t.sign
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
