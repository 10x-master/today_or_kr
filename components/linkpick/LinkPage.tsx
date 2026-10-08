"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  isSafeHttpUrl,
  isSafeImageSrc,
  parsePartnerPage,
  parsePublicLink,
  type PartnerPage,
  type PublicLink,
} from "@/lib/linkpick/links";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LinkCard, LinkRow, Thumbnail } from "./LinkCard";
import { LinkEditModal, type LinkEditValues } from "./LinkEditModal";
import { LinkOwnerActions, type ManageHandlers } from "./LinkOwnerActions";
import { useMember } from "./member/member-context";
import { card, liftCard } from "./styles";

const DEFAULT_NAME = "LinkPick";

// 탭 값. 카테고리 탭은 카테고리 이름 그대로 쓴다(한글 태그라 위 두 값과 겹치지 않는다).
const ALL_TAB = "all";
const FEATURED_TAB = "featured";

// 쿠팡 대카테고리별 섹션 머리말 아이콘. 목록에 없는 카테고리는 기본 아이콘을 쓴다.
const CATEGORY_ICONS: Record<string, string> = {
  식품: "🍎",
  생활용품: "🧴",
  가전디지털: "💻",
  가전: "💻",
  뷰티: "💄",
  패션: "👕",
  반려동물: "🐾",
  유아동: "🧸",
  건강: "💊",
  스포츠: "⚽",
  골드박스: "🏷️",
  로켓배송: "🚀",
  로켓프레시: "🥬",
};
const DEFAULT_CATEGORY_ICON = "🛍️";

// 보기 방식(갤러리 그리드 / 리스트)은 브라우저에 기억해 새로고침해도 유지한다.
type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "linkpick:view-mode";
const viewListeners = new Set<() => void>();

