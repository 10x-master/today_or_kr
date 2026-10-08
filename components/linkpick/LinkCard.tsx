"use client";

import { useState, type ReactNode } from "react";
import { isSafeHttpUrl, isSafeImageSrc, platformTypeLabel, type PublicLink } from "@/lib/linkpick/links";
import { card, liftCard } from "./styles";

// 2~6열 그리드에 맞춘 고밀도 상품 카드. 이미지는 납작하게, 상품명은 두 줄까지만 보여준다.
// actions는 본인 상품일 때만 넘어온다. 상품 링크 바깥에 두어야 버튼을 눌러도 링크가 열리지 않는다.
export function LinkCard({ link, actions }: { link: PublicLink; actions?: ReactNode }) {
  // 잘못된 주소는 카드를 눌러도 열리지 않도록 링크 대신 안내 카드로 그린다.
  const safe = isSafeHttpUrl(link.url);
  const thumb = link.image_url && isSafeImageSrc(link.image_url) ? link.image_url : null;
  // 가격이 비었거나 공백뿐이면 가격 대신 특가 확인 문구를 보여준다.
  const price = link.price?.trim() ?? "";
  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {thumb ? (
          <Thumbnail src={thumb} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[11px] font-medium text-slate-400">
            이미지 없음
          </div>
        )}
        {!price && (
          <span className="absolute left-1.5 top-1.5 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            🔥 특가
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2 sm:p-2.5">
        <p className="line-clamp-2 min-h-[2rem] text-xs font-normal leading-snug text-slate-800 sm:text-[13px]">
          {link.title}
        </p>
        <div className="mt-auto flex flex-col pt-0.5">
          {price ? (
            <span className="text-sm font-semibold tabular-nums text-red-600">{price}</span>
          ) : (
            <span className="text-xs font-medium text-orange-600">특가 확인하기</span>
          )}
          <span className="text-[10px] font-medium text-primary">{platformTypeLabel[link.platform_type]}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative h-full">
      {safe ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`${card} ${liftCard} flex h-full flex-col overflow-hidden`}
        >
          {body}
        </a>
      ) : (
        <div className={`${card} flex h-full flex-col overflow-hidden opacity-60`}>{body}</div>
      )}
      {actions}
    </div>
  );
}

// 2열 리스트용 컴팩트 행. 왼쪽 64px 정사각 썸네일, 오른쪽에 상품명(1~2줄)과 가격·특가 배지를 세로로 맞춘다.
// 본인 상품이면 관리 버튼은 카드 박스 안쪽 우측 상단에 얹어서(absolute) 세로 여백을 늘리지 않는다.
export function LinkRow({ link, actions }: { link: PublicLink; actions?: ReactNode }) {
  const safe = isSafeHttpUrl(link.url);
  const thumb = link.image_url && isSafeImageSrc(link.image_url) ? link.image_url : null;
  const price = link.price?.trim() ?? "";
  const body = (
    <>
      {thumb ? (
        <Thumbnail src={thumb} className="size-16 shrink-0 rounded-md border border-slate-100 object-cover" />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] font-medium text-slate-400">
          이미지 없음
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {/* 우측 상단에 얹히는 관리 버튼과 안 겹치게, 버튼이 있을 때만 오른쪽에 여백을 둔다. */}
        <p className={`line-clamp-2 text-sm font-normal leading-snug text-slate-800 ${actions ? "pr-8" : ""}`}>
          {link.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {price ? (
            <span className="text-sm font-semibold tabular-nums text-red-600">{price}</span>
          ) : (
            <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              🔥 특가
            </span>
          )}
          <span className="text-[10px] font-medium text-primary">{platformTypeLabel[link.platform_type]}</span>
        </div>
      </div>
    </>
  );

  const className = `${card} flex min-w-0 items-center gap-2 p-2 sm:p-2.5`;
  return (
    <div className="relative h-full">
      {safe ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`${className} ${liftCard} h-full`}
        >
          {body}
        </a>
      ) : (
        <div className={`${className} h-full opacity-60`}>{body}</div>
      )}
      {actions}
    </div>
  );
}

// 썸네일은 외부 이미지라 불러오지 못하면 조용히 사라지고, 카드는 자리표시만 남는다.
export function Thumbnail({
  src,
  className = "size-20 shrink-0 rounded-xl border border-slate-100 object-cover",
}: {
  src: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // 외부 이미지 주소라 next/image 도메인 설정 없이 그대로 쓴다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
