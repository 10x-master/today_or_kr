"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  Video,
  X,
} from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgreeAll?: () => void;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAgreeAll,
}: TermsModalProps) {
  const [agreedService, setAgreedService] = useState(false);
  const [agreedPortrait, setAgreedPortrait] = useState(false);
  const [agreedSns, setAgreedSns] = useState(false);

  // 펼쳐보기 상태
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  if (!isOpen) return null;

  const isAllAgreed = agreedService && agreedPortrait && agreedSns;

  const handleToggleAll = () => {
    const next = !isAllAgreed;
    setAgreedService(next);
    setAgreedPortrait(next);
    setAgreedSns(next);
  };

  const handleConfirm = () => {
    if (!isAllAgreed) return;
    try {
      localStorage.setItem(
        "today_terms_agreed",
        JSON.stringify({
          service: true,
          portrait_waiver: true,
          sns_derivative: true,
          agreed_at: new Date().toISOString(),
        })
      );
    } catch {}
    onAgreeAll?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-amber-100 p-2 text-amber-800">
              <Scale className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              투데이 이용약관 및 초상권 면책 동의
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            건전한 로컬 팩트 생태계와 엠버서더 미디어 운영을 위해 아래 필수 약관에 동의해 주세요.
          </p>
        </div>

        {/* 상시 주의 알림 배너 */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-black text-rose-700">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>⚠️ 초상권 및 법적 책임 고지 (필독)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-800">
            타인의 얼굴이나 차량 번호판 등 사생활을 침해하는 미디어는 사전 통보 없이 즉시 삭제되며, 발생하는 모든 민·형사상 법적 책임은 등록자(회원) 본인에게 있습니다.
          </p>
        </div>

        {/* 전체 동의 버튼 */}
        <div
          onClick={handleToggleAll}
          className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
            isAllAgreed
              ? "border-amber-400 bg-amber-50/80 shadow-xs"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                isAllAgreed
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {isAllAgreed && <Check className="h-4 w-4 stroke-[3]" />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                [필수] 필수 약관 3종 전체 동의
              </p>
              <p className="text-[11px] text-slate-500">
                기본 이용약관, 초상권 면책, 공식 SNS 2차 가공 배포 동의
              </p>
            </div>
          </div>
        </div>

        {/* 세부 약관 3종 */}
        <div className="space-y-2.5 divide-y divide-slate-100 pt-1">
          {/* 1. 기본 서비스 이용약관 */}
          <div className="pt-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={agreedService}
                  onChange={(e) => setAgreedService(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-indigo-600 font-black">[필수]</span>
                <span>서비스 기본 이용약관 동의</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setExpandedSection(expandedSection === 1 ? null : 1)
                }
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
              >
                <span>내용보기</span>
                {expandedSection === 1 ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {expandedSection === 1 && (
              <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 border border-slate-100 max-h-32 overflow-y-auto">
                <p className="font-semibold text-slate-800 mb-1">
                  제1조 (목적 및 서비스 제공)
                </p>
                본 약관은 투데이(today.or.kr)가 제공하는 전국 행정 고시 정보 열람, 단지 협업 및 티노트(t.note) 서비스의 이용조건 및 절차를 규정합니다. 회원은 관련 법령과 공서양속을 준수해야 하며, 부정한 목적으로 시스템을 이용해서는 안 됩니다.
              </div>
            )}
          </div>

          {/* 2. 초상권 및 저작권 침해 금지 면책 조항 */}
          <div className="pt-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={agreedPortrait}
                  onChange={(e) => setAgreedPortrait(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-rose-600 font-black">[필수]</span>
                <span>미디어 등록 시 초상권 침해 금지 및 회원 전적인 법적 책임 면책</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setExpandedSection(expandedSection === 2 ? null : 2)
                }
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
              >
                <span>내용보기</span>
                {expandedSection === 2 ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {expandedSection === 2 && (
              <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 border border-slate-100 max-h-32 overflow-y-auto">
                <p className="font-semibold text-slate-800 mb-1">
                  제2조 (초상권 침해 금지 및 등록자 면책 보증)
                </p>
                1. 회원은 서비스에 사진, 영상, 음성 등 미디어를 등록함에 있어 타인의 얼굴, 식별 가능한 신체 부위, 차량 번호판, 주거 내부 등 사생활 및 초상권을 침해하지 않음을 엄격히 보증합니다.
                <br />
                2. 회원이 등록한 미디어로 인해 제3자로부터 초상권, 저작권, 인격권 침해에 따른 이의 제기, 소송, 형사 고발이 발생하는 경우, <strong>모든 민·형사상 법적 책임 및 손해배상 책임은 전적으로 해당 미디어를 등록한 회원 본인에게 귀속되며</strong>, 서비스 제공자는 일체의 법적 책임을 지지 않습니다.
                <br />
                3. 서비스 제공자는 침해 신고 접수 시 사전 고지 없이 해당 게시글을 즉시 비공개 또는 블라인드 처리할 수 있습니다.
              </div>
            )}
          </div>

          {/* 3. 공식 SNS 2차 가공 및 배포 동의 */}
          <div className="pt-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={agreedSns}
                  onChange={(e) => setAgreedSns(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-emerald-600 font-black">[필수]</span>
                <span>공식 SNS(유튜브 쇼츠, 인스타 등) 무상 2차 가공 및 배포 동의</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setExpandedSection(expandedSection === 3 ? null : 3)
                }
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
              >
                <span>내용보기</span>
                {expandedSection === 3 ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {expandedSection === 3 && (
              <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 border border-slate-100 max-h-32 overflow-y-auto">
                <p className="font-semibold text-slate-800 mb-1">
                  제3조 (콘텐츠 2차적 저작물 작성 및 공식 SNS 배포)
                </p>
                회원이 엠버서더, 피드, 퀵 캡처를 통해 등록한 미디어 및 게시글은 투데이 공식 유튜브 채널(YouTube Shorts), 인스타그램(Reels) 등 공식 SNS에 15초 숏폼 및 카드뉴스 형태로 AI 가공·편집되어 무상으로 배포·홍보될 수 있으며, 회원은 이에 동의합니다.
              </div>
            )}
          </div>
        </div>

        {/* 확인 CTA 버튼 */}
        <div className="pt-3">
          <button
            type="button"
            disabled={!isAllAgreed}
            onClick={handleConfirm}
            className={`w-full rounded-2xl py-3.5 text-xs font-black shadow-md transition-all cursor-pointer ${
              isAllAgreed
                ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-98"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isAllAgreed
              ? "약관 동의 완료하고 계속하기"
              : "필수 약관에 모두 동의해 주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
