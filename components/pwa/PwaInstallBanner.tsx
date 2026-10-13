"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Smartphone, X, Share2, PlusSquare, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PwaInstallBannerProps {
  bizId?: string;
  bizName?: string;
  bizType?: "APT" | "STORE" | "CORP" | "BIZ" | "CREATOR";
  referrerId?: string;
  onInstalled?: (data: { deviceId: string; referrerId?: string; bizId: string }) => void;
}

export default function PwaInstallBanner({
  bizId = "apt-sanggye14",
  bizName = "상계주공 14단지",
  bizType = "APT",
  referrerId = "",
  onInstalled,
}: PwaInstallBannerProps) {
  const normalizedType =
    bizType === "APT" ? "APT" : bizType === "CREATOR" ? "CREATOR" : "BIZ";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // 1.5초 딜레이 및 플랫폼 감지 & 동적 매니페스트 바인딩
  useEffect(() => {
    // 이미 독립 실행형(PWA)으로 진입한 경우 노출 안 함
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 24시간 닫기 확인
    try {
      const dismissedUntil = localStorage.getItem(`today_pwa_dismissed_${bizId}`);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {}

    // 동적 매니페스트 링크 주입 (현재 비즈홈 상호명 & 아이콘 자동 바인딩)
    try {
      const manifestUrl = `/api/pwa/manifest?bizId=${encodeURIComponent(bizId)}&ref=${encodeURIComponent(referrerId)}&name=${encodeURIComponent(bizName)}&type=${normalizedType}`;
      let linkEl = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.rel = "manifest";
        document.head.appendChild(linkEl);
      }
      linkEl.href = manifestUrl;
    } catch (e) {
      console.warn("Failed to inject dynamic manifest link", e);
    }

    // iOS Safari 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      userAgent.includes("safari") &&
      !userAgent.includes("chrome") &&
      !userAgent.includes("crios");
    setIsIos(isIosDevice && isSafari);

    // Android/Chrome beforeinstallprompt 가로채기
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 설치 완료(appinstalled) 이벤트 바인딩
    const handleAppInstalled = () => {
      setIsVisible(false);
      setIsInstalled(true);
      try {
        let deviceId = localStorage.getItem("today_device_id");
        if (!deviceId) {
          deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("today_device_id", deviceId);
        }
        // 공통 설치 플래그 및 단지별 플래그 동시 기록
        localStorage.setItem("today_pwa_installed", "true");
        localStorage.setItem(`today_pwa_installed_${bizId}`, "true");

        // 백엔드/콜백 바인딩
        if (onInstalled) {
          onInstalled({ deviceId, referrerId, bizId });
        }

        // 서버 알림 비동기 전송
        fetch("/api/pwa-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_target: "TODAY_MAIN",
            app_name: `${bizName} 공식 앱`,
            start_url: `/biz/${bizId}?installed=pwa`,
            device_id: deviceId,
            referrer_id: referrerId,
            updated_at: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch (err) {
        console.warn("PWA install tracking failed:", err);
      }
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 모바일 진입 1.5초 후 배너 부드러운 슬라이드 업 노출
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [bizId, bizName, referrerId, normalizedType, onInstalled]);

  // 원클릭 설치 트리거 (Android/Chrome) 또는 iOS 3초 시각 가이드 모달 오픈
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    } else {
      setShowIosGuide(true);
    }
  };

  const handleDismissToday = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(
        `today_pwa_dismissed_${bizId}`,
        String(Date.now() + 24 * 60 * 60 * 1000)
      );
    } catch {}
  };

  if (!isVisible || isInstalled) return null;

  const iconUrl = `/api/pwa/icon/${encodeURIComponent(bizId)}?name=${encodeURIComponent(bizName)}&type=${normalizedType}&size=192`;

  return (
    <>
      {/* 하단 고정 1-Tap 설치 플로팅 배너 (부드러운 슬라이드 업) */}
      <aside
        aria-label="홈 화면 1-Tap 앱 설치"
        className="fixed bottom-18 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-45 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl p-3.5 text-slate-900 transition-all">
          <div className="flex items-center justify-between gap-3">
            {/* 앱 아이콘 썸네일 & 텍스트 */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-900 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconUrl}
                  alt={bizName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate leading-snug">
                  📱 스마트폰 홈 화면에 전용 앱으로 추가하고
                </p>
                <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                  원클릭으로 이용하세요
                </p>
              </div>
            </div>

            {/* [1초 추가] 액션 버튼 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>1초 추가</span>
              </button>

              <button
                type="button"
                onClick={handleDismissToday}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="오늘 하루 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* iOS Safari 시각적 3초 오버레이 가이드 모달 */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-100 p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-medium text-slate-900">
                  {bizName} 홈 화면 추가 방법
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              아이폰 Safari에서 <strong>하단 공유 버튼(⎋) 클릭 ➔ [홈 화면에 추가] 선택</strong>으로 3초 만에 설치할 수 있습니다:
            </p>

            <div className="space-y-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-[10px]">
                  1
                </div>
                <div className="text-[12px] text-slate-700">
                  하단 공유 버튼(<Share2 className="inline h-3.5 w-3.5 text-blue-600 mx-0.5" /> <strong>⎋</strong>)을 탭합니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-[10px]">
                  2
                </div>
                <div className="text-[12px] text-slate-700">
                  메뉴에서 <PlusSquare className="inline h-3.5 w-3.5 text-slate-800 mx-0.5" /> <strong>[홈 화면에 추가]</strong>를 누릅니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-medium text-[10px]">
                  3
                </div>
                <div className="text-[12px] text-slate-700">
                  우측 상단 <strong>[추가]</strong>를 누르면 홈 화면에 전용 앱이 생성됩니다!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </>
  );
}