function subscribeViewMode(listener: () => void) {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

function readViewMode(): ViewMode {
  try {
    return window.localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function writeViewMode(mode: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // 저장소를 쓸 수 없으면 이번 방문 동안만 적용된다.
  }
  viewListeners.forEach((listener) => listener());
}

function useViewMode(): ViewMode {
  // 서버와 hydration 중에는 기본값(grid)을 쓰고, 이후 저장된 값으로 바꾼다.
  return useSyncExternalStore(subscribeViewMode, readViewMode, () => "grid" as ViewMode);
}

// 추천 상품 영역을 접은 상태. 한 번 접으면 카테고리를 옮기거나 다시 들어와도 접힌 채로 둔다.
const FEATURED_COLLAPSED_KEY = "linkpick:featured-collapsed";
const featuredListeners = new Set<() => void>();
// 저장소를 쓸 수 없는 환경에서도 이번 방문 동안은 접기가 동작하도록 메모리에도 둔다.
let featuredCollapsedInMemory = false;

function subscribeFeaturedCollapsed(listener: () => void) {
  featuredListeners.add(listener);
  return () => {
    featuredListeners.delete(listener);
  };
}

function readFeaturedCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(FEATURED_COLLAPSED_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    // 저장소를 읽을 수 없으면 메모리 값을 쓴다.
  }
  return featuredCollapsedInMemory;
}

function writeFeaturedCollapsed(collapsed: boolean) {
  featuredCollapsedInMemory = collapsed;
  try {
    window.localStorage.setItem(FEATURED_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // 저장소에 쓸 수 없으면 이번 방문 동안만 적용된다.
  }
  featuredListeners.forEach((listener) => listener());
}

function useFeaturedCollapsed(): boolean {
  // 서버와 hydration 중에는 펼친 상태로 그리고, 이후 저장된 값으로 바꾼다.
  return useSyncExternalStore(subscribeFeaturedCollapsed, readFeaturedCollapsed, () => false);
}

function tabLabel(tab: string): string {
  if (tab === FEATURED_TAB) return "⭐ 추천픽";
  if (tab === ALL_TAB) return "전체";
  return tab;
}

function filterLinks(links: PublicLink[], tab: string): PublicLink[] {
  if (tab === FEATURED_TAB) return links.filter((link) => link.is_featured);
  if (tab === ALL_TAB) return links;
  return links.filter((link) => link.category === tab);
}

// 본인이 숨기거나 지운 링크는 빼고, 고친 값은 원래 링크 위에 덮어쓴다.
function applyLinkChanges(
  links: PublicLink[],
  removed: ReadonlySet<string>,
  edits: Record<string, Partial<PublicLink>>,
): PublicLink[] {
  return links
    .filter((link) => !removed.has(link.id))
    .map((link) => (edits[link.id] ? { ...link, ...edits[link.id] } : link));
}

type View = {
  // partner: 추천 코드로 찾은 파트너, preview: 로그인한 본인 링크 미리보기, default: 기본 브랜딩.
  mode: "partner" | "preview" | "default";
  name: string;
  links: PublicLink[];
};

// 추천 코드로 찾은 파트너의 프로필과 링크를 보여주는 방문자 메인 화면.
// 추천 코드가 없거나 찾지 못하면, 로그인한 회원이라면 본인 링크를 미리보기로 보여주고, 아니면 기본 브랜딩만 보여준다.
export function LinkPage() {
  const { refCode, currentUser } = useMember();
  const userId = currentUser?.profileId ?? null;

  const [refFetched, setRefFetched] = useState<{ code: string; page: PartnerPage | null } | null>(
    null,
  );
  const [ownFetched, setOwnFetched] = useState<{ userId: string; links: PublicLink[] } | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const viewMode = useViewMode();
  // 본인이 고친·숨긴·지운 링크를 새로고침 없이 화면에 바로 반영한다. 값은 이 방문 동안만 유지된다.
  const [linkEdits, setLinkEdits] = useState<Record<string, Partial<PublicLink>>>({});
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [editingLink, setEditingLink] = useState<PublicLink | null>(null);
  const [manageError, setManageError] = useState("");

  // 추천 코드로 파트너 페이지를 조회한다. 결과가 형식에 맞지 않으면 null로 취급한다.
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !refCode) return;

    let active = true;
    client.rpc("partner_page", { p_code: refCode }).then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("[partner_page] 조회 실패", error.message);
      setRefFetched({ code: refCode, page: error ? null : parsePartnerPage(data) });
    });
    return () => {
      active = false;
    };
  }, [refCode]);

  // 로그인한 회원이면 본인 활성 링크를 미리보기용으로 읽는다. RLS상 본인 행만 읽힌다.
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !userId) return;

    let active = true;
    client
      .from("user_links")
      .select("id, title, url, description, image_url, price, platform_type, category, is_featured")
      .eq("profile_id", userId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("[user_links] 미리보기 조회 실패", error.message);
        const rows = Array.isArray(data) ? data : [];
        setOwnFetched({
          userId,
          links: error ? [] : rows.flatMap((row) => {
            const link = parsePublicLink(row);
            return link ? [link] : [];
          }),
        });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const resolved = resolveView({
    refPage: refCode && refFetched?.code === refCode ? refFetched.page : null,
    userName: currentUser?.displayName ?? null,
    ownLinks: userId && ownFetched?.userId === userId ? ownFetched.links : null,
  });
  // 이후 화면 계산은 모두 이 목록을 쓴다. 숨기거나 지운 링크는 빠지고, 고친 값은 바로 반영된다.
  const view = { ...resolved, links: applyLinkChanges(resolved.links, removedIds, linkEdits) };

  // 본인 상품인지 판단한다. 내 피드(preview)는 전부 내 링크다.
  // 남의 추천 페이지(partner)는 내 추천 코드와 페이지의 ref 코드가 같을 때만 내 것으로 본다.
  // 공개 함수는 profile_id를 내보내지 않으므로 이 판단은 화면 표시용이고, 실제 쓰기 권한은 RLS가 막는다.
  const canManage =
    Boolean(currentUser) &&
    (view.mode === "preview" || (view.mode === "partner" && currentUser?.referralCode === refCode));
  const hasCoupang = view.links.some((link) => link.platform_type === "coupang");

  // 추천픽 코너와 카테고리 탭은 현재 링크에서 만든다. 선택한 탭이 사라졌으면 전체로 돌아간다.
  const featuredLinks = view.links.filter((link) => link.is_featured);
  const categories = [...new Set(view.links.flatMap((link) => (link.category ? [link.category] : [])))];
  const tabs = [...(featuredLinks.length > 0 ? [FEATURED_TAB] : []), ALL_TAB, ...categories];
  // 카테고리별 추천 상품 수. 1개 이상인 카테고리 탭에 배지로 보여준다.
  // 추천 순서는 서버가 준 순서(sort_order, 등록순)를 그대로 쓴다.
  const featuredCounts = new Map<string, number>();
  for (const link of featuredLinks) {
    if (link.category) featuredCounts.set(link.category, (featuredCounts.get(link.category) ?? 0) + 1);
  }
  const currentTab = tabs.includes(activeTab) ? activeTab : ALL_TAB;
  const shownLinks = filterLinks(view.links, currentTab);
  const hasPrice = shownLinks.some((link) => link.price?.trim());

  // 본인 링크의 쓰기. RLS가 본인 행만 바꾸게 하므로, 돌려받은 행이 없으면 실패로 본다.
  async function removeLink(link: PublicLink) {
    if (!window.confirm(`"${link.title}" 링크를 삭제할까요? 삭제하면 되돌릴 수 없습니다.`)) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setManageError("");
    const { data, error } = await client.from("user_links").delete().eq("id", link.id).select("id");
    if (error || !data?.length) {
      setManageError("삭제하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setRemovedIds((prev) => new Set(prev).add(link.id));
  }

  async function hideLink(link: PublicLink) {
    if (!window.confirm(`"${link.title}" 링크를 숨길까요? 방문자 화면에서 사라집니다.`)) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setManageError("");
    const { data, error } = await client
      .from("user_links")
      .update({ is_active: false })
      .eq("id", link.id)
      .select("id");
    if (error || !data?.length) {
      setManageError("숨기지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setRemovedIds((prev) => new Set(prev).add(link.id));
  }

  async function saveLink(link: PublicLink, values: LinkEditValues): Promise<string | null> {
    const client = getSupabaseBrowserClient();
    if (!client) return "저장 설정을 준비 중입니다. 잠시 후 다시 시도해 주세요.";
    const { data, error } = await client
      .from("user_links")
      .update({
        title: values.title,
        price: values.price,
        category: values.category,
        description: values.description,
      })
      .eq("id", link.id)
      .select("id");
    if (error || !data?.length) return "저장하지 못했습니다. 다시 시도해 주세요.";
    setLinkEdits((prev) => ({ ...prev, [link.id]: values }));
    return null;
  }

  // 본인 상품일 때만 관리 버튼을 넘긴다. 방문자에게는 null이라 아무것도 그리지 않는다.
  const manage: ManageHandlers | null = canManage
    ? { onEdit: setEditingLink, onHide: hideLink, onDelete: removeLink }
    : null;

  return (
    <div className="w-full">
      <header className="flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-extrabold text-primary">
            {view.name.charAt(0)}
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate text-base font-extrabold text-slate-800">{view.name}</h1>
            {view.mode === "partner" && (
              <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                공식 파트너
              </span>
            )}
            {view.mode === "preview" && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                미리보기
              </span>
            )}
          </div>
        </div>
        <ShareButton />
      </header>

      {/* 탭은 헤더 바로 아래에 두고, 스크롤해도 상단에 붙어 있게 한다. */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-2 bg-white/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        {tabs.length > 1 && (
          <CategoryTabs tabs={tabs} active={currentTab} onSelect={setActiveTab} counts={featuredCounts} />
        )}
        <ViewToggle mode={viewMode} />
      </div>

      {manageError && (
        <p role="alert" className="mt-3 text-sm font-bold text-red-600">
          {manageError}
        </p>
      )}

      {featuredLinks.length > 0 && <FeaturedStrip links={featuredLinks} manage={manage} />}

      {/* 탭을 바꾸면 목록이 key로 새로 그려지면서 짧게 나타난다. */}
      <div
        key={currentTab}
        className="mt-4 w-full motion-safe:animate-[link-list-in_300ms_ease-out]"
      >
        {hasPrice && (
          <p className="mb-4 text-[11px] text-gray-400">
            * 가격과 재고는 쿠팡 판매자 사정에 따라 실시간으로 변동될 수 있습니다.
          </p>
        )}
        {currentTab === ALL_TAB ? (
          <CategorySections links={shownLinks} mode={viewMode} manage={manage} />
        ) : (
          <LinkCollection links={shownLinks} mode={viewMode} manage={manage} />
        )}
      </div>

      {view.mode === "partner" && view.links.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">아직 등록된 링크가 없습니다.</p>
      )}
      {view.mode === "preview" && view.links.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">
          아직 등록한 링크가 없습니다. 아래 &apos;내 링크 관리&apos;에서 링크를 추가해 보세요.
        </p>
      )}
      {view.mode === "default" && (
        <p className="mt-10 text-center text-sm text-slate-500">
          파트너 추천 링크로 방문하면 파트너의 추천 상품을 볼 수 있습니다.
        </p>
      )}

      {hasCoupang && (
        <p className="mx-auto mt-10 max-w-md text-center text-xs font-bold leading-relaxed text-slate-600">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      )}

      {editingLink && (
        <LinkEditModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={(values) => saveLink(editingLink, values)}
        />
      )}
    </div>
  );
}

// 페이지 주소를 복사하거나, 지원하는 기기에서는 공유 창을 연다.
function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 공유를 취소하거나 권한이 없으면 조용히 넘어간다.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      {copied ? "링크 복사됨" : "공유하기"}
    </button>
  );
}

