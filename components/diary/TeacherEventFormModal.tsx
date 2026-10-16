"use client";

import { useState } from "react";
import { X } from "lucide-react";

const GRADE_OPTIONS = ["1학년", "2학년", "3학년"];

type RoleChoice = "전체" | "학부모만" | "학생만";

const ROLE_CHOICE_MAP: Record<RoleChoice, string[]> = {
  전체: ["ALL"],
  학부모만: ["PARENT"],
  학생만: ["STUDENT"],
};

export default function TeacherEventFormModal({
  diaryId,
  defaultDate,
  onClose,
  onCreated,
}: {
  diaryId: string;
  defaultDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(defaultDate);
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("전체");
  const [targetGrades, setTargetGrades] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGrade = (grade: string) => {
    setTargetGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/t-diary/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: diaryId,
          title: title.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          is_public: false,
          target_roles: ROLE_CHOICE_MAP[roleChoice],
          target_grades: targetGrades.length ? targetGrades : ["ALL"],
        }),
      });
      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4" onClick={onClose}>
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

        <h3 className="pr-6 text-sm font-black text-slate-900">일정 등록 (공개 대상 선택)</h3>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="설명 (선택)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
          />

          <div>
            <p className="mb-1 text-[11px] font-bold text-slate-500">역할 선택</p>
            <div className="flex gap-1.5">
              {(Object.keys(ROLE_CHOICE_MAP) as RoleChoice[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setRoleChoice(choice)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    roleChoice === choice ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-bold text-slate-500">학년/그룹 필터 (미선택 시 전체)</p>
            <div className="flex flex-wrap gap-1.5">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    targetGrades.includes(g) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
          >
            등록하기
          </button>
        </form>
      </div>
    </div>
  );
}
