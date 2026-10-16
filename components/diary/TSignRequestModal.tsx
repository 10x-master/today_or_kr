"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import type { DiaryMember } from "@/types/diary";

const DOC_TYPES = ["전자계약서", "동의서", "가정통신문 확인"];

export default function TSignRequestModal({
  eventId,
  eventTitle,
  members,
  onClose,
  onSent,
}: {
  eventId: string;
  eventTitle: string;
  members: DiaryMember[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>(members.map((m) => m.id));
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await fetch("/api/t-diary/sign-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, doc_type: docType, recipient_ids: selectedIds }),
      });
      setSent(true);
      onSent();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="pr-6 text-sm font-black text-slate-900">✍️ t.sign 전자계약/동의서 발송</h3>
        <p className="mt-0.5 text-[11px] text-slate-400 truncate">{eventTitle}</p>

        {sent ? (
          <div className="mt-6 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-2 text-xs font-bold text-slate-900">카카오톡 전자서명 요청을 발송했습니다 (데모)</p>
          </div>
        ) : (
          <>
            <div className="mt-3">
              <p className="mb-1 text-[11px] font-bold text-slate-500">문서 유형</p>
              <div className="flex gap-1.5">
                {DOC_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      docType === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[11px] font-bold text-slate-500">수신 대상 ({selectedIds.length}명)</p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <span>
                      {m.role} · {m.user_id} ({m.grade_tags.join(", ")})
                    </span>
                  </label>
                ))}
                {members.length === 0 && <p className="text-[11px] text-slate-300">승인된 구성원이 없습니다.</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || selectedIds.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#FEE500] py-3 text-xs font-bold text-[#191919] hover:bg-[#FDD800] disabled:opacity-40 cursor-pointer transition-colors"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "카카오톡으로 전자서명 요청 발송"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
