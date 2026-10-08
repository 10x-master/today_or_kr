"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  LINK_DESCRIPTION_MAX,
  LINK_TITLE_MAX,
  LINK_URL_MAX,
  PLATFORM_TYPES,
  isPlatformType,
  isSafeHttpUrl,
  normalizeUrl,
  platformTypeLabel,
  type PlatformType,
  type UserLink,
} from "@/lib/linkpick/links";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { badge, card, errorText, fieldLabel, input, outlineButtonClass, primaryButtonClass } from "../styles";
import { useMember } from "./member-context";

const LINK_COLUMNS =
  "id, title, url, description, image_url, price, platform_type, is_active, sort_order, created_at";

// /api/scrape-product 응답. 실패하면 ok가 false이고 error 코드가 붙는다.
type ScrapeResponse = {
  ok: boolean;
  error?: string;
  data?: {
    title: string | null;
    description: string | null;
    image_url: string | null;
    price: string | null;
  };
};

function scrapeFailureMessage(code: string | undefined): string {
  switch (code) {
    case "unauthorized":
      return "로그인 후 다시 시도해 주세요.";
    case "invalid_url":
    case "blocked_url":
      return "이 주소는 자동으로 불러올 수 없습니다. 직접 입력해 주세요.";
    case "not_html":
      return "상품 페이지 정보를 찾지 못했습니다. 직접 입력해 주세요.";
    default:
      return "정보를 불러오지 못했습니다. 직접 입력해 주세요.";
  }
}

