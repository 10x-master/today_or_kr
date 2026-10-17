"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Building2,
  Store,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Loader2,
  PiggyBank,
} from "lucide-react";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { TcheckAddonService, TcheckDiagnosisResult, TcheckLog } from "@/types/tcheck";

type Mode = "APT" | "STORE" | "CARD_FEE";

interface AptReport {
  complexName: string;
  adequacyScore: number;
  keraGapPercent: number;
  longTermRepairAdjustment: string;
  flags: string[];
}

function hashSeed(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 97;
  return h;
}

function buildAptReport(name: string): AptReport {
  const seed = hashSeed(name || "상계주공");
  const adequacyScore = 54 + (seed % 36); // 54~89
  const keraGapPercent = 8 + (seed % 22); // 8~29
  return {
    complexName: name || "상계주공 14단지",
    adequacyScore,
    keraGapPercent,
    longTermRepairAdjustment:
      adequacyScore < 70
        ? "장기수선계획 조정 권고 — 적립금 대비 공사비가 K-apt 실거래 평균을 초과"
        : "현재 장기수선계획은 K-apt 실거래 평균 대비 적정 범위 내",
    flags:
      adequacyScore < 70
        ? ["공용부 방수공사 단가 과다 산정", "승강기 교체 입찰 2곳 미만 참여", "장기수선충당금 적립률 미달"]
        : ["외벽 도장 주기 적정", "입찰 참여사 3곳 이상 확보", "장기수선충당금 적립률 양호"],
  };
}

interface AddonRow extends TcheckAddonService {
  id: string;
}

const DEFAULT_ADDON_ROWS: AddonRow[] = [
  { id: "a1", name: "포스기(POS) 단말기 임대료", monthlyFeeKrw: 15000, inUse: true },
  { id: "a2", name: "매장 CCTV 월 구독료", monthlyFeeKrw: 9900, inUse: true },
  { id: "a3", name: "결제안심 부가서비스 보험", monthlyFeeKrw: 5000, inUse: false },
];

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

const STORE_CHECKLIST = [
  { id: "c1", label: "카드 결제 단말기 / PG 연동 정상 작동" },
  { id: "c2", label: "오프라인 우대수수료(0.5%) 적용 여부" },
  { id: "c3", label: "소방시설(소화기·경보기) 점검필증 유효" },
  { id: "c4", label: "전기안전점검 최근 1년 이내 실시" },
  { id: "c5", label: "임대차계약 만료일 6개월 이상 남음" },
  { id: "c6", label: "4대보험 및 근로계약서 정상 체결" },
];

