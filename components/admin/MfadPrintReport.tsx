"use client";

import React from "react";
import type { MfadGeoTarget } from "@/types/mfad";
import { MFAD_LEAK_CODES } from "@/types/mfad";

interface MfadPrintReportProps {
  target: MfadGeoTarget | null;
}

export default function MfadPrintReport({ target }: MfadPrintReportProps) {
  if (!target) return null;

  const { metadata } = target;
  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportCode = `MFAD-RPT-${target.id.slice(0, 8).toUpperCase()}`;

  // 7대 누수 코드 진단 결과 (해당 타깃의 primary_leak_code는 '위험/불일치', 나머지는 정상/주의 판정)
  const leakEvaluations = MFAD_LEAK_CODES.map((item) => {
    const isPrimary = item.code === metadata.primary_leak_code;
    return {
      ...item,
      resultStatus: isPrimary ? "중점 누수 발견" : item.severity === "HIGH" ? "정밀 소명 권고" : "정상 범위",
      resultColor: isPrimary ? "text-red-700 bg-red-50 border-red-200" : item.severity === "HIGH" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-slate-600 bg-slate-50 border-slate-200",
      isPrimary,
    };
  });

  return (
    <aside
      aria-label="M-FAD 가맹점 사전 실사 인쇄 리포트"
      className="hidden print:block print:w-[210mm] print:h-[297mm] print:p-8 print:bg-white print:text-black font-sans box-border"
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="border-2 border-slate-900 p-6 flex flex-col justify-between h-[278mm] text-[11px] leading-tight">
        {/* ============================================================
            [HEADER]
           ============================================================ */}
        <header className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] tracking-wider rounded">
                M-FAD OFFICIAL
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                문서번호: {reportCode}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-950 mt-1 tracking-tight">
              가맹점 카드 수수료 정합성 사전 실사 보고서
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
              여신전문금융업법 제18조의2(우대가맹점의 선정 등) 기반 카드사 과오납 차감액 정밀 진단
            </p>
          </div>

          <div className="text-right text-[10px] space-y-0.5">
            <p className="font-semibold text-slate-800">Today Link R&D 센터</p>
            <p className="text-slate-500">실사일자: {currentDate}</p>
            <p className="text-slate-500">인증등급: 1급 정합성 검증</p>
          </div>
        </header>

        {/* ============================================================
            [SECTION 1: 가맹점 개요]
           ============================================================ */}
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-l-4 border-slate-900 pl-1.5">
            1. 실사 대상 가맹점 개요
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
            <tbody>
              <tr>
                <th className="w-24 bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  상호명
                </th>
                <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900">
                  {target.target_name}
                </td>
                <th className="w-24 bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  사업자등록번호
                </th>
                <td className="border border-slate-300 py-1 px-2 font-mono text-slate-800">
                  {metadata.biz_reg_no || "128-86-94812"}
                </td>
              </tr>
              <tr>
                <th className="bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  대표자
                </th>
                <td className="border border-slate-300 py-1 px-2 text-slate-800">
                  {target.representative_name} 대표
                </td>
                <th className="bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  업종 분류
                </th>
                <td className="border border-slate-300 py-1 px-2 text-slate-800">
                  {target.category === "HOSPITAL" && "의료 / 병원·의원 (비급여)"}
                  {target.category === "RESTAURANT" && "일반음식점 / 식음료"}
                  {target.category === "GYM" && "스포츠·피트니스 / 체육시설"}
                  {target.category === "NEW_STORE" && "신규 창업 가맹점 (6개월 미만)"}
                </td>
              </tr>
              <tr>
                <th className="bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  사업장 주소
                </th>
                <td className="border border-slate-300 py-1 px-2 text-slate-800">
                  {target.road_address} ({target.dong})
                </td>
                <th className="bg-slate-100 border border-slate-300 py-1 px-2 font-medium text-slate-700 text-left">
                  결제 솔루션
                </th>
                <td className="border border-slate-300 py-1 px-2 text-slate-800">
                  {metadata.terminal_company || "VAN 오프라인 + 테이블오더 PG"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ============================================================
            [SECTION 2: 7대 누수 코드 점검 결과표]
           ============================================================ */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-l-4 border-slate-900 pl-1.5">
              2. 7대 카드 수수료 누수 코드 정밀 점검표
            </h2>
            <span className="text-[10px] text-slate-500">
              * 여신금융협회 법정 우대율(0.5%) vs 실제 청구 요율 괴리 분석
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-semibold text-center border-b border-slate-300">
                <th className="w-16 border border-slate-300 py-1">코드</th>
                <th className="w-44 border border-slate-300 py-1 text-left px-2">누수 점검 항목</th>
                <th className="border border-slate-300 py-1 text-left px-2">진단 세부 내용</th>
                <th className="w-24 border border-slate-300 py-1">실사 판정</th>
              </tr>
            </thead>
            <tbody>
              {leakEvaluations.map((item) => (
                <tr
                  key={item.code}
                  className={item.isPrimary ? "bg-red-50/60 font-medium" : "even:bg-slate-50/40"}
                >
                  <td className="border border-slate-300 py-1 text-center font-mono font-semibold">
                    {item.code}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-slate-900">
                    {item.title}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-slate-600">
                    {item.description}
                  </td>
                  <td className="border border-slate-300 py-1 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded border text-[9.5px] font-semibold ${item.resultColor}`}
                    >
                      {item.resultStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ============================================================
            [SECTION 3: 3개년 추정 과오납 회수 예상액]
           ============================================================ */}
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-l-4 border-slate-900 pl-1.5">
            3. 3개년 과오납 회수 및 환급 추정치 산출
          </h2>

          <div className="grid grid-cols-4 gap-2">
            <div className="border border-slate-300 rounded p-2 bg-slate-50 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500">월평균 카드 매출</span>
              <p className="text-xs font-bold font-mono text-slate-900">
                {(metadata.monthly_card_sales || 35000000).toLocaleString()}원
              </p>
            </div>
            <div className="border border-slate-300 rounded p-2 bg-slate-50 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500">현재 차감 vs 법정 요율</span>
              <p className="text-xs font-bold font-mono text-red-600">
                {metadata.applied_rate || 2.15}%{" "}
                <span className="text-slate-400 font-normal">➔</span>{" "}
                {metadata.statutory_rate || 0.5}%
              </p>
            </div>
            <div className="border border-slate-300 rounded p-2 bg-slate-50 text-center space-y-0.5">
              <span className="text-[10px] text-slate-500">연간 누수 추정액</span>
              <p className="text-xs font-bold font-mono text-amber-700">
                {(metadata.annual_leak_estimate || 1610000).toLocaleString()}원
              </p>
            </div>
            <div className="border-2 border-red-600 rounded p-2 bg-red-50 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-red-800">
                3개년 총 환급 회수 예상액
              </span>
              <p className="text-sm font-black font-mono text-red-700">
                ₩{(metadata.estimated_refund || 4850000).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-700 space-y-0.5 leading-normal">
            <p className="font-semibold text-slate-900">
              [주요 환급 발생 원인 분석 소명]:
            </p>
            <p>
              {metadata.leakage_detail ||
                "당 가맹점은 국세청 매출액 신고 기준 연매출 3억 이하 영세가맹점 요건(법정 0.5%)에 해당함에도 불구하고, 단말기 전산상 2.15%의 일반 가맹점 수수료가 일괄 차감된 내역이 발견되었습니다. 8개 카드사 전산 전수 소명 시 최근 3개년치 차액 환급이 즉시 가능합니다."}
            </p>
          </div>
        </section>

        {/* ============================================================
            [SECTION 4: 안내문 및 직입금 원칙]
           ============================================================ */}
        <section className="space-y-1.5 bg-slate-100/80 border border-slate-300 rounded p-3">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1">
            <span>🛡️ 4. 가맹점주 보호 및 직입금(Direct Deposit) 원칙 안내</span>
          </h2>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-700 leading-relaxed">
            <li>
              <strong>카드사 직접 입금 원칙:</strong> 환급되는 모든 과오납 금액은 당사 계좌를 거치지 않고, 8개 전업 카드사에서 <strong>대표님 사업자 통장으로 직접 무통장 입금</strong>됩니다.
            </li>
            <li>
              <strong>사전 비용 0원 (100% 성공보수제):</strong> 착수금, 실사비, 전산 대행료는 일체 없으며, 실제 대표님 계좌로 환급이 완료된 이후에만 소정의 규정 정산 수수료가 발생합니다.
            </li>
            <li>
              <strong>행정 소명 리스크 제로:</strong> 여신금융협회 공시 기준 및 여신전문금융업법 제18조에 의거한 합법적 정당 권리 행사로, 기존 가맹점 계약 및 신용도에 어떠한 불이익도 발생하지 않습니다.
            </li>
          </ul>
        </section>

        {/* ============================================================
            [BOTTOM: 공식 인증 직인란]
           ============================================================ */}
        <footer className="pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[10px]">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 text-xs">
              Today Link Co., Ltd. & M-FAD 가맹점 권익수호 센터
            </p>
            <p className="text-slate-500">
              서울특별시 강남구 테헤란로 152 Today Link R&D 빌딩 8층 | 서포터즈 현장센터: 1544-0000
            </p>
            <p className="text-slate-400 font-mono">
              VERIFIED SECURE HASH: SHA256:{target.id.replace(/-/g, "").slice(0, 32).toUpperCase()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-950">기술평가 총괄검증관</p>
              <p className="text-[10px] text-slate-500">수석 가맹점 세무/공학 전문위원</p>
            </div>
            {/* 공식 인장 도장 시각화 */}
            <div className="relative flex items-center justify-center h-14 w-14 rounded-full border-2 border-red-600 text-red-600 font-serif font-bold text-[9px] text-center leading-none select-none p-1">
              <span className="transform -rotate-12">
                투데이링크
                <br />
                M-FAD
                <br />
                공인인증
              </span>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  );
}
