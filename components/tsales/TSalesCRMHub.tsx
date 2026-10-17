"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Phone,
  Plus,
  Loader2,
  Route,
  FileText,
  ShieldCheck,
  X,
  Building2,
  Navigation as NavigationIcon,
  Clock,
} from "lucide-react";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import {
  TSALES_ACTIVITY_LABEL,
  TSALES_STATUS_LABEL,
  TSALES_STATUS_PIN_COLOR,
  type TsalesActivityLog,
  type TsalesActivityType,
  type TsalesLead,
  type TsalesLeadStatus,
  type TsalesRouteStop,
} from "@/types/tsales";

const STATUS_FILTERS: Array<TsalesLeadStatus | "ALL"> = ["ALL", "UNCONTACTED", "IN_PROGRESS", "CONTRACTED", "REJECTED"];
const ACTIVITY_QUICK_TYPES: TsalesActivityType[] = ["CALL", "VISIT", "NOTE"];

// 데모 기본 위치 — 이 프로젝트의 다른 데모 콘텐츠와 동일한 노원구 상계동 일대
const DEFAULT_LAT = "37.6542";
const DEFAULT_LNG = "127.0568";

function formatKm(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
}

export default function TSalesCRMHub() {
  const [userId, setUserId] = useState("user-001");
  const [leads, setLeads] = useState<TsalesLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TsalesLeadStatus | "ALL">("ALL");

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activities, setActivities] = useState<TsalesActivityLog[]>([]);
  const [memoDraft, setMemoDraft] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRequestingSign, setIsRequestingSign] = useState(false);

  const [newActivityType, setNewActivityType] = useState<TsalesActivityType>("CALL");
  const [newActivityContent, setNewActivityContent] = useState("");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formBusinessName, setFormBusinessName] = useState("");
  const [formContactName, setFormContactName] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState(DEFAULT_LAT);
  const [formLng, setFormLng] = useState(DEFAULT_LNG);
  const [isCreating, setIsCreating] = useState(false);

  const [routeStops, setRouteStops] = useState<TsalesRouteStop[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      const resolvedId = user?.id || "user-001";
      setUserId(resolvedId);
      fetch(`/api/t-sales/leads?user_id=${encodeURIComponent(resolvedId)}`)
        .then((res) => res.json())
        .then((data) => setLeads(data.leads || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    });
  }, []);

  async function refreshLeadDetail(id: string) {
    const res = await fetch(`/api/t-sales/leads/${id}`);
    const data = await res.json().catch(() => null);
    if (data?.lead) {
      setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? data.lead : l)));
    }
    if (data?.activities) setActivities(data.activities);
  }

  function selectLead(lead: TsalesLead) {
    setSelectedLeadId(lead.id);
    setMemoDraft(lead.memo || "");
    refreshLeadDetail(lead.id).catch(() => {});
  }

  function closeDetail() {
    setSelectedLeadId(null);
    setActivities([]);
  }

  const filteredLeads = useMemo(
    () => (statusFilter === "ALL" ? leads : leads.filter((l) => l.status === statusFilter)),
    [leads, statusFilter]
  );
  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  const mapBounds = useMemo(() => {
    if (filteredLeads.length === 0) {
      return { minLat: 37.6, maxLat: 37.71, minLng: 127.0, maxLng: 127.11 };
    }
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    filteredLeads.forEach((l) => {
      if (l.lat < minLat) minLat = l.lat;
      if (l.lat > maxLat) maxLat = l.lat;
      if (l.lng < minLng) minLng = l.lng;
      if (l.lng > maxLng) maxLng = l.lng;
    });
    const latPad = Math.max((maxLat - minLat) * 0.2, 0.01);
    const lngPad = Math.max((maxLng - minLng) * 0.2, 0.01);
    return { minLat: minLat - latPad, maxLat: maxLat + latPad, minLng: minLng - lngPad, maxLng: maxLng + lngPad };
  }, [filteredLeads]);

  function toPinPosition(lat: number, lng: number) {
    const latRange = mapBounds.maxLat - mapBounds.minLat || 1;
    const lngRange = mapBounds.maxLng - mapBounds.minLng || 1;
    const top = (1 - (lat - mapBounds.minLat) / latRange) * 100;
    const left = ((lng - mapBounds.minLng) / lngRange) * 100;
    return { top: `${Math.min(96, Math.max(4, top))}%`, left: `${Math.min(96, Math.max(4, left))}%` };
  }

  async function handleCreateLead() {
    if (!formBusinessName.trim() || isCreating) return;
    const lat = Number(formLat);
    const lng = Number(formLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showToast("위도/경도를 숫자로 입력해 주세요.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/t-sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          created_by_user_id: userId,
          business_name: formBusinessName,
          contact_name: formContactName || null,
          contact_phone: formContactPhone || null,
          address: formAddress || null,
          lat,
          lng,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.lead) {
        showToast(data?.error || "리드 등록에 실패했습니다.");
        return;
      }
      setLeads((prev) => [data.lead, ...prev]);
      selectLead(data.lead);
      setShowAddForm(false);
      setFormBusinessName("");
      setFormContactName("");
      setFormContactPhone("");
      setFormAddress("");
      setFormLat(DEFAULT_LAT);
      setFormLng(DEFAULT_LNG);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(status: TsalesLeadStatus) {
    if (!selectedLead || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/t-sales/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, updated_by_user_id: userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.lead) {
        showToast("상태 변경에 실패했습니다.");
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? data.lead : l)));
      await refreshLeadDetail(selectedLead.id);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleSaveMemo() {
    if (!selectedLead || isSavingMemo) return;
    setIsSavingMemo(true);
    try {
      const res = await fetch(`/api/t-sales/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: memoDraft }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.lead) {
        setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? data.lead : l)));
        showToast("메모가 저장되었습니다.");
      }
    } finally {
      setIsSavingMemo(false);
    }
  }

  async function handleLogActivity() {
    if (!selectedLead || isLoggingActivity) return;
    setIsLoggingActivity(true);
    try {
      const res = await fetch(`/api/t-sales/leads/${selectedLead.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_type: newActivityType, content: newActivityContent || null, user_id: userId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.activity) {
        setActivities((prev) => [data.activity, ...prev]);
        setNewActivityContent("");
      }
    } finally {
      setIsLoggingActivity(false);
    }
  }

  async function handleRequestSign() {
    if (!selectedLead || isRequestingSign) return;
    if (!selectedLead.contact_phone) {
      showToast("전자계약을 요청하려면 연락처를 먼저 등록해 주세요.");
      return;
    }
    setIsRequestingSign(true);
    try {
      const res = await fetch(`/api/t-sales/leads/${selectedLead.id}/request-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_by_user_id: userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.contract) {
        showToast(data?.error || "전자계약 요청에 실패했습니다.");
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === data.lead.id ? data.lead : l)));
      await refreshLeadDetail(selectedLead.id);
      showToast("t.싸인 전자계약 DRAFT가 생성되어 체결 요청을 보냈습니다.");
    } finally {
      setIsRequestingSign(false);
    }
  }

  async function handleOptimizeRoute() {
    if (filteredLeads.length === 0 || isOptimizing) return;
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/t-sales/route-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: filteredLeads.map((l) => l.id) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.stops) {
        setRouteStops(data.stops);
        showToast(`방문 순서 ${data.stops.length}곳 · 총 이동거리 ${formatKm(data.totalDistanceMeters)}`);
      }
    } finally {
      setIsOptimizing(false);
    }
  }

  const routeOrderByLeadId = useMemo(() => {
    const map = new Map<string, number>();
    routeStops?.forEach((stop) => map.set(stop.leadId, stop.order));
    return map;
  }, [routeStops]);

  return (
    <div className="space-y-4 pb-10">
      {/* 상태 필터 + 동선 최적화 + 리드 추가 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                statusFilter === status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "전체" : TSALES_STATUS_LABEL[status]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleOptimizeRoute}
            disabled={isOptimizing || filteredLeads.length === 0}
            className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {isOptimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Route className="h-3 w-3" />}
            동선 최적화
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" /> 리드 추가
          </button>
        </div>
      </div>

      {/* 리드 등록 폼 */}
      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={formBusinessName}
              onChange={(e) => setFormBusinessName(e.target.value)}
              placeholder="상호명 *"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
            <input
              value={formContactName}
              onChange={(e) => setFormContactName(e.target.value)}
              placeholder="담당자명"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
            <input
              value={formContactPhone}
              onChange={(e) => setFormContactPhone(e.target.value)}
              placeholder="연락처 (010-0000-0000)"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
            <input
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="주소"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
            <input
              value={formLat}
              onChange={(e) => setFormLat(e.target.value)}
              placeholder="위도(lat)"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
            <input
              value={formLng}
              onChange={(e) => setFormLng(e.target.value)}
              placeholder="경도(lng)"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateLead}
            disabled={!formBusinessName.trim() || isCreating}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-sm py-2.5 w-full hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            리드 등록
          </button>
        </div>
      )}

      {/* 1. 지도 패널 — 위경도 비례 좌표 투영 방식의 경량 맵 (외부 지도 SDK 키 없이 동작) */}
      <div className="relative h-56 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> 불러오는 중...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            등록된 리드가 없습니다. 리드를 추가해 보세요.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const pos = toPinPosition(lead.lat, lead.lng);
            const order = routeOrderByLeadId.get(lead.id);
            const isSelected = selectedLeadId === lead.id;
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => selectLead(lead)}
                style={{ top: pos.top, left: pos.left, backgroundColor: TSALES_STATUS_PIN_COLOR[lead.status] }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform ${
                  isSelected ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""
                }`}
                title={lead.business_name}
              >
                {order ?? <MapPin className="h-3.5 w-3.5" />}
              </button>
            );
          })
        )}
      </div>

      {/* 2. 리스트 패널 */}
      <div className="space-y-1.5">
        {filteredLeads.map((lead) => {
          const order = routeOrderByLeadId.get(lead.id);
          return (
            <button
              key={lead.id}
              type="button"
              onClick={() => selectLead(lead)}
              className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                selectedLeadId === lead.id ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: TSALES_STATUS_PIN_COLOR[lead.status] }}
              >
                {order ?? <Building2 className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-800">{lead.business_name}</span>
                <span className="block truncate text-[10.5px] text-slate-400">
                  {TSALES_STATUS_LABEL[lead.status]}
                  {lead.contact_phone ? ` · ${lead.contact_phone}` : ""}
                </span>
              </span>
              {lead.tsign_contract_id && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* 3. 상세 CRM 패널 */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 sm:max-w-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{selectedLead.business_name}</h3>
              <button type="button" onClick={closeDetail} aria-label="닫기">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(["UNCONTACTED", "IN_PROGRESS", "CONTRACTED", "REJECTED"] as TsalesLeadStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(status)}
                  style={selectedLead.status === status ? { backgroundColor: TSALES_STATUS_PIN_COLOR[status] } : undefined}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                    selectedLead.status === status ? "text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {TSALES_STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              {selectedLead.contact_name && (
                <p className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" /> {selectedLead.contact_name}
                </p>
              )}
              {selectedLead.contact_phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedLead.contact_phone}
                </p>
              )}
              {selectedLead.address && (
                <p className="flex items-center gap-1.5">
                  <NavigationIcon className="h-3.5 w-3.5 text-slate-400" /> {selectedLead.address}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">메모</span>
              <textarea
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSaveMemo}
                disabled={isSavingMemo}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                {isSavingMemo ? "저장 중..." : "메모 저장"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`/api/t-sales/leads/${selectedLead.id}/proposal`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs py-2.5 hover:bg-slate-200 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> 제안서 PDF
              </a>
              <button
                type="button"
                onClick={handleRequestSign}
                disabled={isRequestingSign || !!selectedLead.tsign_contract_id}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isRequestingSign ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                {selectedLead.tsign_contract_id ? "계약 요청됨" : "t.싸인 체결 요청"}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500">영업 활동 기록</span>
              <div className="flex gap-1.5">
                {ACTIVITY_QUICK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewActivityType(type)}
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors ${
                      newActivityType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {TSALES_ACTIVITY_LABEL[type]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  value={newActivityContent}
                  onChange={(e) => setNewActivityContent(e.target.value)}
                  placeholder="활동 내용 메모"
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleLogActivity}
                  disabled={isLoggingActivity}
                  className="shrink-0 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  기록
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activities.length === 0 && <p className="text-[11px] text-slate-400">아직 활동 기록이 없습니다.</p>}
                {activities.map((a) => (
                  <div key={a.id} className="rounded-lg bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{TSALES_ACTIVITY_LABEL[a.activity_type]}</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        {a.created_at ? new Date(a.created_at).toLocaleString("ko-KR") : ""}
                      </span>
                    </div>
                    {a.content && <p className="mt-0.5">{a.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
