"use client";

import { useEffect, type ReactNode } from "react";

// 모든 모달이 공통으로 쓰는 껍데기. 화면 정중앙에 띄우고, 배경 클릭·ESC·X 버튼으로 닫는다.
// 모달이 열려 있는 동안에는 뒤쪽 페이지 스크롤을 막는다.
export function ModalShell({
  labelledBy,
  onClose,
  maxWidth = "max-w-lg",
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  maxWidth?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        className={`modal-panel relative max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-8`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold leading-none text-slate-800 shadow-sm outline-none transition-colors hover:bg-slate-900 hover:text-white focus-visible:ring-2 focus-visible:ring-primary"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
