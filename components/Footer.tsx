"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";

type FooterContent = {
  associationName: string;
  representative: string;
  registrationNumber: string;
  address: string;
  operatorAgency: string;
  operatorPhone: string;
  adminName: string;
  adminHotline: string;
  disclaimer: string;
};

const DEFAULT_CONTENT: FooterContent = {
  associationName: "한국AI인테리어공간협회",
  representative: "조위덕",
  registrationNumber: "316-82-77230",
  address: "경기도 성남시 분당구 판교역로 (판교)",
  operatorAgency: "중소기업 사업전환 지원단",
  operatorPhone: "02-6402-5100",
  adminName: "최광웅",
  adminHotline: "010-5553-8250",
  disclaimer:
    "Today.or.kr은 한국AI인테리어공간협회가 주관하는 지역 밀착형 상생·공익 플랫폼입니다. 게시물에 대한 법적 책임은 작성자 본인에게 있습니다.",
};

const STORAGE_KEY = "today-or-kr-footer-content";

const FIELDS: { key: keyof FooterContent; label: string; multiline?: boolean }[] = [
  { key: "associationName", label: "주관 협회" },
  { key: "representative", label: "대표자" },
  { key: "registrationNumber", label: "고유번호" },
  { key: "address", label: "주소" },
  { key: "operatorAgency", label: "운영 대행사" },
  { key: "operatorPhone", label: "대행사 전화" },
  { key: "adminName", label: "총괄관리자/개인정보·청소년보호책임자" },
  { key: "adminHotline", label: "담당자 핫라인" },
  { key: "disclaimer", label: "안내 문구", multiline: true },
];

export default function Footer() {
  const [content, setContent] = useState<FooterContent>(DEFAULT_CONTENT);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<FooterContent>(DEFAULT_CONTENT);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    // Deferred out of render: reading the clock during the prerender would
    // make the Client Component dynamic under Cache Components.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FooterContent>;
        setContent((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // localStorage unavailable (private mode, etc.) - keep defaults
    }
  }, []);

  function startEditing() {
    setDraft(content);
    setEditMode(true);
  }

  function save() {
    setContent(draft);
    setEditMode(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore persistence failure, draft still applied for this session
    }
  }

  function cancel() {
    setEditMode(false);
  }

  return (
    <footer className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          운영 및 법적 고지
        </span>
        {editMode ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Save className="h-3.5 w-3.5" />
              저장
            </button>
            <button
              type="button"
              onClick={cancel}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500"
            >
              <X className="h-3.5 w-3.5" />
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            title="관리자 인플레이스 수정"
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            관리자 수정
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 text-zinc-500 sm:grid-cols-2">
        {FIELDS.map(({ key, label, multiline }) => (
          <div key={key} className={multiline ? "sm:col-span-2" : ""}>
            <span className="block text-xs font-medium text-zinc-400">{label}</span>
            {editMode ? (
              multiline ? (
                <textarea
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                />
              ) : (
                <input
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900"
                />
              )
            ) : (
              <span className="mt-1 block text-sm text-zinc-700">{content[key]}</span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        ⓒ {year} {content.associationName}. All rights reserved. ·
        Today.or.kr
      </p>
    </footer>
  );
}
