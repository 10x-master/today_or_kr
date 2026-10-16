"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Database,
  Eye,
  FileText,
  Lock,
  Scale,
  Share2,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  LEGAL_OPERATOR_NAME,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_CONTACT,
  DATA_RETENTION_POLICY_SUMMARY,
} from "@/lib/legal/legalInfo";

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl bg-slate-50 px-4 py-8 sm:px-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Today. 홈으로 돌아가기
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/terms"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
          >
            서비스 이용약관 보기
          </Link>
          <span className="text-xs font-semibold text-slate-400">
            최종 개정일: 2026년 10월 17일
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* 타이틀 */}
        <div className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-blue-100 p-2.5 text-blue-900">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                투데이(Today.) 개인정보 처리방침
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {LEGAL_OPERATOR_NAME} 운영 하이퍼로컬 공공 팩트 피드 및 엠버서더 플랫폼
              </p>
            </div>
          </div>
        </div>

        {/* 운영 주체 및 개인정보 보호책임자 고지 박스 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
            <span>서비스 운영 주체 및 개인정보 보호책임자 고지</span>
          </div>
          <ul className="space-y-1.5 pl-1">
            <li>
              <strong className="text-slate-900">서비스 운영 주체 :</strong> {LEGAL_OPERATOR_NAME}
            </li>
            <li>
              <strong className="text-slate-900">개인정보 보호책임자(CPO) :</strong> {PRIVACY_OFFICER_NAME} (문의 {PRIVACY_OFFICER_CONTACT})
            </li>
            <li>
              <strong className="text-slate-900">개인정보 보관 및 파기 기준 :</strong> {DATA_RETENTION_POLICY_SUMMARY}
            </li>
          </ul>
        </div>

        {/* 조항별 본문 */}
        <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 제1조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              제1조 (총칙)
            </h2>
            <p>
              {LEGAL_OPERATOR_NAME}(이하 &quot;운영자&quot;)는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관계 법령을 준수하고 있습니다. 운영자는 본 개인정보 처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </section>

          {/* 제2조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              제2조 (수집하는 개인정보 항목 및 수집 방법)
            </h2>
            <p>1. 운영자는 아래와 같은 방법으로 회원가입 및 서비스 이용 과정에서 개인정보를 수집합니다.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>카카오 간편로그인 : 닉네임(이름), 이메일, 프로필 사진</li>
              <li>구글 계정 로그인(영업사원·비즈니스) : 이메일, 이름, 프로필 사진, 구글 드라이브 연동 범위(drive.file)</li>
              <li>서비스 이용 과정에서 자동 생성·수집 : 접속 로그, 접속 IP, 쿠키, 기기 정보, 서비스 이용 기록</li>
              <li>t.sign 음성 전자계약 이용 시 : 음성 녹음 데이터, 계약 서명 정보</li>
            </ul>
          </section>

          {/* 제3조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              제3조 (개인정보의 수집 및 이용 목적)
            </h2>
            <p>
              운영자는 수집한 개인정보를 회원 식별 및 본인 확인, 서비스 제공 및 운영(t.note·t.sign·t.check·t.refund·비즈홈 등), 민원 처리, 중요 고지사항 전달, 부정 이용 방지, 통계 분석 및 서비스 개선 목적으로만 이용하며, 목적 외 용도로 이용하지 않습니다.
            </p>
          </section>

          {/* 제4조 - 핵심 보관/파기 기준 */}
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-600" />
              제4조 (개인정보의 보유 및 이용 기간, 파기절차 및 방법)
            </h2>
            <p>
              1. 운영자는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만, {DATA_RETENTION_POLICY_SUMMARY}
            </p>
            <p>
              2. 전자적 파일 형태로 저장된 개인정보는 복구 및 재생이 불가능한 기술적 방법을 사용하여 영구 삭제하며, 종이 문서에 출력된 개인정보는 분쇄하거나 소각하여 파기합니다.
            </p>
          </section>

          {/* 제5조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-blue-600" />
              제5조 (개인정보의 제3자 제공 및 처리 위탁)
            </h2>
            <p>
              1. 운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않으며, 법령에 특별한 규정이 있거나 이용자가 사전에 동의한 경우에 한하여 필요 최소한의 범위로 제공합니다.
            </p>
            <p>
              2. 운영자는 서비스 운영을 위해 클라우드 인증·데이터베이스(Supabase) 및 호스팅·배포(Vercel) 등 업무를 외부 전문업체에 위탁하고 있으며, 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
            </p>
          </section>

          {/* 제6조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              제6조 (이용자 및 법정대리인의 권리와 행사 방법)
            </h2>
            <p>
              이용자는 언제든지 자신의 개인정보를 조회·수정하거나 가입 해지(동의 철회)를 요청할 수 있으며, 서비스 내 설정 메뉴 또는 아래 개인정보 보호책임자에게 연락하여 처리를 요청할 수 있습니다.
            </p>
          </section>

          {/* 제7조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              제7조 (개인정보의 안전성 확보 조치)
            </h2>
            <p>
              운영자는 개인정보 암호화 전송·저장, 접근권한 관리, 접속기록 보관 및 위변조 방지, 해킹 등에 대비한 보안 프로그램 설치 등 개인정보 보호법 제29조에 따라 안전성 확보에 필요한 기술적·관리적 조치를 취하고 있습니다.
            </p>
          </section>

          {/* 제8조 - 책임자 */}
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Scale className="h-4 w-4 text-rose-600" />
              제8조 (개인정보 보호책임자)
            </h2>
            <p>
              운영자는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자(CPO)를 지정하고 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>성명 : {PRIVACY_OFFICER_NAME}</li>
              <li>문의처 : {PRIVACY_OFFICER_CONTACT}</li>
              <li>소속 : {LEGAL_OPERATOR_NAME}</li>
            </ul>
            <p>
              이용자는 서비스 이용 중 발생하는 모든 개인정보 보호 관련 민원을 개인정보 보호책임자에게 문의하실 수 있으며, 운영자는 신속하고 성실하게 답변드리겠습니다.
            </p>
          </section>

          {/* 제9조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              제9조 (고지의 의무)
            </h2>
            <p>
              본 개인정보 처리방침은 관계 법령 및 내부 방침에 따라 변경될 수 있으며, 내용의 추가·삭제 및 수정이 있을 경우 변경사항 시행 최소 7일 전에 서비스 내 공지사항을 통해 고지합니다.
            </p>
          </section>
        </div>

        {/* 푸터 확인 버튼 */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <Link
            href="/"
            className="rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            확인 및 홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
