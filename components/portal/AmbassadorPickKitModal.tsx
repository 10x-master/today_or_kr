"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mic,
  Video,
  Link2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Share2,
  Clock,
  Flame,
  Crown,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { SourcingItem } from "@/components/portal/MemberSourcingSection";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";

interface AmbassadorPickKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SourcingItem | null;
  userId?: string;
}

export default function AmbassadorPickKitModal({
  isOpen,
  onClose,
  item,
  userId: propUserId,
}: AmbassadorPickKitModalProps) {
  const [activeTab, setActiveTab] = useState<"script" | "prompt" | "link">("script");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("ambassador_77");

  useEffect(() => {
    if (propUserId) {
      setCurrentUserId(propUserId);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("today_auth_user");
        if (saved) {
          const user = JSON.parse(saved);
          if (user?.id) {
            setCurrentUserId(user.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16));
            return;
          }
        }
      } catch {}
    }
    getCurrentAuthUser().then((user) => {
      if (user?.id) {
        setCurrentUserId(user.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16));
      }
    });
  }, [propUserId]);

  if (!isOpen || !item) return null;

  // 1. 단축 상품 코드 및 리퍼럴 링크 생성
  const productCode = item.id.replace(/^src-/, "item-");
  const referralLink = `https://linkpick.co.kr/r/${productCode}?ref=${currentUserId}`;

  // 2. 15초 구어체 쇼츠 대본 구성 요소
  const hookScript = `혹시 아직도 ${item.title} 비싸게 제값 다 주고 계셨나요?`;
  const bodyScript = `${item.manufacturer} 직거래로 중간 유통마진 싹 빼고 ${item.supplyPrice}에 풀렸습니다. ${item.description}`;
  const ctaScript = `우리 아파트 입주민 전용 한정 수량이니까, 지금 바로 프로필 링크 누르고 선착순 확인해보세요!`;
  const fullShortsScript = `[0~3초 후킹]\n${hookScript}\n\n[4~10초 핵심 효용]\n${bodyScript}\n\n[11~15초 CTA]\n${ctaScript}`;

  // 3. AI 비디오 생성 프롬프트 (9:16 TopView/Gen-3/Luma/Sora 최적화)
  const scene1 = `Scene 1 (0-4s / Macro Hook): Extreme close-up macro pan of ${item.title}, ultra high-detail textures, natural cinematic morning light, shallow depth of field, 9:16 vertical aspect ratio, 4K resolution, minimalist clean aesthetic.`;
  const scene2 = `Scene 2 (4-10s / Hands-on Demo): POV demonstration of ${item.title} in a modern Korean apartment setting, smooth realistic movement, high-contrast crisp lighting, authentic tactile satisfaction, 9:16 vertical framing.`;
  const scene3 = `Scene 3 (10-15s / Lifestyle CTA): Sleek Scandinavian desk flat-lay featuring ${item.title} next to a smartphone screen glowing with a discount badge, gentle camera tilt-up, inviting viral short-form pacing.`;
  const fullAiPrompt = `// 9:16 Vertical Short-form Video Generation Prompts\n${scene1}\n\n${scene2}\n\n${scene3}\n\nNegative Prompt: blur, low quality, distorted text, 16:9 widescreen, cartoon, oversaturated.`;

  // 클립보드 복사 헬퍼 및 1.5초 토스트 알림
  const handleCopy = (text: string, key: string, message: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setToastMessage(message);

    setTimeout(() => {
      setCopiedKey(null);
      setToastMessage(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* 상단 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="모달 닫기"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 헤더: 상품 요약 정보 & 엠버서더 픽 배지 */}
        <div className="pr-6 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              <Crown className="h-3 w-3 text-amber-600" />
              <span>투데이 엠버서더 배포 킷</span>
            </span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
              리워드 {item.commissionRate} ({item.commissionAmount})
            </span>
            <span className="text-[10px] font-normal text-slate-400">
              제조사: {item.manufacturer}
            </span>
          </div>

          <h2 className="text-sm font-medium text-slate-900 leading-snug">
            {item.title}
          </h2>
          <p className="text-[11px] font-normal text-slate-500">
            특판 공급가 <strong className="font-medium text-slate-800">{item.supplyPrice}</strong> · 입주민 단독 할인가
          </p>
        </div>

        {/* 3대 핵심 탭 스위처 */}
        <div className="flex border-b border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("script")}
            className={`pb-2 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "script"
                ? "border-amber-500 text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-amber-600" />
            <span>🎙️ 15초 쇼츠 대본</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("prompt")}
            className={`pb-2 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "prompt"
                ? "border-indigo-500 text-indigo-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Video className="h-3.5 w-3.5 text-indigo-600" />
            <span>🎬 AI 영상 프롬프트</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`pb-2 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "link"
                ? "border-emerald-500 text-emerald-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Link2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>🔗 전용 리퍼럴 링크</span>
          </button>
        </div>

        {/* 탭 1: 15초 구어체 쇼츠 대본 */}
        {activeTab === "script" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>예상 러닝타임: 약 14.5초 (공백 포함 약 130자)</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Flame className="h-3 w-3 text-rose-500" />
                <span>바이럴 3단 구조</span>
              </span>
            </div>

            {/* 대본 카드 3단 구조 */}
            <div className="space-y-2 text-xs">
              {/* 0~3초 후킹 */}
              <div className="rounded-xl bg-amber-50/60 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-medium text-amber-900 flex items-center gap-1">
                    ⚡ 0~3초: 시선 집중 후킹 질문
                  </span>
                  <span className="text-amber-700/70 font-normal">이탈 방지 훅</span>
                </div>
                <p className="text-[11px] font-normal text-slate-800 leading-relaxed">
                  &ldquo;{hookScript}&rdquo;
                </p>
              </div>

              {/* 4~10초 핵심 효용 및 비교 */}
              <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-medium text-slate-900 flex items-center gap-1">
                    💡 4~10초: 본사 직거래 혜택 & 핵심 효용
                  </span>
                  <span className="text-slate-400 font-normal">가치 입증</span>
                </div>
                <p className="text-[11px] font-normal text-slate-800 leading-relaxed">
                  &ldquo;{bodyScript}&rdquo;
                </p>
              </div>

              {/* 11~15초 프로필 링크 클릭 유도 CTA */}
              <div className="rounded-xl bg-emerald-50/60 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-medium text-emerald-900 flex items-center gap-1">
                    👉 11~15초: 프로필 링크 클릭 유도 (CTA)
                  </span>
                  <span className="text-emerald-700/70 font-normal">전환 마감</span>
                </div>
                <p className="text-[11px] font-normal text-slate-800 leading-relaxed">
                  &ldquo;{ctaScript}&rdquo;
                </p>
              </div>
            </div>

            {/* 원클릭 대본 복사 버튼 */}
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  fullShortsScript,
                  "script",
                  "✓ 15초 쇼츠 대본이 클립보드에 복사되었습니다."
                )
              }
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-medium text-slate-950 transition-colors cursor-pointer shadow-xs"
            >
              {copiedKey === "script" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>대본 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>쇼츠 전체 대본 원클릭 복사</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 탭 2: 비디오 생성 프롬프트 (TopView / Runway / Luma / Sora용) */}
        {activeTab === "prompt" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>세로형 9:16 연출 컷별 최적화 영문 프롬프트</span>
              </span>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-normal">
                TopView / Runway 4K
              </span>
            </div>

            {/* 씬별 프롬프트 박스 */}
            <div className="space-y-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-indigo-900">
                  <span>Cut 1: Extreme Close-up & Texture (0-4s)</span>
                  <span className="text-slate-400 font-normal">후킹 컷</span>
                </div>
                <p className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg">
                  {scene1}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-indigo-900">
                  <span>Cut 2: Demonstration & Hands-on Action (4-10s)</span>
                  <span className="text-slate-400 font-normal">효용 검증 컷</span>
                </div>
                <p className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg">
                  {scene2}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-indigo-900">
                  <span>Cut 3: Clean Lifestyle & Discount CTA (10-15s)</span>
                  <span className="text-slate-400 font-normal">엔딩 클로징</span>
                </div>
                <p className="text-[11px] font-mono text-slate-700 leading-relaxed bg-white/70 p-2 rounded-lg">
                  {scene3}
                </p>
              </div>
            </div>

            {/* 영상 프롬프트 전체 복사 버튼 */}
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  fullAiPrompt,
                  "prompt",
                  "✓ 3컷 비디오 생성 프롬프트가 복사되었습니다."
                )
              }
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
            >
              {copiedKey === "prompt" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>프롬프트 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>3컷 AI 영상 프롬프트 일괄 복사</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 탭 3: 내 전용 리퍼럴 링크 */}
        {activeTab === "link" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="rounded-xl bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-900 flex items-center gap-1">
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>내 엠버서더 전용 숏링크 (LinkPick)</span>
                </span>
                <span className="text-[10px] font-normal text-slate-400">
                  ID: {currentUserId}
                </span>
              </div>

              {/* URL 박스 */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      referralLink,
                      "link",
                      "✓ 리퍼럴 링크가 클립보드에 복사되었습니다."
                    )
                  }
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer"
                >
                  {copiedKey === "link" ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* 수익 정산 안내 요약 */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="rounded-lg bg-white/80 p-2 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-normal text-slate-400">판매 1건당 내 수익</span>
                  <p className="font-medium text-rose-600">{item.commissionAmount}</p>
                </div>
                <div className="rounded-lg bg-white/80 p-2 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-normal text-slate-400">정산 주기</span>
                  <p className="font-medium text-slate-800">매주 수요일 계좌 자동 입금</p>
                </div>
              </div>
            </div>

            {/* 보너스: 카카오톡/인스타 전달용 공유 텍스트 원클릭 복사 */}
            <div className="rounded-xl border border-dashed border-slate-200 p-2.5 space-y-1.5 text-xs">
              <span className="text-[10px] font-medium text-slate-500">
                💬 인스타 프로필 / 단톡방 빠른 공유 문구
              </span>
              <p className="text-[11px] font-normal text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                [투데이 단독 제휴] {item.title} 단지 입주민 특가 {item.supplyPrice}!
                <br />
                👉 바로가기: {referralLink}
              </p>
              <button
                type="button"
                onClick={() => {
                  const shareMsg = `[투데이 단독 제휴] ${item.title} 단지 입주민 특가 ${item.supplyPrice}!\n👉 확인: ${referralLink}`;
                  handleCopy(
                    shareMsg,
                    "shareText",
                    "✓ 단톡방/SNS 공유 문구가 복사되었습니다."
                  );
                }}
                className="w-full flex items-center justify-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 py-1.5 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                {copiedKey === "shareText" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>공유 문구 복사 완료</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>SNS 공유용 1줄 텍스트 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 하단 공통 풋터 */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
          <span>※ 파트너스 링크 클릭 후 24시간 내 구매 시 리워드 집계</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-normal text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            닫기
          </button>
        </div>

        {/* 복사 성공 플로팅 토스트 (1.5초 후 자동 소멸) */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 rounded-xl bg-slate-900/95 text-white px-3.5 py-2 text-xs font-normal shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xs">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
