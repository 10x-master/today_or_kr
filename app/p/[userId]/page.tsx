"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Heart,
  MessageCircle,
  Phone,
  Play,
  QrCode,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import GroupBuyVoteButton from "@/components/commerce/GroupBuyVoteButton";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";

interface LinkPickUserProfile {
  userId: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  badge: string;
  bio: string;
  dong: string;
  social: {
    instagram?: string;
    youtube?: string;
    kakao?: string;
  };
  urgentNotice: {
    title: string;
    dDay: number;
    hoursLeft: number;
  };
  products: Array<{
    id: string;
    name: string;
    category: string;
    retailPrice: number;
    salePrice: number;
    discountPercent: number;
    votes: number;
    targetVotes: number;
    imageUrl?: string;
    commissionRate: number;
    highlights: string[];
  }>;
  shortsVideo: {
    title: string;
    hookScript: string;
    bodyScript: string;
    ctaScript: string;
    views: string;
    tags: string[];
  };
  customLinks: Array<{
    title: string;
    subtitle: string;
    icon: string;
    url: string;
  }>;
}

const MOCK_PROFILES: Record<string, LinkPickUserProfile> = {
  "ambassador-01": {
    userId: "ambassador-01",
    name: "김민수 엠버서더",
    handle: "@nowon_ambassador",
    badge: "👑 투데이 공인 엠버서더",
    bio: "상계·중계 단지 직거래 특판 & 15초 쇼츠 큐레이터 ☕ 생활 꿀템 제조원가 공구 전도사",
    dong: "상계동",
    social: {
      instagram: "https://instagram.com",
      youtube: "https://youtube.com/@shorts",
      kakao: "https://open.kakao.com",
    },
    urgentNotice: {
      title: "🚨 [단지 10인 공구 긴급 마감] 탑소닉 초음파 세척 싱크볼 3자리 남음!",
      dDay: 2,
      hoursLeft: 14,
    },
    products: [
      {
        id: "p-topsonic-01",
        name: "[탑소닉] 하이엔드 초음파 세척 싱크볼 (B2B 일체형)",
        category: "주방/가전",
        retailPrice: 1650000,
        salePrice: 680000,
        discountPercent: 58,
        votes: 7,
        targetVotes: 10,
        commissionRate: 8,
        highlights: ["과일·야채 농약 99.9% 세척", "식기세척기 대비 3배 빠른 초음파 음파 살균"],
      },
      {
        id: "p-roastery-02",
        name: "[노원 로스터리] 입주민 전용 당일 로스팅 싱글 오리진 원두 1kg",
        category: "식품/카페",
        retailPrice: 48000,
        salePrice: 28800,
        discountPercent: 40,
        votes: 9,
        targetVotes: 10,
        commissionRate: 10,
        highlights: ["상계역 당일 로스팅 발송", "아파트 입주민 전용 40% 특판가"],
      },
    ],
    shortsVideo: {
      title: "아직도 싱크볼에서 손으로 씻으세요? 15초 만에 설거지 끝내는 법",
      hookScript: "0~3초: '과일 씻을 때 잔류농약 걱정되셨죠? 손 안 대고 15초면 끝납니다!'",
      bodyScript: "4~10초: '탑소닉 초음파 싱크볼은 미세 기포 40,000Hz로 틈새 기름때까지 분해합니다.'",
      ctaScript: "11~15초: '우리 아파트 10인 모이면 58% 할인! 프로필 링크에서 공구 참여하세요!'",
      views: "18.4K",
      tags: ["#살림꿀팁", "#초음파세척기", "#단지공구", "#상계주공"],
    },
    customLinks: [
      {
        title: "🏢 [상계주공 14단지] CERA 공인 비즈 홈 바로가기",
        subtitle: "단지 투명도 지수(94점) 및 시설 보수 입찰 현황",
        icon: "🏢",
        url: "/biz/apt-sanggye14",
      },
      {
        title: "💼 제조 회원사 비즈노트 & 파트너스 소싱 룸",
        subtitle: "직거래 공급 단가 및 카탈로그 확인",
        icon: "🤝",
        url: "/partners",
      },
      {
        title: "📝 내 티노트 (t.note) 일기 & 숏폼 대본 보관함",
        subtitle: "음성 빠른 메모 및 1초 캘린더",
        icon: "📋",
        url: "/workspace",
      },
    ],
  },
};

