"use client";

import React, { useState } from "react";
import {
  Printer,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  Building,
  FileCheck,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import type { MfadGeoTarget } from "@/types/mfad";

interface MfadOfficialDocumentProps {
  target: MfadGeoTarget | null;
  isOpen: boolean;
  onClose: () => void;
  showFullName?: boolean;
}

export default function MfadOfficialDocument({
  target,
  isOpen,
  onClose,
  showFullName = true,
}: MfadOfficialDocumentProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !target) return null;

  const docNumber = `TL-2026-10-M049-${target.id.slice(0, 6).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const displayName = showFullName ? target.target_name : target.masked_name || target.target_name;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // A4 즉시 인쇄
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // 카카오톡 공문 안내문 텍스트 복사 & 공유
  const handleKakaoShare = () => {
    const message = `[중소기업사업전환지원단 공식 공문 안내]
문서번호: ${docNumber}
수신: ${displayName} 대표자 귀하
제목: [공문] 여신전문금융업법 제18조의2에 따른 카드 가맹점 초과 수수료 정합성 점검 및 환급 지원의 건

1. 당 지원단 전산 점검 결과, 귀 사업장의 최근 3개년 카드수수료 과오납 환급 추정액은 [₩${target.metadata.estimated_refund.toLocaleString()}원]으로 확인되었습니다.
2. [카드사 직입금 원칙]: 모든 환급금은 8개 전업 카드사에서 대표자님 명의 사업자 통장으로 직접 무통장 입금됩니다.
3. 착수금 0원 / 현장 서포터즈 무료 실사 지원

공식 문서 확인 링크:
https://today.or.kr/admin/radar?targetId=${target.id}`;

    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      showToast("💬 카카오톡 전송용 공식 공문 서식 텍스트가 클립보드에 복사되었습니다!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* 토스트 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-3xl rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto print:max-h-none print:h-auto print:w-[210mm] print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:overflow-visible">
        {/* 모달 닫기 버튼 (인쇄 시 숨김) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer print:hidden z-10"
          title="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ============================================================
            공문 본문 영역 (A4 규격 인쇄 대응)
           ============================================================ */}
        <div className="p-6 sm:p-10 font-serif leading-relaxed text-xs sm:text-sm text-slate-900 space-y-6 print:p-8 print:text-black">
          {/* 1. 공문 헤더 */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-sans font-bold text-xs tracking-wider text-slate-600 block">
                중소기업사업전환지원단 • 웰글로벌 Today Link 사업본부
              </span>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 font-sans">
                여신금융협회 법정 규정 점검 공식 통보문
              </h1>
              <div className="font-mono text-xs text-slate-500 flex items-center gap-3 pt-1">
                <span>문서번호: <strong>{docNumber}</strong></span>
                <span>•</span>
                <span>시행일자: <strong>{currentDate}</strong></span>
              </div>
            </div>

            {/* 대한민국 기관 스타일 공인 붉은 사각 직인 */}
            <div className="shrink-0 relative select-none">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-4 border-red-600 flex items-center justify-center text-center p-1 transform rotate-3 shadow-sm bg-red-50/20">
                <div className="border-2 border-red-600 border-dashed w-full h-full flex flex-col items-center justify-center font-bold text-red-600 text-[10px] sm:text-xs leading-none tracking-widest font-serif">
                  <span>중소기업</span>
                  <span>사업전환</span>
                  <span>지원단인</span>
                </div>
              </div>
              <span className="absolute -bottom-2 -right-1 text-[9px] text-red-500 font-sans font-semibold bg-white px-1">
                [공인직인]
              </span>
            </div>
          </div>

          {/* 2. 수신처 및 발신 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans">
            <div className="space-y-1">
              <p>
                <strong className="text-slate-600">수 신:</strong>{" "}
                <span className="font-bold text-slate-950 text-sm">
                  {displayName}
                </span>{" "}
                대표자 ({target.representative_name}) 귀하
              </p>
              <p>
                <strong className="text-slate-600">사업장 주소:</strong> {target.road_address}
              </p>
              <p>
                <strong className="text-slate-600">사업자등록번호:</strong>{" "}
                <span className="font-mono">{target.metadata.biz_reg_no}</span>
              </p>
            </div>
            <div className="space-y-1 sm:text-right">
              <p>
                <strong className="text-slate-600">발 신:</strong> 웰글로벌 Today Link M-FAD 공인 권익수호단
              </p>
              <p>
                <strong className="text-slate-600">문서 담당:</strong> M-FAD 전담 실사 위원회
              </p>
              <p>
                <strong className="text-slate-600">문의/접수:</strong> 1588-0000 (권익보호 직통)
              </p>
            </div>
          </div>

          {/* 3. 공문 제목 */}
          <div className="p-3 rounded-xl bg-slate-900 text-white font-sans">
            <h2 className="font-bold text-sm sm:text-base leading-snug">
              제목: [공문] 여신전문금융업법 제18조의2에 따른 카드 가맹점 초과 수수료 정합성 점검 및 환급 지원의 건
            </h2>
          </div>

          {/* 4. 공문 본문 5개 조항 */}
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
            <p>1. 귀 사업장의 무궁한 발전과 번창을 기원합니다.</p>

            <p>
              2. 당 지원단은 <strong>「여신전문금융업법」 제18조의2(신용카드가맹점에 대한 수수료율의 차등 적용 등)</strong> 및 금융위원회 고시에 의거하여, 귀 사업장의 최근 3개년간 카드사 전산 승인 및 결제대행(PG) 수수료 차감 내역에 대한 정합성 전산 정밀 점검을 실시하였습니다.
            </p>

            {/* 3. 과오납 점검 결과 요약 박스 */}
            <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/60 text-red-950 space-y-2">
              <div className="flex items-center justify-between border-b border-red-200 pb-1.5">
                <span className="font-bold text-sm text-red-900">
                  ★ 정밀 점검 결과: 카드수수료 3개년 과오납 회수 예상액
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-red-700">
                  ₩{target.metadata.estimated_refund.toLocaleString()} 원
                </span>
              </div>
              <ul className="text-xs space-y-1 text-red-900 font-sans list-disc list-inside">
                <li>
                  <strong>누수 원인:</strong> {target.metadata.leakage_cause}
                </li>
                <li>
                  <strong>현재 적용 요율:</strong> {target.metadata.applied_rate}% ➔{" "}
                  <strong>법정 적정 요율:</strong> {target.metadata.statutory_rate}% (요율 괴리: {(target.metadata.applied_rate - target.metadata.statutory_rate).toFixed(2)}%)
                </li>
                <li>
                  <strong>세부 내역:</strong> {target.metadata.leakage_detail}
                </li>
              </ul>
            </div>

            <p>
              4. <strong>[카드사 직입금(Direct Deposit) 및 무착수금 원칙]</strong><br />
              본 지원단이 지원하는 모든 수수료 환급금은 일체의 중간 정산 없이, 8개 전업 카드사(신한·삼성·KB국민·현대·롯데·우리·하나·BC)에서 <strong>대표자님 명의의 가맹점 사업자 통장으로 직접 무통장 입금</strong> 처리됩니다. 당 지원단 및 소명 전담 서포터즈는 착수금 또는 사전 비용을 일체 요구하지 않습니다.
            </p>

            <p>
              5. <strong>[향후 소명 절차 및 서포터즈 실사 안내]</strong><br />
              본 통보문을 수령하신 후 아래 담당 서포터즈의 현장 방문을 통한 매출 전표 대조 및 t.sign 비대면 전자소명 약정서에 날인하시면, 여신금융협회 전산 시스템을 통해 카드사 공식 소명 및 환급 절차가 즉시 착수됩니다.
            </p>
          </div>

          {/* 5. 공문 하단 발행 직인 및 날짜 */}
          <div className="pt-6 border-t border-slate-200 text-center space-y-2 font-serif">
            <p className="text-xs text-slate-500 font-sans">
              위 점검 내용은 여신금융협회 가맹점 매출거래정보 공식 집계에 근거하여 작성되었습니다.
            </p>
            <p className="text-base sm:text-lg font-bold text-slate-950 tracking-wider">
              {currentDate}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-base sm:text-lg font-bold text-slate-900">
                중소기업사업전환지원단 단장
              </span>
              <span className="text-red-600 font-bold text-sm">[직인생략]</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            하단 액션 버튼 바 (인쇄 시 숨김)
           ============================================================ */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>본 문서는 공공기관 및 여신금융협회 법정 서식 규격을 100% 준수합니다.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleKakaoShare}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-800" /> : <Send className="h-4 w-4" />}
              <span>{copied ? "카톡 전송문 복사 완료!" : "💬 카카오톡 공문 전송"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              <span>📄 정식 공문 A4 즉시 인쇄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
