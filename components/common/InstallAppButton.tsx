"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Share,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import type { AppPwaTarget } from "@/types/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppButtonProps {
  appType: AppPwaTarget;
  className?: string;
  variant?: "primary" | "secondary" | "header" | "pill" | "icon";
}

export default function InstallAppButton({
  appType,
  className = "",
  variant = "header",
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ios" | "desktop">("desktop");
  const [copied, setCopied] = useState(false);

  const isMain = appType === "TODAY_MAIN";
  const appDisplayName = isMain ? "Today." : "t.note";
  const appFullTitle = isMain ? "Today." : "티노트 (t.note)";
  const startPath = isMain ? "/" : "/workspace";
  const iconPath = isMain ? "/icons/today-192.png?v=4" : "/icons/todaynote-192.png";

  useEffect(() => {
    // 환경 감지
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(ua);

    setIsIos(isIosDevice);
    setIsMobile(isMobileDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleClick = async () => {
    // 1. 네이티브 PWA 설치 프롬프트가 지원되는 브라우저 (Chrome/Android/Edge)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn("PWA install prompt error:", err);
      }
    }

    // 2. iOS(Safari) 모바일 환경인 경우
    if (isIos && isMobile) {
      setModalMode("ios");
      setModalOpen(true);
      return;
    }

    // 3. PC 데스크톱 환경이거나 기타 환경인 경우 -> QR코드 모바일 스캔 모달 오픈
    setModalMode("desktop");
    setModalOpen(true);
  };

  const getTargetUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${startPath}`;
    }
    return `https://today.or.kr${startPath}`;
  };

  const handleCopyLink = () => {
    const url = getTargetUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 버튼 스타일 클래스
  let baseClasses =
    "inline-flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer ";
  if (variant === "icon") {
    baseClasses +=
      "h-10 w-10 justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900";
  } else if (variant === "header") {
    baseClasses += isMain
      ? "rounded-full bg-indigo-600 px-3 py-1.5 text-xs text-white shadow-xs hover:bg-indigo-700 hover:shadow-sm"
      : "rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white shadow-xs hover:bg-slate-800 hover:shadow-sm";
  } else if (variant === "pill") {
    baseClasses +=
      "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-2xs hover:bg-slate-50";
  } else {
    baseClasses +=
      "rounded-xl bg-indigo-600 px-4 py-2.5 text-xs text-white shadow-sm hover:bg-indigo-700";
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(
    getTargetUrl()
  )}`;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClasses} ${className}`}
        title={`${appDisplayName} 앱 다운로드`}
        aria-label={`${appDisplayName} 모바일 앱 등록`}
      >
        {variant === "icon" ? (
          <Download className="h-5 w-5" />
        ) : (
          <>
            <span className="text-sm">📲</span>
            <span>{appDisplayName} 앱 등록</span>
          </>
        )}
      </button>

      {/* 안내 모달 (iOS 공유 가이드 or PC QR코드 스캔) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center"
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 앱 아이콘 & 뱃지 */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-md border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconPath}
                alt={appDisplayName}
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="mt-3.5 text-base font-bold text-slate-900 sm:text-lg">
              {appFullTitle} 홈 화면 바로가기
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              설치 파일 다운로드 없이 1초 만에 스마트폰 앱으로 등록됩니다.
            </p>

            {modalMode === "ios" ? (
              // iOS 사파리 가이드
              <div className="mt-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-left text-xs text-slate-700 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-[11px] text-white">
                    1
                  </span>
                  <p>
                    사파리 브라우저 하단의 <strong>공유 버튼(⎋ / [⬆])</strong>을
                    누릅니다.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-[11px] text-white">
                    2
                  </span>
                  <p>
                    메뉴를 내려 <strong>[홈 화면에 추가 ➕]</strong>를
                    선택합니다.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-[11px] text-white">
                    3
                  </span>
                  <p>
                    우측 상단 <strong>[추가]</strong>를 누르면 바탕화면에{" "}
                    <strong>{appDisplayName}</strong> 앱 아이콘이 생성됩니다!
                  </p>
                </div>
              </div>
            ) : (
              // 데스크톱 / PC 환경 QR코드 스캔
              <div className="mt-4 flex flex-col items-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl}
                    alt="PWA QR Code"
                    className="h-40 w-40 rounded-lg object-contain"
                  />
                </div>
                <p className="mt-2.5 text-xs font-semibold text-indigo-700">
                  스마트폰 카메라로 찍어 바로 설치하세요
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  https://today.or.kr 접속 후 홈 화면에 바로 추가할 수 있습니다.
                </p>

                <div className="mt-3.5 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">링크 복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>링크 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    확인 완료
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