function LinkPickMobileHubContent() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.userId as string) || "ambassador-01";
  const userId = decodeURIComponent(rawId).replace(/^@/, "");

  const profile =
    MOCK_PROFILES[userId] || {
      ...MOCK_PROFILES["ambassador-01"],
      userId,
      name: `${userId} 파트너`,
      handle: `@${userId}`,
    };

  const [votesMap, setVotesMap] = useState<Record<string, number>>({
    "p-topsonic-01": 7,
    "p-roastery-02": 9,
  });
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("내 LinkPick 고유 링크가 복사되었습니다!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 selection:bg-amber-500/20 selection:text-amber-950 font-sans">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-950 text-white text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 인포크링크형 모바일 1-Page 컨테이너 (max-w-md 고정) */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative border-x border-slate-200">
        {/* 상단 미니 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Today. 홈</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="QR코드 보기"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="링크 복사"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 1. 프로필 헤더 (원형 아바타, 닉네임, 한 줄 소개, 공식 뱃지, SNS 링크) */}
        <div className="pt-6 pb-4 px-5 text-center border-b border-slate-100 space-y-3">
          <div className="relative inline-block">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-2xl font-bold ring-4 ring-amber-100 shadow-md">
              {profile.name.slice(0, 1)}
            </div>
            <span className="absolute bottom-0 right-0 p-1 rounded-full bg-amber-500 text-white text-[10px] ring-2 ring-white">
              👑
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-medium text-slate-900 tracking-tight">
                {profile.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-normal">{profile.handle}</p>

            <div className="mt-1.5 flex justify-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                {profile.badge}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-normal mt-2 leading-relaxed px-4">
              {profile.bio}
            </p>
          </div>

          {/* SNS 바로가기 아이콘 3종 */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {profile.social.instagram && (
              <a
                href={profile.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-pink-600 transition-colors border border-slate-200"
                title="인스타그램"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
            )}
            {profile.social.youtube && (
              <a
                href={profile.social.youtube}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-rose-600 transition-colors border border-slate-200"
                title="유튜브 쇼츠"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
                </svg>
              </a>
            )}
            {profile.social.kakao && (
              <a
                href={profile.social.kakao}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] transition-colors shadow-2xs"
                title="카카오톡 1:1 오픈채팅"
              >
                <MessageCircle className="h-4 w-4 fill-current" />
              </a>
            )}
          </div>
        </div>

        {/* 2. 띠배너 공지: 긴급 공구 마감 D-Day 실시간 카운트다운 */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <p className="font-normal truncate text-[11px] text-amber-200">
              {profile.urgentNotice.title}
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-medium text-[10px]">
            D-{profile.urgentNotice.dDay} ({profile.urgentNotice.hoursLeft}시간)
          </span>
        </div>

        {/* 3. 커머스/공구 블록: 소싱 룸 연동 상품 카드 + 단지 10인 공구 투표 프로그레스 바 */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-medium text-slate-900">
                {profile.dong} 단지 10인 공구 & 직거래 특판
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">제조사 직거래 보증</span>
          </div>

          <div className="space-y-3">
            {profile.products.map((p) => {
              const currentVotes = votesMap[p.id] || p.votes;
              const percent = Math.min(100, Math.round((currentVotes / p.targetVotes) * 100));
              const isFinished = currentVotes >= p.targetVotes;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-100 p-4 bg-white hover:border-slate-200 transition-all shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium text-amber-600">
                        {p.category}
                      </span>
                      <h4 className="text-sm font-medium text-slate-900 leading-snug">
                        {p.name}
                      </h4>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200">
                      {p.discountPercent}% OFF
                    </span>
                  </div>

                  {/* 가격 표시 */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-medium text-slate-950 tracking-tight">
                      {p.salePrice.toLocaleString()}원
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {p.retailPrice.toLocaleString()}원
                    </span>
                  </div>

                  {/* 단지 10인 공구 투표 성사 게이지 바 */}
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700">
                        단지 공구 성사 현황: {currentVotes}/{p.targetVotes}명
                      </span>
                      <span className="font-medium text-amber-600">{percent}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500">
                      {isFinished
                        ? "🎉 10명 달성! 공구 확정 가격으로 즉시 주문 가능합니다."
                        : `* ${p.targetVotes - currentVotes}명 더 모이면 공구 확정 발송됩니다.`}
                    </p>
                  </div>

                  {/* 액션 버튼 2열 */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVotesMap((prev) => ({
                          ...prev,
                          [p.id]: (prev[p.id] || p.votes) + 1,
                        }));
                        showToast(`🙋 ${p.name} 공구 신청 투표가 완료되었습니다!`);
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-medium border border-amber-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🙋 공구 신청 (+1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        alert(`[${p.name}] 1:1 직거래 상담 및 특판 주문서가 오픈됩니다.`);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>1초 바로구매 →</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. 숏폼 비디오 블록: 15초 쇼츠 세로형(9:16) 영상 카드 */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs font-medium text-slate-900">
                15초 쇼츠 큐레이션 (엠버서더 픽)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">조회수 {profile.shortsVideo.views}</span>
          </div>

          <div className="rounded-2xl bg-slate-950 text-white p-4 space-y-3 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-medium">
                SHORTS PREVIEW
              </span>
              <button
                type="button"
                onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
              >
                {isPlayingVideo ? <Volume2 className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlayingVideo ? "재생중" : "미리보기"}</span>
              </button>
            </div>

            <h4 className="text-sm font-medium text-white leading-snug">
              {profile.shortsVideo.title}
            </h4>

            {/* 3단 대본 미리보기 박스 */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <p className="text-[11px] text-amber-300">{profile.shortsVideo.hookScript}</p>
              <p className="text-[11px] text-slate-300">{profile.shortsVideo.bodyScript}</p>
              <p className="text-[11px] text-emerald-400">{profile.shortsVideo.ctaScript}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
              {profile.shortsVideo.tags.map((t, idx) => (
                <span key={idx}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 5. 자율 커스텀 링크 블록 */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <h3 className="text-xs font-medium text-slate-700 px-1 mb-2">
            공식 연계 포털 바로가기
          </h3>
          {profile.customLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.url}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{link.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                    {link.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                    {link.subtitle}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          ))}
        </div>

        {/* 6. 하단 Sticky Bar: [📞 전화상담] | [💬 1:1 상담] | [공유하기] */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-xs">
            <a
              href="tel:010-9999-1234"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
            >
              <Phone className="h-4 w-4 text-amber-600" />
              <span>전화상담</span>
            </a>

            <a
              href={profile.social.kakao || "https://open.kakao.com"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-medium transition-colors shadow-2xs"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>1:1 상담</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-amber-400" />
              <span>공유하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR코드 팝업 모달 */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-2xl bg-white border border-slate-100 shadow-2xl p-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h4 className="text-sm font-medium text-slate-900">{profile.name}</h4>
              <p className="text-xs text-slate-400 font-normal">오프라인 인쇄 & 현장 스캔 QR</p>
            </div>

            {/* 고해상도 QR코드 캔버스 대용 SVG */}
            <div className="mx-auto w-44 h-44 rounded-xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center shadow-inner">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-slate-900 rounded-lg">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      i % 2 === 0 || i % 5 === 0 ? "bg-white" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              linkpick.co.kr/@{profile.userId}
            </p>

            <button
              type="button"
              onClick={() => {
                handleCopyLink();
                setIsQrModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              링크 복사 후 닫기
            </button>
          </div>
        </div>
      )}

      {/* 크리에이터 전용 모바일 1-Tap PWA 홈 화면 설치 배너 */}
      <PwaInstallBanner
        bizId={profile.userId}
        bizName={profile.name}
        bizType="CREATOR"
        referrerId={profile.userId}
      />
    </div>
  );
}

export default function LinkPickMobileHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        </div>
      }
    >
      <LinkPickMobileHubContent />
    </Suspense>
  );
}
