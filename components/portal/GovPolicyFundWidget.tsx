"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  X,
  FileCheck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { UserPersona, PolicyFundItem } from "@/types/persona";

export interface GovPolicyFundWidgetProps {
  persona: UserPersona;
  onOpenConsultingModal?: () => void;
  compact?: boolean;
}

export default function GovPolicyFundWidget({
  persona,
  onOpenConsultingModal,
  compact = false,
}: GovPolicyFundWidgetProps) {
  const [items, setItems] = useState<PolicyFundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFundForConsult, setSelectedFundForConsult] = useState<PolicyFundItem | null>(null);

  // 1:1 무료 상담 폼 상태
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("외식업/매장");
  const [phone, setPhone] = useState("");
  const [needs, setNeeds] = useState("");
  const [isConsultSubmitted, setIsConsultSubmitted] = useState(false);

  // 페르소나 변경 시 API 데이터 조회
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/gov/policy-funds?persona=${persona}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.items) {
          setItems(data.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [persona]);

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !phone.trim()) return;
    setIsConsultSubmitted(true);
    setTimeout(() => {
      setIsConsultSubmitted(false);
      setSelectedFundForConsult(null);
      setPhone("");
      setNeeds("");
    }, 2200);
  };

  return (
    <div className="h-full rounded-2xl bg-white p-3.5 border border-slate-100 flex flex-col justify-between space-y-3">
      {/* 1. 위젯 헤더 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 text-xs">
              🏛️
            </span>
            <h2 className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
              <span>중기부·소진공 정책자금 레이더</span>
              <span className="rounded bg-rose-50 text-rose-700 px-1.5 py-0.2 text-[10px] font-medium">
                4분기 집중 접수
              </span>
            </h2>
          </div>
          <span className="text-[10px] font-normal text-slate-400">
            data.go.kr 기업마당 실시간
          </span>
        </div>

        {/* 4분기 소진공 접수 현황 상태 스트립 */}
        <div className="flex items-center justify-between text-[10.5px] bg-slate-50/80 px-2.5 py-1 rounded-lg text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
            <span className="truncate">
              소진공 직접대출(10/12~) 접수중 · 대리대출(10/6~) 실시간 확인서 발급
            </span>
          </div>
          <span className="shrink-0 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded ml-1">
            정상 가동
          </span>
        </div>
      </div>

      {/* 2. 페르소나 맞춤 지원사업 리스트 */}
      <div className="space-y-2.5 flex-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            지원사업 데이터를 불러오는 중...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            해당 역할에 접수 중인 지원사업을 확인하고 있습니다.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-50/70 p-3 space-y-2 border border-slate-100 hover:bg-slate-100/60 transition-colors"
            >
              {/* 상단 라인: 뱃지, 발행 기관, D-Day */}
              <div className="flex items-center justify-between text-[11px] gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200/80 shrink-0">
                    {item.badgeLabel || "국비 지원"}
                  </span>
                  <span className="text-[10.5px] font-normal text-slate-500 truncate">
                    {item.agency}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.dDay !== undefined && item.dDay !== null ? (
                    <span className="rounded bg-rose-50 text-rose-700 font-medium px-1.5 py-0.2 text-[10px] border border-rose-200/60">
                      D-{item.dDay}
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.2 text-[10px] border border-emerald-200/60">
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              {/* 제목 & 지원 한도 */}
              <div>
                <h3 className="text-xs font-medium text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] font-medium text-rose-600 mt-0.5">
                  지원 규모: {item.amountText}
                </p>
                <p className="text-[11px] font-normal text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 핵심 요약 포인트 3종 */}
              <div className="rounded-lg bg-white p-2 border border-slate-100 space-y-1">
                {item.highlights.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 text-[10.5px] text-slate-600 font-normal leading-tight"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.2" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 2종: [공식 누리집 딥링크 바로가기] + [1:1 맞춤 상담 신청] */}
              <div className="flex items-center gap-1.5 pt-1">
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 py-1.5 text-[11px] font-normal text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  title="공식 접수처 외부 딥링크 열기"
                >
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                  <span>{item.ctaLabel || "공식 접수처 바로가기"}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedFundForConsult(item)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <span>맞춤 상담</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. 하단 풋터 안내 */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400 font-normal">
        <span>※ 예산 소진 시 조기 마감되므로 조기 접수를 권장합니다.</span>
        <a
          href="https://ols.semas.or.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-800 hover:underline flex items-center gap-0.5"
        >
          <span>소진공 누리집</span>
          <ChevronRight className="h-2.5 w-2.5" />
        </a>
      </div>

      {/* 4. 1:1 맞춤 상담/신청 모달 */}
      {selectedFundForConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedFundForConsult(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 모달 헤더 */}
            <div className="pr-6 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  <Landmark className="h-3 w-3 text-amber-600" />
                  <span>정책자금 전문가 1:1 무료 진단</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {selectedFundForConsult.agency}
                </span>
              </div>

              <h3 className="text-sm font-medium text-slate-900 leading-snug">
                {selectedFundForConsult.title}
              </h3>
              <p className="text-[11px] font-medium text-rose-600">
                지원 규모: {selectedFundForConsult.amountText}
              </p>
            </div>

            {isConsultSubmitted ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-center space-y-1 animate-in zoom-in-95">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-emerald-900">
                  맞춤 지원사업 신청이 정상 접수되었습니다!
                </p>
                <p className="text-[11px] font-normal text-emerald-700">
                  전담 정책자금 컨설턴트가 24시간 내 유선으로 신청 자격 및 필수 서류를 무상 안내드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      상호명 / 대표자명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 오늘식당 / 홍길동"
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      업종 분류 *
                    </label>
                    <select
                      value={bizType}
                      onChange={(e) => setBizType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="외식업/매장">외식업 / 매장 운영</option>
                      <option value="제조/소공인">제조업 / 소공인</option>
                      <option value="폐업/철거고민">폐업 예정 / 원상복구</option>
                      <option value="아파트/관리주체">아파트 관리사무소</option>
                      <option value="1인크리에이터">엠버서더 / 1인 창작자</option>
                      <option value="기타소상공인">기타 소상공인</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    담당자 연락처 (휴대폰) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    신청 고민 / 필요 사항
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: 키오스크 도입 서류 준비가 막막합니다, 철거비 실비 청구 절차 문의"
                    value={needs}
                    onChange={(e) => setNeeds(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>1:1 무료 상담 및 서류 안내 신청</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
