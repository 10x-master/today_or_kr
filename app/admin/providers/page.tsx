"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { UnifiedHomeReturnAnchor } from "@/components/Navigation";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import { isSuperAdmin } from "@/lib/dong/pinManager";
import type { AuthProfile } from "@/types/auth";
import type { DiaryApprovalStatus, DiaryBrand, DiaryProviderType } from "@/types/diary";

type Tab = "ALL" | "PENDING" | "APPROVED" | "CONDITIONAL";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "ALL", label: "전체" },
  { id: "PENDING", label: "심사 대기" },
  { id: "APPROVED", label: "승인 완료" },
  { id: "CONDITIONAL", label: "조건부 승인" },
];

const CATEGORY_LABELS: Record<DiaryProviderType, string> = {
  ENTERPRISE: "🏢 기업/인쇄",
  LOCAL_BIZ: "🏪 지역 소상공인",
  PUBLIC: "🏛️ 지자체/공공",
  CREATOR: "🎬 크리에이터",
};

const STATUS_BADGE: Record<DiaryApprovalStatus, { label: string; cls: string }> = {
  APPROVED: { label: "승인 완료", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PENDING: { label: "심사 대기", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  CONDITIONAL: { label: "조건부 승인", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  REJECTED: { label: "반려됨", cls: "bg-rose-50 text-rose-600 border-rose-200" },
};

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<DiaryBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);
  const [forceAdminMode, setForceAdminMode] = useState(true); // 페어프로그래밍/데모용 최고관리자 강제 활성화
  const adminAuthorized = forceAdminMode || isSuperAdmin(currentUser);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const fetchProviders = () => {
    setLoading(true);
    fetch("/api/t-diary/admin/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProviders();
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  const handleAction = async (brand: DiaryBrand, status: DiaryApprovalStatus) => {
    setActionLoadingId(brand.id);
    setProviders((prev) => prev.map((p) => (p.id === brand.id ? { ...p, approval_status: status } : p)));

    try {
      const res = await fetch("/api/t-diary/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: brand.id, approval_status: status }),
      });
      const data = await res.json();
      if (res.ok && data.brand) {
        setProviders((prev) => prev.map((p) => (p.id === brand.id ? { ...p, ...data.brand } : p)));
        showToast(`${brand.brand_name} → ${STATUS_BADGE[status].label}(으)로 전환되었습니다.`);
      }
    } catch {
      showToast("네트워크 오류로 상태 변경에 실패했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProviders = providers.filter((p) => (activeTab === "ALL" ? true : p.approval_status === activeTab));

  const tabCounts: Record<Tab, number> = {
    ALL: providers.length,
    PENDING: providers.filter((p) => p.approval_status === "PENDING").length,
    APPROVED: providers.filter((p) => p.approval_status === "APPROVED").length,
    CONDITIONAL: providers.filter((p) => p.approval_status === "CONDITIONAL").length,
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <UnifiedHomeReturnAnchor currentModule="admin-providers" />
          <button
            type="button"
            onClick={() => setForceAdminMode(!forceAdminMode)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              forceAdminMode ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-400"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>관리자 권한 {forceAdminMode ? "ON" : "OFF"}</span>
          </button>
        </div>

        <h1 className="mt-4 text-xl font-black text-slate-900 tracking-tight">t.다이어리 제공자 심사</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          제공자 등록 신청을 심사하고 승인/조건부승인/반려 처리합니다. 승인 즉시 검색 포털과 지역 피드에 반영됩니다.
        </p>

        {!adminAuthorized && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-bold text-amber-800">
            관리자 권한이 필요한 화면입니다. (데모 환경에서는 위 토글로 권한을 켤 수 있습니다)
          </div>
        )}

        {/* 탭 */}
        <div className="mt-4 flex gap-1.5 border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label} ({tabCounts[tab.id]})
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="text-center text-xs text-slate-300 py-10">불러오는 중...</p>
          ) : filteredProviders.length === 0 ? (
            <p className="text-center text-xs text-slate-300 py-10">해당 탭에 제공자가 없습니다.</p>
          ) : (
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-bold text-slate-400">
                  <th className="py-2 pr-3">제공자</th>
                  <th className="py-2 pr-3">지역</th>
                  <th className="py-2 pr-3">연락처</th>
                  <th className="py-2 pr-3">링크</th>
                  <th className="py-2 pr-3">신청일</th>
                  <th className="py-2 pr-3">상태</th>
                  <th className="py-2 pr-3 text-right">심사</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((p) => {
                  const badge = STATUS_BADGE[p.approval_status];
                  const isActing = actionLoadingId === p.id;
                  return (
                    <tr key={p.id} className="border-b border-slate-50 align-top">
                      <td className="py-3 pr-3">
                        <p className="font-bold text-slate-900">{p.brand_name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{CATEGORY_LABELS[p.provider_type]}</p>
                        {p.business_reg_no && (
                          <p className="mt-0.5 text-[10px] text-slate-300">사업자 {p.business_reg_no}</p>
                        )}
                        {p.intro && <p className="mt-1 max-w-xs text-[10px] text-slate-500 line-clamp-2">{p.intro}</p>}
                      </td>
                      <td className="py-3 pr-3 text-slate-600">{p.region_code || "전국"}</td>
                      <td className="py-3 pr-3 text-slate-600">{p.contact_info || "-"}</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-1">
                          {p.youtube_channel && (
                            <a href={p.youtube_channel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600">
                              <ExternalLink className="h-3 w-3" />
                              유튜브
                            </a>
                          )}
                          {p.website_url && (
                            <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600">
                              <ExternalLink className="h-3 w-3" />
                              홈페이지
                            </a>
                          )}
                          {!p.youtube_channel && !p.website_url && <span className="text-slate-300">-</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-400">{p.created_at?.slice(0, 10)}</td>
                      <td className="py-3 pr-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-0 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            disabled={isActing || p.approval_status === "APPROVED"}
                            onClick={() => handleAction(p, "APPROVED")}
                            className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            disabled={isActing || p.approval_status === "CONDITIONAL"}
                            onClick={() => handleAction(p, "CONDITIONAL")}
                            className="rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-amber-600 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            조건부
                          </button>
                          <button
                            type="button"
                            disabled={isActing || p.approval_status === "REJECTED"}
                            onClick={() => handleAction(p, "REJECTED")}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            반려
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
