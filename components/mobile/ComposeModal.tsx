"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LOCAL_PICK_CATEGORIES, LOCAL_PICK_CATEGORY_LABELS } from "@/lib/localPickCategory";
import type { LocalPickCategory, LocalPost, Region } from "@/types/local";

export default function ComposeModal({
  region,
  onClose,
  onCreated,
}: {
  region: Region;
  onClose: () => void;
  onCreated: (post: LocalPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<LocalPickCategory>("business");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
          category,
          region,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      onCreated(data.post as LocalPost);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-900/50 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900">
            {region.dong} 소식 간편 등록
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LocalPickCategory)}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900"
          >
            {LOCAL_PICK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LOCAL_PICK_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="우리 동네 소식을 들려주세요"
            rows={4}
            className="w-full resize-none rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="이미지 URL (선택)"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />

          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