// 로그인한 파트너가 자기 링크를 추가하고 삭제하는 관리 패널. RLS로 본인 링크만 다뤄진다.
export function LinkManager() {
  const { currentUser } = useMember();
  const userId = currentUser?.profileId ?? null;

  // 목록은 어떤 회원의 것인지 함께 보관한다. 계정이 바뀌면 이전 목록을 보여주지 않는다.
  const [linksState, setLinksState] = useState<{
    userId: string;
    rows: UserLink[];
    failed: boolean;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !userId) return;

    let active = true;
    client
      .from("user_links")
      .select(LINK_COLUMNS)
      .eq("profile_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        setLinksState({
          userId,
          rows: error ? [] : ((data ?? []) as UserLink[]),
          failed: Boolean(error),
        });
      });
    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  if (!userId) return null;

  const loaded = linksState?.userId === userId ? linksState : null;
  const links = loaded?.rows ?? [];

  return (
    <section aria-labelledby="link-manager-heading" className="flex flex-col gap-6">
      <div>
        <span className={badge}>내 링크 관리</span>
        <h2 id="link-manager-heading" className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800">
          공개 페이지에 보일 링크
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          추가한 링크는 내 추천 링크로 방문한 고객에게 카드로 보입니다.
        </p>
      </div>

      <LinkForm
        userId={userId}
        nextSortOrder={links.length}
        onSaved={() => setReloadKey((key) => key + 1)}
      />

      <div className={`${card} overflow-hidden`}>
        {!loaded ? (
          <p className="p-6 text-center text-sm text-slate-500">링크를 불러오는 중입니다.</p>
        ) : loaded.failed ? (
          <p className="p-6 text-center text-sm text-red-600">링크를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : links.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">아직 등록한 링크가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {links.map((link) => (
              <LinkRow key={link.id} link={link} onDeleted={() => setReloadKey((key) => key + 1)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LinkForm({
  userId,
  nextSortOrder,
  onSaved,
}: {
  userId: string;
  nextSortOrder: number;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("coupang");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  // 주소를 읽어 제목·설명·가격·이미지를 채운다. 값이 없는 항목은 건드리지 않고, 모든 칸은 그 뒤에도 직접 고칠 수 있다.
  async function fetchProductInfo() {
    const client = getSupabaseBrowserClient();
    const target = url.trim();
    if (!client) return;
    if (!target) {
      setErrors((prev) => ({ ...prev, url: "주소를 먼저 입력해 주세요." }));
      return;
    }

    setErrors((prev) => ({ ...prev, url: "" }));
    setInfoMessage("");
    setFetching(true);
    try {
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setInfoMessage(scrapeFailureMessage("unauthorized"));
        return;
      }

      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: target }),
      });
      const result = (await response.json().catch(() => null)) as ScrapeResponse | null;

      if (!result?.ok || !result.data) {
        setInfoMessage(scrapeFailureMessage(result?.error));
        return;
      }

      const found = result.data;
      if (found.title) setTitle(found.title);
      if (found.description) setDescription(found.description);
      if (found.price) setPrice(found.price);
      if (found.image_url) setImageUrl(found.image_url);
      setInfoMessage("정보를 불러왔습니다. 필요한 부분은 수정해 주세요.");
    } catch {
      setInfoMessage(scrapeFailureMessage(undefined));
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const nextErrors: Record<string, string> = {};
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    const trimmedDescription = description.trim();
    const trimmedPrice = price.trim();
    const trimmedImage = imageUrl.trim();
    const normalizedUrl = normalizeUrl(trimmedUrl);
    const normalizedImage = trimmedImage ? normalizeUrl(trimmedImage) : null;

    if (!trimmedTitle) nextErrors.title = "제목을 입력해 주세요.";
    if (!trimmedUrl) {
      nextErrors.url = "주소를 입력해 주세요.";
    } else if (trimmedUrl.length > LINK_URL_MAX || !isSafeHttpUrl(normalizedUrl)) {
      nextErrors.url = "올바른 주소를 입력해 주세요.";
    }
    if (normalizedImage && (normalizedImage.length > LINK_URL_MAX || !isSafeHttpUrl(normalizedImage))) {
      nextErrors.imageUrl = "이미지 주소는 http 또는 https로 시작해야 합니다.";
    }

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    const { error } = await client.from("user_links").insert({
      profile_id: userId,
      title: trimmedTitle,
      url: normalizedUrl,
      description: trimmedDescription || null,
      image_url: normalizedImage,
      price: trimmedPrice || null,
      platform_type: isPlatformType(platform) ? platform : "custom",
      sort_order: nextSortOrder,
    });
    setPending(false);

    if (error) {
      setSubmitError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setTitle("");
    setUrl("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setPlatform("coupang");
    setInfoMessage("");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${card} flex flex-col gap-4 p-6`}>
      <p className="text-sm font-extrabold text-slate-800">새 링크 추가</p>

      <div>
        <label htmlFor="link-title" className={fieldLabel}>
          제목
        </label>
        <input
          id="link-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={LINK_TITLE_MAX}
          placeholder="예: 강아지 건식사료 최저가"
          aria-invalid={Boolean(errors.title)}
          className={input}
        />
        {errors.title && <p className={errorText}>{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="link-url" className={fieldLabel}>
          주소
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="link-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            maxLength={LINK_URL_MAX}
            placeholder="https://"
            aria-invalid={Boolean(errors.url)}
            className={input}
          />
          <button
            type="button"
            onClick={fetchProductInfo}
            disabled={fetching}
            className={`${outlineButtonClass("sm")} shrink-0`}
          >
            {fetching ? "불러오는 중..." : "정보 불러오기"}
          </button>
        </div>
        {errors.url && <p className={errorText}>{errors.url}</p>}
        {infoMessage && (
          <p aria-live="polite" className="mt-1 text-sm font-bold text-primary">
            {infoMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="link-image" className={fieldLabel}>
            이미지 주소 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <input
            id="link-image"
            type="url"
            inputMode="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            maxLength={LINK_URL_MAX}
            placeholder="https://"
            aria-invalid={Boolean(errors.imageUrl)}
            className={input}
          />
          {errors.imageUrl && <p className={errorText}>{errors.imageUrl}</p>}
        </div>
        {imageUrl.trim() && isSafeHttpUrl(normalizeUrl(imageUrl)) && (
          <div className="flex items-end">
            {/* 외부 이미지 주소라 next/image 도메인 설정 없이 그대로 보여준다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeUrl(imageUrl)}
              alt="썸네일 미리보기"
              referrerPolicy="no-referrer"
              className="size-16 rounded-xl border border-slate-100 object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="link-price" className={fieldLabel}>
          가격 <span className="font-normal text-slate-400">(선택)</span>
        </label>
        <input
          id="link-price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          maxLength={30}
          placeholder="예: 36,810원"
          className={input}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="link-platform" className={fieldLabel}>
            플랫폼
          </label>
          <select
            id="link-platform"
            value={platform}
            onChange={(event) => {
              if (isPlatformType(event.target.value)) setPlatform(event.target.value);
            }}
            className={input}
          >
            {PLATFORM_TYPES.map((type) => (
              <option key={type} value={type}>
                {platformTypeLabel[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="link-description" className={fieldLabel}>
            설명 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <input
            id="link-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={LINK_DESCRIPTION_MAX}
            placeholder="짧은 한 줄 설명"
            className={input}
          />
        </div>
      </div>

      {submitError && <p className={errorText}>{submitError}</p>}

      <button type="submit" disabled={pending} className={`${primaryButtonClass("md")} w-full sm:w-auto sm:self-start`}>
        {pending ? "저장 중..." : "링크 추가"}
      </button>
    </form>
  );
}

function LinkRow({ link, onDeleted }: { link: UserLink; onDeleted: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    if (!window.confirm(`"${link.title}" 링크를 삭제할까요?`)) return;

    setPending(true);
    setError("");
    const { error: deleteError } = await client.from("user_links").delete().eq("id", link.id);
    setPending(false);

    if (deleteError) {
      setError("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    onDeleted();
  }

  return (
    <li className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800">{link.title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {platformTypeLabel[link.platform_type]} · {link.url}
        </p>
        {error && <p className={errorText}>{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 outline-none transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-300 disabled:text-slate-300"
      >
        {pending ? "삭제 중..." : "삭제"}
      </button>
    </li>
  );
}
