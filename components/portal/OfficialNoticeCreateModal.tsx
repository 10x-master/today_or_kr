"use client";

import React, { useState } from "react";
import {
  X,
  Building,
  ShieldCheck,
  Send,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { NoticeItem } from "@/types/officialNotice";

export interface OfficialNoticeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitNotice: (notice: NoticeItem) => void;
  apartmentName?: string;
}

const OFFICIAL_CATEGORIES = [
  "장기수선 공사 입찰",
  "승강기/시설 점검",
  "장충금 주민 안내",
  "관리비 부과",
] as const;

export default function OfficialNoticeCreateModal({
  isOpen,
  onClose,
  onSubmitNotice,
  apartmentName = "상계주공 14단지",
}: OfficialNoticeCreateModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(OFFICIAL_CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [ceraReportAttached, setCeraReportAttached] = useState(true);
  const [targetBlock, setTargetBlock] = useState("전 세대 (1401동~1420동)");
  const [issuingAgency, setIssuingAgency] = useState(`${apartmentName} 관리사무소`);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNotice: NoticeItem = {
      id: `notice-official-${Date.now()}`,
      title: title.trim(),
      track: "OFFICIAL",
      author_role: "MANAGER",
      author_name: issuingAgency.trim(),
      apartment_name: apartmentName,
      category,
      content: content.trim(),
      petition_votes: 0,
      approval_status: "APPROVED",
      cera_report_attached: ceraReportAttached,
      created_at: "방금 전",
    };

    onSubmitNotice(newNotice);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더 */}
        <div className="pr-6 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              <Building className="h-3 w-3 text-blue-600" />
              <span>관리주체 공식 직발행</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {apartmentName}
            </span>
          </div>

          <h2 className="text-sm font-medium text-slate-900 leading-snug">
            단지 공식 공고문 즉시 발행
          </h2>
          <p className="text-[11px] font-normal text-slate-500">
            관리사무소 및 입대의 승인 없이 즉시 [🏢 관리사무소 공식] 블루 뱃지를 달고 최상단에 고정 노출됩니다.
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-xl bg-emerald-50 p-6 text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-medium text-emerald-900">
              관리주체 공식 공고가 성공적으로 발행되었습니다!
            </p>
            <p className="text-[11px] text-emerald-700">
              블루 공식 뱃지가 부착되어 단지 피드 상단에 고정되었습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* 공고 카테고리 4종 선택 */}
            <div>
              <label className="block text-[10px] font-normal text-slate-500 mb-1">
                공고 분류 *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {OFFICIAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-lg py-1.5 px-2 text-[11px] text-center font-normal transition-colors cursor-pointer border ${
                      category === cat
                        ? "bg-blue-50 border-blue-300 text-blue-800 font-medium"
                        : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 공고 제목 */}
            <div>
              <label className="block text-[10px] font-normal text-slate-500 mb-1">
                공고 제목 *
              </label>
              <input
                type="text"
                required
                placeholder="예: 2026 하반기 승강기 정기 점검 및 시설물 보수 입찰 안내"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 발행처 및 대상 동 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-normal text-slate-500 mb-1">
                  발행 부서
                </label>
                <input
                  type="text"
                  value={issuingAgency}
                  onChange={(e) => setIssuingAgency(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-normal text-slate-500 mb-1">
                  안내 대상 구역
                </label>
                <input
                  type="text"
                  value={targetBlock}
                  onChange={(e) => setTargetBlock(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 공고 본문 핵심 요약 */}
            <div>
              <label className="block text-[10px] font-normal text-slate-500 mb-1">
                공고 핵심 요약 내용
              </label>
              <textarea
                rows={3}
                placeholder="공사/점검 일시, 주민 협조 사항 및 소음 발생 시간 등 주요 사실을 입력하세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* CERA 적정가 평가 첨부 토글 */}
            <div className="rounded-xl bg-indigo-50/60 p-2.5 border border-indigo-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-medium text-indigo-900 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>CERA 적정가 검증 뱃지 첨부</span>
                </span>
                <p className="text-[10px] font-normal text-indigo-700/80">
                  특허 CERA 엔진의 K-apt 빅데이터 공사비 적정가 인증 뱃지를 부착합니다.
                </p>
              </div>

              <input
                type="checkbox"
                checked={ceraReportAttached}
                onChange={(e) => setCeraReportAttached(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>🏢 [관리사무소 공식] 블루 뱃지로 즉시 발행</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
