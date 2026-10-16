"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { getLicenseBadgeInfo } from "@/lib/diary/licenseUtils";
import type { DiaryBrand, DiaryLicenseStatus, DiaryMember, DiaryPlan } from "@/types/diary";

const PLAN_OPTIONS: DiaryPlan[] = ["BUNDLE", "PRO", "ENTERPRISE"];
const STATUS_OPTIONS: DiaryLicenseStatus[] = ["ACTIVE", "GRACE_PERIOD", "EXPIRED", "SUSPENDED"];

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function AdminDiariesPage() {
  const [diaries, setDiaries] = useState<DiaryBrand[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [forceAdminMode, setForceAdminMode] = useState(true);

  // 라이선스 폼 상태
  const [plan, setPlan] = useState<DiaryPlan>("BUNDLE");
  const [validUntil, setValidUntil] = useState("");
  const [maxMembers, setMaxMembers] = useState(100);
  const [licenseStatus, setLicenseStatus] = useState<DiaryLicenseStatus>("ACTIVE");
  const [isSavingLicense, setIsSavingLicense] = useState(false);

  // CRM 상태
  const [members, setMembers] = useState<DiaryMember[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    fetch("/api/t-diary/admin/providers")
      .then((res) => res.json())
      .then((data) => {
        const list: DiaryBrand[] = data.providers || [];
        setDiaries(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedDiary = diaries.find((d) => d.id === selectedId) || null;

  useEffect(() => {
    if (!selectedDiary) return;
    setPlan(selectedDiary.plan || "BUNDLE");
    setValidUntil(toDateInputValue(selectedDiary.valid_until));
    setMaxMembers(selectedDiary.max_members ?? 100);
    setLicenseStatus(selectedDiary.license_status || "ACTIVE");

    fetch(`/api/t-diary/members?diary_id=${encodeURIComponent(selectedDiary.id)}`)
      .then((res) => res.json())
      .then((data) => setMembers(data.members || []))
      .catch(() => setMembers([]));
    setTagFilter([]);
    setRoleFilter("ALL");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleSaveLicense = async () => {
    if (!selectedDiary) return;
    setIsSavingLicense(true);
    try {
      const res = await fetch("/api/t-diary/admin/license", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: selectedDiary.id,
          plan,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          max_members: maxMembers,
          license_status: licenseStatus,
        }),
      });
      const data = await res.json();
      if (data.brand) {
        setDiaries((prev) => prev.map((d) => (d.id === selectedDiary.id ? { ...d, ...data.brand } : d)));
        showToast("라이선스 정보가 저장되었습니다.");
      }
    } finally {
      setIsSavingLicense(false);
    }
  };

  const allTags = useMemo(() => Array.from(new Set(members.flatMap((m) => m.grade_tags))), [members]);

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
    if (tagFilter.length > 0 && !tagFilter.some((t) => m.grade_tags.includes(t))) return false;
    return true;
  });

  const toggleTag = (tag: string) => {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSendAlimtalk = async () => {
    if (!message.trim() || filteredMembers.length === 0) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/t-diary/crm/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: selectedDiary?.id,
          member_ids: filteredMembers.map((m) => m.id),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      showToast(`📨 ${data.sent_count || filteredMembers.length}명에게 카카오 알림톡을 발송했습니다 (데모).`);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const licenseInfo = selectedDiary ? getLicenseBadgeInfo(selectedDiary) : null;

  return (
    <div className="min-h-screen w-full bg-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <UnifiedHomeReturnAnchor currentModule="admin-diaries" />
          <button
            type="button"
            onClick={() => setForceAdminMode(!forceAdminMode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              forceAdminMode ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            관리자 권한 {forceAdminMode ? "ON" : "OFF"}
          </button>
        </div>

        <h1 className="mt-4 text-xl font-black text-slate-900 tracking-tight">t.다이어리 라이선스 & 타깃 CRM</h1>
        <p className="mt-0.5 text-xs text-slate-400">다이어리별 라이선스를 연장하고, 소속 태그로 필터링한 구성원에게 알림톡을 일괄 발송합니다.</p>

        {loading ? (
          <p className="mt-10 text-center text-xs text-slate-300">불러오는 중...</p>
        ) : (
          <>
            {/* 다이어리 선택 */}
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
            >
              {diaries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand_name} ({d.brand_slug})
                </option>
              ))}
            </select>

            {selectedDiary && (
              <>
                {/* 라이선스 관리 패널 */}
                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-900">라이선스 관리</h2>
                    {licenseInfo && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {licenseInfo.daysLeft !== null
                          ? licenseInfo.isReadOnly
                            ? `만료 ${Math.abs(licenseInfo.daysLeft)}일 경과`
                            : `D-${licenseInfo.daysLeft}`
                          : "만료일 미설정"}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">플랜</label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value as DiaryPlan)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">상태</label>
                      <select
                        value={licenseStatus}
                        onChange={(e) => setLicenseStatus(e.target.value as DiaryLicenseStatus)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">만료일</label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">최대 회원수</label>
                      <input
                        type="number"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveLicense}
                    disabled={isSavingLicense}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    라이선스 저장 (즉시 연장/수정)
                  </button>
                </div>

                {/* 타깃 CRM */}
                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <h2 className="text-xs font-black text-slate-900">타깃 CRM — 구성원 필터 & 알림톡 발송</h2>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(["ALL", "OWNER", "TEACHER", "PARENT", "STUDENT"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                          roleFilter === r ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {allTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                            tagFilter.includes(tag) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-slate-400">대상 {filteredMembers.length}명</p>
                  <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                    {filteredMembers.map((m) => (
                      <p key={m.id} className="text-[11px] text-slate-600">
                        {m.role} · {m.user_id} ({m.grade_tags.join(", ")}) · {m.status}
                      </p>
                    ))}
                    {filteredMembers.length === 0 && <p className="text-[11px] text-slate-300">조건에 맞는 구성원이 없습니다.</p>}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="알림톡 메시지 내용"
                    className="mt-2.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendAlimtalk}
                    disabled={isSending || !message.trim() || filteredMembers.length === 0}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#FEE500] px-4 py-2 text-xs font-bold text-[#191919] hover:bg-[#FDD800] disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    카카오 알림톡 일괄 발송
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