// 어떤 데이터로 화면을 그릴지 한 곳에서 정한다.
// 1) 추천 코드로 찾은 파트너 → 2) 로그인한 본인 링크 미리보기 → 3) 기본 브랜딩.
function resolveView({
  refPage,
  userName,
  ownLinks,
}: {
  refPage: PartnerPage | null;
  userName: string | null;
  ownLinks: PublicLink[] | null;
}): View {
  if (refPage) {
    return { mode: "partner", name: refPage.name ?? "파트너", links: refPage.links };
  }

  // 추천 코드가 없거나 못 찾은 경우에도 로그인한 본인 링크가 있으면 본인 페이지를 보여준다.
  if (ownLinks !== null && userName) {
    return { mode: "preview", name: userName, links: ownLinks };
  }

  return { mode: "default", name: DEFAULT_NAME, links: [] };
}

// 갤러리: 모바일 2열, PC 3~4열 그리드. 리스트: 한 줄씩 가로 행.
function LinkCollection({
  links,
  mode,
  manage,
}: {
  links: PublicLink[];
  mode: ViewMode;
  manage: ManageHandlers | null;
}) {
  if (mode === "list") {
    return (
      <ul className="grid w-full grid-cols-2 gap-2 sm:gap-3">
        {links.map((link) => (
          <li key={link.id} className="min-w-0">
            <LinkRow
              link={link}
              actions={
                manage && (
                  <LinkOwnerActions link={link} handlers={manage} className="absolute right-2 top-2 z-10" />
                )
              }
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {links.map((link) => (
        <li key={link.id} className="min-w-0">
          <LinkCard
            link={link}
            actions={
              manage && (
                <LinkOwnerActions link={link} handlers={manage} className="absolute right-2 top-2 z-10" />
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}

// 갤러리(⊞)와 리스트(☰) 보기 전환. 고른 방식은 브라우저에 기억한다.
function ViewToggle({ mode }: { mode: ViewMode }) {
  const options: { value: ViewMode; label: string; icon: string }[] = [
    { value: "grid", label: "갤러리 보기", icon: "⊞" },
    { value: "list", label: "리스트 보기", icon: "☰" },
  ];

  return (
    <div role="group" aria-label="보기 방식" className="flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5">
      {options.map((option) => {
        const selected = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.label}
            onClick={() => writeViewMode(option.value)}
            className={`flex size-8 items-center justify-center rounded-full text-base transition-colors ${
              selected ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden>{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

// '전체' 탭: 카테고리별로 머리말을 붙여 섹션으로 나눈다. 카테고리가 없는 링크는 맨 뒤에 모은다.
function CategorySections({
  links,
  mode,
  manage,
}: {
  links: PublicLink[];
  mode: ViewMode;
  manage: ManageHandlers | null;
}) {
  const groups = new Map<string | null, PublicLink[]>();
  for (const link of links) {
    const key = link.category ?? null;
    groups.set(key, [...(groups.get(key) ?? []), link]);
  }
  const sorted = [...groups].sort(
    ([a], [b]) => Number(a === null) - Number(b === null),
  );

  return (
    <div className="flex flex-col gap-6">
      {sorted.map(([category, items]) => (
        <section key={category ?? "uncategorized"} aria-label={category ?? "기타 상품"}>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <span aria-hidden>{category ? (CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON) : "🛒"}</span>
            {category ?? "기타 상품"}
            <span className="text-xs font-normal tabular-nums text-slate-400">{items.length}</span>
          </h2>
          <LinkCollection links={items} mode={mode} manage={manage} />
        </section>
      ))}
    </div>
  );
}

// 상단 고정 카테고리 칩 탭 바. 가로로 밀어서 넘긴다.
function CategoryTabs({
  tabs,
  active,
  onSelect,
  counts,
}: {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
  counts: ReadonlyMap<string, number>;
}) {
  return (
    <div role="tablist" aria-label="카테고리" className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tab)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tabLabel(tab)}
            {(counts.get(tab) ?? 0) > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 text-[11px] font-extrabold tabular-nums ${
                  selected ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                {counts.get(tab)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 추천 상품 한 줄 가로 스크롤. 접으면 작은 칩 하나만 남고, 접은 상태는 브라우저에 기억한다.
function FeaturedStrip({ links, manage }: { links: PublicLink[]; manage: ManageHandlers | null }) {
  const collapsed = useFeaturedCollapsed();

  return (
    <div className="mt-3">
      {/* 접기는 grid 행 높이를 0fr로 줄여서 매끄럽게 닫힌다. 닫힌 동안에는 안쪽을 inert로 막는다. */}
      <div
        inert={collapsed}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <section aria-label="추천 상품" className="min-h-0 overflow-hidden">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-slate-800">
              ⭐ 추천 상품 <span className="font-normal tabular-nums text-slate-400">{links.length}</span>
            </p>
            <button
              type="button"
              onClick={() => writeFeaturedCollapsed(true)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              ✕ 추천 상품 접기
            </button>
          </div>
          <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:none]">
            {links.map((link) => (
              <li key={link.id} className="shrink-0 snap-start">
                <FeaturedChip link={link} manage={manage} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={() => writeFeaturedCollapsed(false)}
          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
        >
          ✨ 추천 상품 보기 ({links.length}개)
        </button>
      )}
    </div>
  );
}

// 추천 상품 한 칸: 작은 썸네일, 상품명 한 줄, 가격. 본인 상품이면 관리 버튼을 오른쪽에 붙인다.
function FeaturedChip({ link, manage }: { link: PublicLink; manage: ManageHandlers | null }) {
  const safe = isSafeHttpUrl(link.url);
  const thumb = link.image_url && isSafeImageSrc(link.image_url) ? link.image_url : null;
  const price = link.price?.trim() ?? "";
  const body = (
    <>
      <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {thumb && <Thumbnail src={thumb} className="size-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-normal text-slate-800">{link.title}</span>
        {price ? (
          <span className="block text-sm font-semibold tabular-nums text-red-600">{price}</span>
        ) : (
          <span className="block text-[11px] font-medium text-orange-600">특가 확인하기</span>
        )}
      </span>
    </>
  );
  // 관리 버튼 세 개(약 104px)가 들어갈 만큼 오른쪽 여백을 둔다.
  const className = `${card} flex w-60 items-center gap-2.5 p-2 ${manage ? "pr-24" : "pr-3"}`;

  return (
    <div className="relative">
      {safe ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`${className} ${liftCard}`}
        >
          {body}
        </a>
      ) : (
        <div className={`${className} opacity-60`}>{body}</div>
      )}
      {manage && (
        <LinkOwnerActions link={link} handlers={manage} className="absolute right-2 top-1/2 z-10 -translate-y-1/2" />
      )}
    </div>
  );
}
