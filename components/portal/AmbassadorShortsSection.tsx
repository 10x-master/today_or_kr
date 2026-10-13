"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Flame,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Video,
  Volume2,
  X,
} from "lucide-react";

export interface AmbassadorShortItem {
  id: string;
  title: string;
  category: string;
  categoryBadgeColor: string;
  dong: string;
  authorName: string;
  authorBadge: string;
  viewCount: string;
  likeCount: string;
  duration: string;
  gradientBg: string;
  youtubeUrl: string;
  aiPromptSnippet: string;
}

const mockShorts: AmbassadorShortItem[] = [
  {
    id: "short-001",
    title: "상계주공5단지 재건축 안전진단 통과 15초 팩트체크",
    category: "재개발·인프라",
    categoryBadgeColor: "bg-indigo-600 text-white",
    dong: "상계동",
    authorName: "박노원 앰버서더",
    authorBadge: "👑 우수 앰버서더",
    viewCount: "14.8K",
    likeCount: "1.2K",
    duration: "0:15",
    gradientBg: "from-indigo-900 via-slate-900 to-indigo-950",
    youtubeUrl: "https://www.youtube.com/shorts/sanggye-redevelop",
    aiPromptSnippet: "노원구 고시 제2026-104호 기반 상계주공 5단지 15초 팩트 요약 영상",
  },
  {
    id: "short-002",
    title: "노원 로스터리 카페 입주민 10% 상생 할인 팩트체크",
    category: "입주민 혜택",
    categoryBadgeColor: "bg-purple-600 text-white",
    dong: "상계동",
    authorName: "노원블루카페",
    authorBadge: "☕ 인증 파트너",
    viewCount: "9.2K",
    likeCount: "840",
    duration: "0:15",
    gradientBg: "from-purple-900 via-slate-900 to-rose-950",
    youtubeUrl: "https://www.youtube.com/shorts/nowon-cafe-benefit",
    aiPromptSnippet: "상계역 도보 3분 로컬 로스팅 카페 입주민 인증 쿠폰 혜택 숏폼",
  },
  {
    id: "short-003",
    title: "아파트 단지 AI 디지털 실무 교육 15인 수료 현장",
    category: "단지 교육",
    categoryBadgeColor: "bg-emerald-600 text-white",
    dong: "상계동",
    authorName: "박성진 동대표",
    authorBadge: "👔 입주자대표",
    viewCount: "11.5K",
    likeCount: "980",
    duration: "0:15",
    gradientBg: "from-emerald-950 via-slate-900 to-teal-950",
    youtubeUrl: "https://www.youtube.com/shorts/apt-ai-edu",
    aiPromptSnippet: "협회 주관 시니어 AI 스마트폰 및 전자투표 15인 현장 스케치",
  },
  {
    id: "short-004",
    title: "여수 돌산 로컬 반건조 생선 산지 직송 맛보기",
    category: "특판·링크픽",
    categoryBadgeColor: "bg-amber-600 text-white",
    dong: "돌산읍",
    authorName: "이돌산 앰버서더",
    authorBadge: "🐟 로컬 서포터즈",
    viewCount: "23.4K",
    likeCount: "2.1K",
    duration: "0:15",
    gradientBg: "from-amber-950 via-slate-900 to-orange-950",
    youtubeUrl: "https://www.youtube.com/shorts/dolsan-fish-linkpick",
    aiPromptSnippet: "여수 돌산 어판장 당일 조업 우럭·민어 반건조 15초 직송 숏폼",
  },
];

