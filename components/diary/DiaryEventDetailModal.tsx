"use client";

import { ExternalLink, X } from "lucide-react";
import { extractFirstUrl, extractYoutubeId } from "@/lib/diary/dateUtils";
import type { DiaryEvent } from "@/types/diary";

export default function DiaryEventDetailModal({
  event,
  providerName,
  onClose,
}: {
  event: DiaryEvent;
  providerName?: string;
  onClose: () => void;
}) {
  const youtubeId = event.media_type === "YOUTUBE" ? extractYoutubeId(event.media_url) : null;
  const imageUrls =
    event.media_type === "IMAGE" && event.media_url
      ? event.media_url.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const applyUrl = extractFirstUrl(event.description);

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

        {providerName && (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {providerName}
          </span>
        )}
        <h3 className="mt-1.5 pr-6 text-sm font-black text-slate-900">{event.title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">{event.event_date}</p>

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

        {/* 사진 슬라이더 */}
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
      </div>
    </div>
  );
}
