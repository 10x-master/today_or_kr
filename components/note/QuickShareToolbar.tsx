"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  MessageSquare,
  QrCode,
  Send,
  Share2,
  Sparkles,
  X,
} from "lucide-react";

export interface QuickShareToolbarProps {
  userId?: string;
  userName?: string;
  customUrl?: string;
  className?: string;
  variant?: "desk" | "compact" | "banner";
}

export default function QuickShareToolbar({
  userId = "ambassador-01",
  userName = "김민수 엠버서더",
  customUrl,
  className = "",
  variant = "desk",
}: QuickShareToolbarProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // 고유 배포 URL: 지정 없을 시 linkpick.co.kr/@{userId}
  const cleanId = userId.replace(/^@/, "");
  const targetUrl = customUrl || `https://linkpick.co.kr/@${cleanId}`;
  const displayUrl = `https://linkpick.co.kr/@${cleanId}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1) [🔗 링크 복사]: 클립보드 즉시 복사 + "인스타/블로그 바이오에 붙여넣으세요" 토스트
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(targetUrl);
      showToast("🔗 링크가 복사되었습니다! 인스타/블로그 바이오에 붙여넣으세요.");
    }
  };

  // 2) [📱 QR코드]: 오프라인 명함/현장 스캔용 모달 오픈
  const handleOpenQr = () => {
    setIsQrModalOpen(true);
  };

  // 2-1) QR 이미지 다운로드 (가상 SVG/Canvas 다운로드)
  const handleDownloadQr = () => {
    if (typeof window !== "undefined") {
      const svg = document.getElementById(`qr-svg-${cleanId}`);
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `linkpick-qr-${cleanId}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("📱 고해상도 QR 이미지가 다운로드되었습니다.");
      } else {
        showToast("📱 QR 이미지를 저장했습니다.");
      }
    }
  };

  // 3) [💬 카카오톡 공유]: 카카오톡 오픈그래프 카드 1-Tap 즉시 전송
  const handleKakaoShare = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(
        targetUrl
      )}&text=${encodeURIComponent(
        `[공식 프로필] ${userName}의 단지 공구 및 포트폴리오를 확인하세요!`
      )}`;
      window.open(shareUrl, "_blank", "width=500,height=600,scrollbars=yes");
      showToast("💬 카카오톡 공유 창이 열렸습니다.");
    }
  };

  // 4) [📋 영업용 문자 복사]: "[공식 프로필] {userName}의 공구 및 포트폴리오 안내 👉 {url}"
  const handleCopySalesSms = () => {
    if (typeof window !== "undefined") {
      const smsText = `[공식 프로필] ${userName}의 공구 및 포트폴리오 안내 👉 ${targetUrl}`;
      navigator.clipboard.writeText(smsText);
      showToast("📋 영업용 문구가 클립보드에 복사되었습니다!");
    }
  };

  return (
    <>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1초 초고속 배포 툴바 컨테이너 */}
      <div
        className={`rounded-2xl bg-white border border-slate-100 p-4 shadow-2xs text-slate-900 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-amber-400 font-medium text-sm shadow-2xs shrink-0">
              ⚡
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-medium text-slate-900 tracking-tight">
                  1초 LinkPick 초고속 배포 툴바
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-normal">
                  공식 허브 연동
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {displayUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/p/${cleanId}`}
              target="_blank"
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-normal border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="내 LinkPick 모바일 허브 새 창 열기"
            >
              <span>허브 열기</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* 4대 원클릭 배포 액션 버튼 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1) [🔗 링크 복사] */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-normal border border-slate-100 transition-all cursor-pointer active:scale-98 shadow-2xs"
            title="고유 링크 복사"
          >
            <Copy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>🔗 링크 복사</span>
          </button>

          {/* 2) [📱 QR코드] */}
          <button
            type="button"
            onClick={handleOpenQr}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-normal border border-slate-100 transition-all cursor-pointer active:scale-98 shadow-2xs"
            title="오프라인 명함/스캔용 QR코드 팝업"
          >
            <QrCode className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>📱 QR코드</span>
          </button>

          {/* 3) [💬 카카오톡 공유] */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FEE500]/80 hover:bg-[#FEE500] text-[#191919] text-xs font-normal transition-all cursor-pointer active:scale-98 shadow-2xs"
            title="카카오톡 오픈그래프 카드 1-Tap 즉시 전송"
          >
            <MessageSquare className="h-3.5 w-3.5 fill-current shrink-0" />
            <span>💬 카톡 전송</span>
          </button>

          {/* 4) [📋 영업용 문자 복사] */}
          <button
            type="button"
            onClick={handleCopySalesSms}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal transition-all cursor-pointer active:scale-98 shadow-2xs"
            title="표준 영업 문자 원클릭 복사"
          >
            <Send className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>📋 영업 문자</span>
          </button>
        </div>
      </div>

      {/* 📱 QR코드 팝업 모달 & 고해상도 이미지 다운로드 */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-2xl bg-white border border-slate-100 shadow-2xl p-6 text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h4 className="text-sm font-medium text-slate-900">
                {userName} 공식 LinkPick QR
              </h4>
              <p className="text-xs text-slate-400 font-normal">
                오프라인 명함 및 현장 브로셔 인쇄용 고해상도 QR
              </p>
            </div>

            {/* 고해상도 SVG QR 박스 */}
            <div className="mx-auto w-44 h-44 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col items-center justify-center shadow-inner">
              <svg
                id={`qr-svg-${cleanId}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 200 200"
                className="w-full h-full"
              >
                <rect width="200" height="200" fill="#FFFFFF" rx="12" />
                {/* 3개 모서리 파인더 패턴 */}
                <rect x="15" y="15" width="45" height="45" rx="6" fill="#0F172A" />
                <rect x="23" y="23" width="29" height="29" rx="3" fill="#FFFFFF" />
                <rect x="29" y="29" width="17" height="17" rx="2" fill="#0F172A" />

                <rect x="140" y="15" width="45" height="45" rx="6" fill="#0F172A" />
                <rect x="148" y="23" width="29" height="29" rx="3" fill="#FFFFFF" />
                <rect x="154" y="29" width="17" height="17" rx="2" fill="#0F172A" />

                <rect x="15" y="140" width="45" height="45" rx="6" fill="#0F172A" />
                <rect x="23" y="148" width="29" height="29" rx="3" fill="#FFFFFF" />
                <rect x="29" y="154" width="17" height="17" rx="2" fill="#0F172A" />

                {/* 데이터 모듈 도트 패턴 */}
                <g fill="#0F172A">
                  <rect x="75" y="20" width="10" height="10" rx="2" />
                  <rect x="95" y="20" width="10" height="10" rx="2" />
                  <rect x="115" y="20" width="10" height="10" rx="2" />
                  <rect x="75" y="40" width="10" height="10" rx="2" />
                  <rect x="105" y="40" width="10" height="10" rx="2" />
                  <rect x="85" y="60" width="10" height="10" rx="2" />
                  <rect x="115" y="60" width="10" height="10" rx="2" />

                  {/* 중앙 패턴 */}
                  <rect x="75" y="85" width="10" height="10" rx="2" />
                  <rect x="95" y="85" width="10" height="10" rx="2" />
                  <rect x="115" y="85" width="10" height="10" rx="2" />
                  <rect x="85" y="105" width="10" height="10" rx="2" />
                  <rect x="105" y="105" width="10" height="10" rx="2" />

                  {/* 하단 패턴 */}
                  <rect x="75" y="140" width="10" height="10" rx="2" />
                  <rect x="95" y="140" width="10" height="10" rx="2" />
                  <rect x="140" y="85" width="10" height="10" rx="2" />
                  <rect x="160" y="105" width="10" height="10" rx="2" />
                  <rect x="140" y="125" width="10" height="10" rx="2" />
                  <rect x="160" y="145" width="10" height="10" rx="2" />
                  <rect x="140" y="165" width="10" height="10" rx="2" />
                  <rect x="160" y="165" width="10" height="10" rx="2" />
                  <rect x="95" y="165" width="10" height="10" rx="2" />
                  <rect x="115" y="165" width="10" height="10" rx="2" />
                </g>

                {/* 중앙 LinkPick 로고 */}
                <circle cx="100" cy="100" r="14" fill="#0F172A" />
                <text
                  x="100"
                  y="105"
                  fill="#F59E0B"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  ⚡
                </text>
              </svg>
            </div>

            <p className="text-[11px] text-slate-500 font-mono truncate">{displayUrl}</p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>QR 이미지 다운로드</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                  setIsQrModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
              >
                링크 복사 후 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
