"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Scale,
  Shield,
  ShieldAlert,
  Video,
  CheckCircle2,
} from "lucide-react";
import {
  LEGAL_OPERATOR_NAME,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_CONTACT,
  DATA_RETENTION_POLICY_SUMMARY,
} from "@/lib/legal/legalInfo";

export default function TermsPage() {
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
            href="/privacy"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors"
          >
            개인정보 처리방침 보기
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
            <span className="rounded-xl bg-amber-100 p-2.5 text-amber-900">
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                투데이(Today.) 서비스 이용약관 및 초상권 면책 규정
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

        {/* 중요 고시 안내 박스 */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-xs text-rose-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-rose-800 text-sm">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
            <span>[중요] 초상권 및 미디어 등록자의 전적인 법적 책임 고지</span>
          </div>
          <p className="leading-relaxed">
            회원이 투데이 플랫폼에 등록하는 모든 사진, 동영상, 음성 파일은 타인의 얼굴, 식별 가능한 신체 부위, 차량 번호판, 사유지 내부 등 타인의 초상권 및 사생활 비밀을 침해하지 않아야 합니다. 침해 발생 시 이에 대한 <strong>민·형사상 모든 법적 책임과 손해배상 의무는 해당 미디어를 등록한 회원(작성자)에게 있으며</strong>, 서비스 제공자는 일체의 책임을 부담하지 않습니다.
          </p>
        </div>

        {/* 조항별 본문 */}
        <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 제1조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              제1조 (목적 및 정의)
            </h2>
            <p>
              1. 본 약관은 {LEGAL_OPERATOR_NAME}(이하 &quot;운영자&quot;) 및 투데이 운영팀이 제공하는 로컬 팩트 미디어, 아파트 단지 협업 시스템, 티노트(t.note), 엠버서더 쇼츠 쇼룸(이하 &quot;서비스&quot;)의 이용 조건과 회원 및 운영자의 권리, 의무, 책임 사항을 명확히 함을 목적으로 합니다.
            </p>
            <p>
              2. &quot;회원&quot;이라 함은 카카오 간편인증 또는 일반 절차를 통해 본 약관에 동의하고 서비스 이용 자격을 획득한 개인 또는 단체를 의미합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              제2조 (회원의 의무 및 미디어 등록 준수사항)
            </h2>
            <p>
              1. 회원은 서비스 이용 시 관계 법령, 본 약관, 공서양속을 준수해야 하며, 타인의 권리를 침해하거나 서비스의 안정적 운영을 방해하는 행위를 하여서는 안 됩니다.
            </p>
            <p>
              2. 회원이 피드, 2-Tap 퀵 캡처, 단지 공유 보드, 엠버서더 쇼츠 등에 업로드하는 모든 미디어(사진, 동영상, 오디오)는 본인이 직접 촬영하거나 정당한 권리를 보유한 것이어야 합니다.
            </p>
          </section>

          {/* 제3조 - 핵심 초상권 면책 */}
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Scale className="h-4 w-4 text-rose-600" />
              제3조 (초상권 침해 금지 및 등록자 전적인 법적 책임 면책)
            </h2>
            <p>
              1. 회원은 미디어 촬영 및 등록 시 제3자의 명시적 동의 없이 특정인의 얼굴, 식별 가능한 전신, 주거지 내부, 자동차 등록 번호판 등이 노출되지 않도록 모자이크 처리 등 필요한 보호 조치를 취해야 합니다.
            </p>
            <p>
              2. 회원이 등록한 게시물 또는 미디어로 인하여 제3자로부터 초상권, 저작권, 사생활의 비밀 침해, 명예훼손 등에 따른 손해배상 청구, 소송, 형사 고소·고발이 제기되는 경우, <strong>모든 민·형사상 법적 책임 및 이로 인하여 발생하는 일체의 손해배상금, 변호사 보수 등 비용은 등록한 회원(작성자) 본인이 전적으로 부담합니다.</strong>
            </p>
            <p>
              3. 운영자 및 투데이 서비스 제공자는 회원이 게시한 콘텐츠의 진실성이나 적법성에 대해 사전 검열 의무를 부담하지 아니하며, 회원 간 또는 회원과 제3자 간의 분쟁에 대해 어떠한 법적 책임도 부담하지 않습니다.
            </p>
          </section>

          {/* 제4조 - 공식 SNS 2차 가공 동의 */}
          <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-600" />
              제4조 (공식 SNS 유튜브 쇼츠·인스타그램 무상 2차 가공 및 배포 동의)
            </h2>
            <p>
              1. 회원이 엠버서더 쇼츠 쇼룸, 로컬 피드, 퀵 캡처를 통해 등록한 공익성 팩트 사진과 음성 데이터는 투데이 AI 자동화 파이프라인에 의해 15초 세로형 숏폼 비디오(9:16)로 2차 가공·편집될 수 있습니다.
            </p>
            <p>
              2. 가공된 쇼츠 영상은 투데이 공식 유튜브 채널(YouTube Shorts), 인스타그램(Reels), 틱톡 등 공식 SNS 채널에 카테고리별로 자동 등록 및 무상 배포될 수 있으며, 회원은 이에 대해 저작재산권 이용 허락 및 2차적 저작물 작성·배포에 동의합니다.
            </p>
            <p>
              3. 회원은 공식 SNS에 배포된 영상에 대하여 정당한 사유가 있는 경우 운영팀에 수정 또는 삭제 요청을 할 수 있습니다.
            </p>
          </section>

          {/* 제5조 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              제5조 (불법 미디어 무통보 블라인드 및 계정 제재)
            </h2>
            <p>
              운영팀은 다음 각 호에 해당하는 미디어나 게시글에 대해 작성자 사전 통보 없이 즉시 비공개(블라인드) 또는 삭제 조치할 수 있으며, 누적 위반 시 회원 자격을 영구 박탈할 수 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>타인의 초상권, 저작권, 사생활을 동의 없이 침해한 사진 또는 영상</li>
              <li>차량 번호판이나 개인정보가 노출된 미디어</li>
              <li>음란, 폭력, 혐오 표현 등 사회 질서에 반하는 미디어</li>
              <li>허위 사실 유포 및 타인의 명예를 훼손하는 콘텐츠</li>
            </ul>
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