export default function AmbassadorShortsSection() {
  const [selectedShort, setSelectedShort] = useState<AmbassadorShortItem | null>(null);

  return (
    <section className="bg-white py-2.5 px-3 border-b border-slate-100 space-y-2.5">
      {/* 1. 상단 섹션 타이틀 & 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white">
              <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>투데이 엠버서더 쇼츠 쇼룸</span>
              <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[10px] font-medium">
                15초 AI 숏폼
              </span>
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 font-normal">
            주민 앰버서더의 현장 사진·음성이 AI 15초 쇼츠로 가공되어 공식 채널에 자동 등록됩니다.
          </p>
        </div>

        <Link
          href="/terms"
          className="text-[11px] font-normal text-slate-400 hover:text-slate-600 hover:underline"
        >
          초상권·배포 규정 안내 ↗
        </Link>
      </div>

      {/* 2. 핵심 안내 배너 (네이버 뉴스식 깔끔한 서브 배경) */}
      <div className="rounded-xl bg-amber-50/70 p-2.5 flex items-start gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-slate-950 shrink-0 font-medium text-xs">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-900 leading-snug">
            &quot;엠버서더가 사진과 음성을 남기면 AI가 15초 쇼츠로 가공하여 투데이 공식 유튜브 채널에 카테고리별로 자동 등록됩니다.&quot;
          </p>
          <p className="mt-0.5 text-[11px] text-slate-600 font-normal leading-normal">
            2-Tap 퀵 캡처로 등록된 유익한 공익 팩트는 자동 심사를 거쳐 유튜브 Shorts와 인스타그램 Reels로 무료 2차 홍보 지원됩니다.
          </p>
        </div>
      </div>

      {/* 3. 9:16 세로형 숏폼 카드 가로 롤링 (4열 그리드) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {mockShorts.map((short) => (
          <div
            key={short.id}
            onClick={() => setSelectedShort(short)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-slate-900 text-white aspect-[9/16] hover:opacity-95 transition-opacity cursor-pointer"
          >
            {/* 배경 그라데이션 및 썸네일 패턴 */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${short.gradientBg} opacity-90 group-hover:opacity-100 transition-opacity`}
            />

            {/* 카드 상단 배지 (카테고리 + 행정동 + Shorts 로고) */}
            <div className="relative z-10 p-2 flex items-center justify-between gap-1">
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${short.categoryBadgeColor}`}
              >
                {short.category}
              </span>
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-normal text-amber-300">
                📍 {short.dong}
              </span>
            </div>

            {/* 중앙 플레이 버튼 오버레이 */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/90 text-white group-hover:bg-red-600 transition-colors">
                <Play className="h-4 w-4 fill-white ml-0.5" />
              </div>
              <span className="mt-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-normal text-slate-200">
                {short.duration}
              </span>
            </div>

            {/* 카드 하단 텍스트 정보 */}
            <div className="relative z-10 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-4 space-y-0.5">
              <p className="text-[10px] font-normal text-slate-300 truncate">
                {short.authorName}
              </p>
              <h3 className="text-[11.5px] font-medium leading-tight line-clamp-2 text-white">
                {short.title}
              </h3>
              <div className="flex items-center justify-between pt-0.5 text-[9px] text-slate-400 font-normal">
                <span>조회 {short.viewCount}</span>
                <span className="text-red-400 font-medium">Shorts ↗</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. 쇼츠 미리보기 모달 */}
      {selectedShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white shadow-2xl space-y-3">
            <button
              type="button"
              onClick={() => setSelectedShort(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 모달 상단 */}
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white">
                <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </span>
              <div>
                <span className="text-[10px] font-normal text-amber-400">
                  {selectedShort.category} • {selectedShort.dong}
                </span>
                <h3 className="text-xs font-medium leading-snug">
                  {selectedShort.title}
                </h3>
              </div>
            </div>

            {/* 가상 세로 비디오 플레이어 뷰 */}
            <div
              className={`relative flex items-center justify-center rounded-xl aspect-[9/14] bg-gradient-to-b ${selectedShort.gradientBg} p-4 border border-slate-800`}
            >
              <div className="text-center space-y-2 max-w-[240px]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-xl animate-pulse">
                  <Play className="h-6 w-6 fill-white ml-0.5" />
                </div>
                <p className="text-xs font-medium text-white">
                  15초 AI 숏폼 렌더링 완료
                </p>
                <p className="text-[11px] text-slate-300 font-normal leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/10">
                  {selectedShort.aiPromptSnippet}
                </p>
              </div>

              <span className="absolute bottom-2.5 right-2.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-normal text-slate-300">
                {selectedShort.duration}
              </span>
            </div>

            {/* 하단 작성자 정보 & 유튜브 열기 링크 */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <div className="text-xs font-normal">
                <span className="text-slate-400 block text-[10px]">
                  제작 앰버서더
                </span>
                <span className="font-medium">{selectedShort.authorName}</span>
              </div>

              <a
                href={selectedShort.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <span>유튜브 Shorts로 열기</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

