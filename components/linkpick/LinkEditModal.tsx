"use client";

import { useState, type FormEvent } from "react";
import { LINK_DESCRIPTION_MAX, LINK_TITLE_MAX, type PublicLink } from "@/lib/linkpick/links";
import { ModalShell } from "./member/ModalShell";
import { errorText, fieldLabel, input, outlineButton, primaryButton } from "./styles";

// linkpick 원본은 커뮤니티 큐레이션 워크스페이스(lib/curate.ts)에서 이 상수를 가져오지만,
// 그 모듈 전체는 이식 범위 밖이라 값만 그대로 들여온다.
const CATEGORY_MAX = 30;

export type LinkEditValues = {
  title: string;
  price: string | null;
  category: string | null;
  description: string | null;
};

// 본인 상품의 상품명·가격·카테고리·한줄설명을 고치는 팝업. 저장 결과(에러 문구)는 onSave가 돌려준다.
export function LinkEditModal({
  link,
  onClose,
  onSave,
}: {
  link: PublicLink;
  onClose: () => void;
  onSave: (values: LinkEditValues) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(link.title);
  const [price, setPrice] = useState(link.price ?? "");
  const [category, setCategory] = useState(link.category ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("상품명을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    const message = await onSave({
      title: trimmedTitle,
      price: price.trim() || null,
      category: category.trim() || null,
      description: description.trim() || null,
    });
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  return (
    <ModalShell labelledBy="link-edit-title" onClose={onClose} maxWidth="max-w-md">
      <h2 id="link-edit-title" className="pr-12 text-xl font-extrabold tracking-tight text-slate-800">
        상품 수정
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="edit-title" className={fieldLabel}>
            상품명
          </label>
          <input
            id="edit-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={LINK_TITLE_MAX}
            className={input}
          />
        </div>

        <div>
          <label htmlFor="edit-price" className={fieldLabel}>
            가격 <span className="font-normal text-slate-500">(비우면 특가로 표시)</span>
          </label>
          <input
            id="edit-price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            maxLength={30}
            placeholder="예: 12,900원"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="edit-category" className={fieldLabel}>
            카테고리 <span className="font-normal text-slate-500">(비우면 기타 상품)</span>
          </label>
          <input
            id="edit-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            maxLength={CATEGORY_MAX}
            placeholder="예: 식품"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="edit-description" className={fieldLabel}>
            한줄 설명
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={LINK_DESCRIPTION_MAX}
            rows={2}
            className={`${input} resize-none`}
          />
        </div>

        {error && (
          <p role="alert" className={errorText}>
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose} className={`${outlineButton} flex-1`}>
            취소
          </button>
          <button type="submit" disabled={saving} className={`${primaryButton} flex-1`}>
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
