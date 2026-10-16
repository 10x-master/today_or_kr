"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

interface AptLinkNewsItem {
  id: string;
  badge: string;
  badgeTone: string;
  complexName: string;
  title: string;
  desc: string;
}

const APTLINK_NEWS: AptLinkNewsItem[] = [
  {
    id: "news-1",
    badge: "안심 관리 1등급",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    complexName: "상계주공 7단지",
    title: "CERA 실거래 적정성 완료!",
    desc: "승강기 교체 공사 입찰가 검증 결과 정상 범위 확인",
  },
  {
    id: "news-2",
    badge: "지자체 인증",
    badgeTone: "bg-blue-50 text-blue-700 border-blue-200",
    complexName: "중계그린아파트",
    title: "지자체 안심관리 1등급 획득",
    desc: "장기수선충당금 적립 적정성 및 클린 단지 선정",
  },
  {
    id: "news-3",
    badge: "안심 케어",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    complexName: "하계장미 아파트",
    title: "주민 분담금 예방 장기공사 가이드 발행",
    desc: "승강기·도색 등 대규모 수선 전 입주민 소통 활성화",
  },
];

/**
 * 우측 50%: 아파트링크 전용 소식 & 리포트 — 단지별 CERA 실거래 검증, 지자체 안심관리
 * 인증 등 아파트 B2B 컨설팅 성과를 스레드형으로 노출하고, 상세 리포트는 /aptlink로 연결한다.
 */
export default function AptLinkNewsFeed({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <Building2 className="h-3.5 w-3.5 text-blue-600" />
          아파트링크 전용 소식 &amp; 리포트
        </h3>
        <Link href="/aptlink" className="text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
          전체보기 →
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {APTLINK_NEWS.map((item) => (
          <div key={item.id} className="px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1 text-[11px] flex-wrap">
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-medium border ${item.badgeTone}`}
              >
                <ShieldCheck className="h-3 w-3" />
                {item.badge}
              </span>
              <span className="font-medium text-slate-700">{item.complexName}</span>
            </div>
            <p className="text-[13.5px] font-medium text-slate-900 leading-snug">{item.title}</p>
            <p className="mt-0.5 text-xs text-slate-500 font-normal leading-relaxed">{item.desc}</p>
            <Link
              href="/aptlink"
              className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:underline"
            >
              리포트 확인하기 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