export default function TCheckDiagnosisReport() {
  const [mode, setMode] = useState<Mode>("APT");

  // 아파트 진단
  const [searchQuery, setSearchQuery] = useState("상계주공 14단지");
  const [aptReport, setAptReport] = useState<AptReport | null>(() => buildAptReport("상계주공 14단지"));

  // 매장 자가점검
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const storeScore = useMemo(() => {
    const total = STORE_CHECKLIST.length;
    const done = STORE_CHECKLIST.filter((c) => checked[c.id]).length;
    return { done, total };
  }, [checked]);

  // 카드 매출 수수료 진단
  const [userId, setUserId] = useState("user-001");
  const [bizRegNumber, setBizRegNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [annualSalesManwon, setAnnualSalesManwon] = useState("30000");
  const [currentFeeRate, setCurrentFeeRate] = useState("2.3");
  const [addonRows, setAddonRows] = useState<AddonRow[]>(DEFAULT_ADDON_ROWS);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<TcheckDiagnosisResult | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [history, setHistory] = useState<TcheckLog[]>([]);

  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      const resolvedId = user?.id || "user-001";
      setUserId(resolvedId);
      fetch(`/api/t-check?user_id=${encodeURIComponent(resolvedId)}`)
        .then((res) => res.json())
        .then((data) => setHistory(data.logs || []))
        .catch(() => {});
    });
  }, []);

  const canDiagnose =
    bizRegNumber.trim().length > 0 &&
    Number(annualSalesManwon) > 0 &&
    Number(currentFeeRate) > 0 &&
    !isDiagnosing;

  function updateAddonRow(id: string, patch: Partial<AddonRow>) {
    setAddonRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }
  function addAddonRow() {
    setAddonRows((prev) => [...prev, { id: crypto.randomUUID(), name: "", monthlyFeeKrw: 0, inUse: true }]);
  }
  function removeAddonRow(id: string) {
    setAddonRows((prev) => prev.filter((row) => row.id !== id));
  }

  async function runFeeDiagnosis() {
    if (!canDiagnose) return;
    setIsDiagnosing(true);
    setDiagnosisError(null);
    try {
      const res = await fetch("/api/t-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          created_by_user_id: userId,
          business_reg_number: bizRegNumber,
          store_name: storeName.trim() || null,
          annual_card_sales_krw: Number(annualSalesManwon) * 10_000,
          current_fee_rate_percent: Number(currentFeeRate),
          addons: addonRows
            .filter((row) => row.name.trim())
            .map(({ name, monthlyFeeKrw, inUse }) => ({ name, monthlyFeeKrw, inUse })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.diagnosis) {
        setDiagnosisError(data?.error || "진단에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setDiagnosis(data.diagnosis as TcheckDiagnosisResult);
      if (data.log) setHistory((prev) => [data.log as TcheckLog, ...prev]);
    } catch {
      setDiagnosisError("진단에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsDiagnosing(false);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      {/* 모드 토글 */}
      <div className="inline-flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode("APT")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all ${
            mode === "APT" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /> 아파트 입찰 적정성
        </button>
        <button
          type="button"
          onClick={() => setMode("STORE")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all ${
            mode === "STORE" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Store className="h-3.5 w-3.5" /> 매장 자가점검
        </button>
        <button
          type="button"
          onClick={() => setMode("CARD_FEE")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all ${
            mode === "CARD_FEE" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" /> 카드 수수료 진단
        </button>
      </div>

      {mode === "APT" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-blue-600" /> CERA 입찰 적정성 · 장기수선계획 진단
          </h2>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAptReport(buildAptReport(searchQuery));
              }}
              placeholder="아파트 단지명을 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-20 text-sm text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setAptReport(buildAptReport(searchQuery))}
              className="absolute right-1.5 top-1.5 bottom-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold px-3 hover:bg-slate-800"
            >
              진단
            </button>
          </div>

          {aptReport && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">{aptReport.complexName}</p>
                  <p className="text-2xl font-black tracking-tight">
                    {aptReport.adequacyScore}
                    <span className="text-sm font-bold text-slate-400">/100점</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-rose-300 flex items-center gap-1 justify-end">
                    <TrendingUp className="h-3 w-3" /> K-apt 평균 대비 격차
                  </p>
                  <p className="text-lg font-bold text-rose-300">+{aptReport.keraGapPercent}%</p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-3 text-xs font-semibold flex items-start gap-2 ${
                  aptReport.adequacyScore < 70
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {aptReport.adequacyScore < 70 ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                {aptReport.longTermRepairAdjustment}
              </div>

              <div className="space-y-1.5">
                {aptReport.flags.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 rounded-lg bg-slate-50/70 px-3 py-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : mode === "STORE" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Store className="h-4 w-4 text-indigo-600" /> 소상공인 매장 결제망 · 시설 자가점검
          </h2>

          <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">점검 진행률</span>
            <span className="text-sm font-black text-slate-900">
              {storeScore.done} / {storeScore.total}
            </span>
          </div>

          <div className="space-y-2">
            {STORE_CHECKLIST.map((item) => {
              const isChecked = !!checked[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition-all ${
                    isChecked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className={`text-xs font-semibold ${isChecked ? "text-emerald-700" : "text-slate-700"}`}>
                    {item.label}
                  </span>
                  {isChecked ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {storeScore.done === storeScore.total && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> 모든 항목을 통과했습니다. 매장 안전·결제 환경이 양호합니다.
            </div>
          )}
          {storeScore.done > 0 && storeScore.done < storeScore.total && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> 미점검 항목 {storeScore.total - storeScore.done}건은 t.환급·t.sign에서 바로 조치할 수 있어요.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-blue-600" /> 소상공인 카드 매출 수수료 진단
          </h2>
          <p className="text-[11px] text-slate-400">
            연매출 구간별 법정 우대수수료율과 비교해 과오납 가능성과 불필요 부가서비스 해지로 아낄 수 있는 금액을 추정합니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[11px] font-bold text-slate-500">사업자등록번호</span>
              <input
                value={bizRegNumber}
                onChange={(e) => setBizRegNumber(e.target.value)}
                placeholder="123-45-67890"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] font-bold text-slate-500">상호명 (선택)</span>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="예: 정자동 숯불화로구이"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] font-bold text-slate-500">연간 카드 매출 (만원)</span>
              <input
                type="number"
                min={1}
                value={annualSalesManwon}
                onChange={(e) => setAnnualSalesManwon(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] font-bold text-slate-500">현재 적용받는 수수료율 (%)</span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={currentFeeRate}
                onChange={(e) => setCurrentFeeRate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">가입 중인 부가서비스</span>
              <button
                type="button"
                onClick={addAddonRow}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
              >
                <Plus className="h-3 w-3" /> 항목 추가
              </button>
            </div>
            {addonRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <input
                  value={row.name}
                  onChange={(e) => updateAddonRow(row.id, { name: e.target.value })}
                  placeholder="부가서비스명"
                  className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
                />
                <input
                  type="number"
                  min={0}
                  value={row.monthlyFeeKrw}
                  onChange={(e) => updateAddonRow(row.id, { monthlyFeeKrw: Number(e.target.value) || 0 })}
                  placeholder="월 비용(원)"
                  className="w-28 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-400 focus:bg-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => updateAddonRow(row.id, { inUse: !row.inUse })}
                  className={`shrink-0 rounded-lg px-2 py-2 text-[11px] font-bold transition-colors ${
                    row.inUse ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {row.inUse ? "사용 중" : "미사용"}
                </button>
                <button
                  type="button"
                  onClick={() => removeAddonRow(row.id)}
                  aria-label="항목 삭제"
                  className="shrink-0 rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {diagnosisError && (
            <p className="text-xs font-semibold text-rose-600">{diagnosisError}</p>
          )}

          <button
            type="button"
            disabled={!canDiagnose}
            onClick={runFeeDiagnosis}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all ${
              !canDiagnose
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
            }`}
          >
            {isDiagnosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
            {isDiagnosing ? "진단 중..." : "수수료 진단 실행"}
          </button>

          {diagnosis && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">{diagnosis.merchantTierLabel}</p>
                  <p className="text-2xl font-black tracking-tight">
                    {diagnosis.currentFeeRatePercent}%
                    <span className="text-sm font-bold text-slate-400"> (법정 {diagnosis.legalFeeRatePercent}%)</span>
                  </p>
                  {!diagnosis.businessRegNumberValid && (
                    <p className="mt-1 text-[10px] text-amber-300">
                      사업자등록번호 형식을 다시 확인해 주세요. (체크섬 불일치)
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-rose-300 flex items-center gap-1 justify-end">
                    <PiggyBank className="h-3 w-3" /> 예상 환급액
                  </p>
                  <p className="text-lg font-bold text-rose-300">{formatKrw(diagnosis.estimatedRefundKrw)}</p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-3 text-xs font-semibold flex items-start gap-2 ${
                  diagnosis.isOvercharged
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {diagnosis.isOvercharged ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                {diagnosis.isOvercharged
                  ? `법정 우대수수료율 대비 과오납 추정액 ${formatKrw(diagnosis.overchargedAmountKrw)}`
                  : "현재 수수료율은 법정 우대수수료율 이내입니다."}
              </div>

              {diagnosis.unnecessaryAddons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500">해지 권장 부가서비스 (연 {formatKrw(diagnosis.addonAnnualSavingsKrw)} 절감)</p>
                  {diagnosis.unnecessaryAddons.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs text-slate-600 rounded-lg bg-slate-50/70 px-3 py-2">
                      <span className="flex items-center gap-2">
                        <FileCheck2 className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {a.name}
                      </span>
                      <span className="font-semibold text-slate-500">월 {formatKrw(a.monthlyFeeKrw)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-400">최근 진단 기록</p>
              {history.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-[11px] text-slate-500 rounded-lg bg-slate-50/70 px-3 py-2"
                >
                  <span className="truncate">{log.store_name || log.business_reg_number}</span>
                  <span className="shrink-0 font-semibold text-rose-500">
                    {formatKrw(log.estimated_refund_krw || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
