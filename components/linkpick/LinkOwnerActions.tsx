"use client";

import type { PublicLink } from "@/lib/linkpick/links";

// 본인 상품 카드에 붙는 관리 동작. 실제 저장과 화면 갱신은 LinkPage가 맡는다.
export type ManageHandlers = {
  onEdit: (link: PublicLink) => void;
  onHide: (link: PublicLink) => void;
  onDelete: (link: PublicLink) => void;
};

// 수정·숨김·삭제 아이콘 버튼. 회색 선 아이콘의 작은 알약으로 묶어서 썸네일과 글자를 덜 가리고,
// 상품 링크 바깥에 두어서 눌러도 상품 페이지가 열리지 않게 한다.
const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PencilIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function LinkOwnerActions({
  link,
  handlers,
  className = "",
}: {
  link: PublicLink;
  handlers: ManageHandlers;
  className?: string;
}) {
  const buttons = [
    { label: "수정", icon: <PencilIcon />, onClick: () => handlers.onEdit(link) },
    { label: "숨김", icon: <EyeOffIcon />, onClick: () => handlers.onHide(link) },
    { label: "삭제", icon: <TrashIcon />, onClick: () => handlers.onDelete(link) },
  ];

  return (
    <div
      role="group"
      aria-label={`${link.title} 관리`}
      onClick={(event) => {
        // 그룹 여백(버튼 사이 패딩)을 눌러도 카드 링크가 열리지 않게 막는다.
        event.preventDefault();
        event.stopPropagation();
      }}
      className={`flex items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 p-0.5 shadow-sm backdrop-blur-sm ${className}`}
    >
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={(event) => {
            // 카드 전체가 외부 구매 링크로 연결돼 있어서, 관리 버튼 클릭이 그 링크 이동으로 새지 않게 막는다.
            event.preventDefault();
            event.stopPropagation();
            button.onClick();
          }}
          aria-label={`${button.label}: ${link.title}`}
          title={button.label}
          className="flex size-6 min-h-[24px] min-w-[24px] items-center justify-center rounded-full text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-primary"
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}
