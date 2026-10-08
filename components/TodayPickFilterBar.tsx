"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

const REGION_TREE: Record<string, Record<string, string[]>> = {
  서울특별시: {
    노원구: ["상계동", "중계동", "하계동", "공릉동"],
    강남구: ["역삼동", "삼성동", "대치동"],
  },
  경기도: {
    성남시: ["판교동", "분당동", "정자동"],
    의정부시: ["의정부동", "가능동", "호원동"],
  },
  부산광역시: {
    해운대구: ["우동", "좌동", "송정동"],
    기장군: ["기장읍", "일광면"],
  },
};

const CATEGORIES = [
  "가족 나들이/축제",
  "자녀 교육/장학금",
  "어르신 안심복지",
  "산지 직송 먹거리",
  "동네 집수리",
  "소상공인 혜택",
] as const;

export type TodayPickRegion = {
  sido: string;
  gugun: string;
  dong: string;
};

export default function TodayPickFilterBar({
  onRegionChange,
  onCategoriesChange,
}: {
  onRegionChange?: (region: TodayPickRegion) => void;
  onCategoriesChange?: (categories: string[]) => void;
}) {
  const sidoList = useMemo(() => Object.keys(REGION_TREE), []);
  const [sido, setSido] = useState<string>(sidoList[0]);
  const gugunList = useMemo(() => Object.keys(REGION_TREE[sido]), [sido]);
  const [gugun, setGugun] = useState<string>(gugunList[0]);
  const dongList = useMemo(() => REGION_TREE[sido][gugun] ?? [], [sido, gugun]);
  const [dong, setDong] = useState<string>(dongList[0]);

  const [categories, setCategories] = useState<string[]>([CATEGORIES[0]]);

  useEffect(() => {
    onRegionChange?.({ sido, gugun, dong });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSidoChange(nextSido: string) {
    const nextGugun = Object.keys(REGION_TREE[nextSido])[0];
    const nextDong = REGION_TREE[nextSido][nextGugun][0];
    setSido(nextSido);
    setGugun(nextGugun);
    setDong(nextDong);
    onRegionChange?.({ sido: nextSido, gugun: nextGugun, dong: nextDong });
  }

  function handleGugunChange(nextGugun: string) {
    const nextDong = (REGION_TREE[sido][nextGugun] ?? [])[0];
    setGugun(nextGugun);
    setDong(nextDong);
    onRegionChange?.({ sido, gugun: nextGugun, dong: nextDong });
  }

  function handleDongChange(nextDong: string) {
    setDong(nextDong);
    onRegionChange?.({ sido, gugun, dong: nextDong });
  }

  function toggleCategory(category: string) {
    setCategories((current) => {
      const next = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      onCategoriesChange?.(next);
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <MapPin className="h-4 w-4 text-amber-500" />
        우리 동네 맞춤 픽 설정
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <RegionSelect value={sido} options={sidoList} onChange={handleSidoChange} />
        <RegionSelect value={gugun} options={gugunList} onChange={handleGugunChange} />
        <RegionSelect value={dong} options={dongList} onChange={handleDongChange} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
        관심 카테고리 Pick
        <span className="text-xs font-medium text-zinc-400">(다중 선택 가능)</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const selected = categories.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RegionSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}
