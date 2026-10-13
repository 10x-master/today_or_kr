"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import type { AppPwaTarget } from "@/types/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallBanner({
  target = "TODAY_MAIN",
  appName = "Today",
}: {
  target?: AppPwaTarget;
  appName?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 이미 독립형 PWA로 실행 중인지 확인
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) return;

    // iOS 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS 기기에서는 배너 표시
    if (isIosDevice) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      <aside aria-label="앱 설치 안내" className="mx-4 mt-2.5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-3 text-white shadow-md sm:mx-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {appName} 앱으로 더 빠르고 편리하게!
              </p>
              <p className="text-[11px] text-indigo-100">
                홈 화면에 추가하여 앱처럼 실시간 팩트 알림을 받아보세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>앱 설치</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS 홈 화면 추가 안내 모달 */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl text-center"
          >
            <Smartphone className="mx-auto h-8 w-8 text-indigo-600" />
            <h4 className="mt-3 text-sm font-bold text-slate-900">
              iPhone에서 {appName} 홈 화면에 추가하기
            </h4>
            <div className="mt-3 space-y-2 text-left text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <p>1. 사파리 하단의 <strong>공유 버튼(⬆)</strong>을 누릅니다.</p>
              <p>2. 스크롤하여 <strong>&apos;홈 화면에 추가&apos;</strong>를 선택합니다.</p>
              <p>3. 상단 <strong>&apos;추가&apos;</strong>를 누르면 앱 아이콘이 생성됩니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
