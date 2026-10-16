"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
  LEGAL_OPERATOR_NAME,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_CONTACT,
  TERMS_AGREEMENT_SUMMARY,
  PRIVACY_AGREEMENT_SUMMARY,
  MARKETING_AGREEMENT_SUMMARY,
} from "@/lib/legal/legalInfo";

type AgreementKey = "terms" | "privacy" | "marketing";

const ROWS: Array<{
  key: AgreementKey;
  required: boolean;
  label: string;
  popupTitle: string;
  popupBody: string;
}> = [
  {
    key: "terms",
    required: true,
    label: `[필수] 서비스 이용약관 동의 (${LEGAL_OPERATOR_NAME})`,
    popupTitle: "서비스 이용약관",
    popupBody: TERMS_AGREEMENT_SUMMARY,
  },
  {
    key: "privacy",
    required: true,
    label: `[필수] 개인정보 수집 및 이용 동의 (책임자: ${PRIVACY_OFFICER_NAME} / ${PRIVACY_OFFICER_CONTACT} / 법정 최대기간 보관)`,
    popupTitle: "개인정보 수집 및 이용 동의",
    popupBody: PRIVACY_AGREEMENT_SUMMARY,
  },
  {
    key: "marketing",
    required: false,
    label: "[선택] t.솔루션 리포트 및 지자체 소식 알림톡 수신 동의",
    popupTitle: "마케팅 정보 수신 동의",
    popupBody: MARKETING_AGREEMENT_SUMMARY,
  },
];

export default function LegalAgreementChecklist({
  onRequiredChange,
  className = "",
}: {
  onRequiredChange?: (allRequiredChecked: boolean) => void;
  className?: string;
}) {
  const [checked, setChecked] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [viewing, setViewing] = useState<AgreementKey | null>(null);

  const allChecked = ROWS.every((row) => checked[row.key]);
  const allRequiredChecked = ROWS.filter((row) => row.required).every((row) => checked[row.key]);

  useEffect(() => {
    onRequiredChange?.(allRequiredChecked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRequiredChecked]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ terms: next, privacy: next, marketing: next });
  };

  const toggleOne = (key: AgreementKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const viewingRow = ROWS.find((row) => row.key === viewing) || null;

  return (
    <div className={className}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
        {/* 전체 동의하기 */}
        <button
          type="button"
          onClick={toggleAll}
          className="flex w-full items-center gap-2 pb-2 border-b border-slate-200 text-left cursor-pointer"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              allChecked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
            }`}
          >
            {allChecked && <Check className="h-3.5 w-3.5 text-white" />}
          </span>
          <span className="text-xs font-bold text-slate-900">전체 동의하기</span>
        </button>

        {/* 개별 항목 */}
        <div className="space-y-2">
          {ROWS.map((row) => (
            <div key={row.key} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => toggleOne(row.key)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors mt-0.5 cursor-pointer"
                style={{
                  backgroundColor: checked[row.key] ? "#2563EB" : "#FFFFFF",
                  borderColor: checked[row.key] ? "#2563EB" : "#CBD5E1",
                }}
                aria-label={row.label}
              >
                {checked[row.key] && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
              <button
                type="button"
                onClick={() => toggleOne(row.key)}
                className="flex-1 text-left text-[11px] leading-snug text-slate-600 cursor-pointer"
              >
                {row.label}
              </button>
              <button
                type="button"
                onClick={() => setViewing(row.key)}
                className="shrink-0 text-[11px] font-bold text-slate-400 underline underline-offset-2 hover:text-slate-700 transition-colors cursor-pointer"
              >
                [보기]
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* [보기] 팝업 */}
      {viewingRow && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setViewing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="pr-6 text-sm font-black text-slate-900">{viewingRow.popupTitle}</h3>
            <p className="mt-3 whitespace-pre-line text-[11px] leading-relaxed text-slate-600">
              {viewingRow.popupBody}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
