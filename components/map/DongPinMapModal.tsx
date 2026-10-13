"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  X,
  Compass,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ShieldCheck,
  Navigation,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import type { Region } from "@/types/local";
import {
  addDongPin,
  getUserDongPins,
  getMaxSlotsForScore,
  isSuperAdmin,
  warpToDong,
  NATIONWIDE_DONGS,
} from "@/lib/dong/pinManager";

interface DongPinMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthProfile | null;
  onPinAdded?: (dongName: string) => void;
}

export default function DongPinMapModal({
  isOpen,
  onClose,
  currentUser,
  onPinAdded,
}: DongPinMapModalProps) {
  // 지도 중심 좌표 (기본값: 상계동)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.6598,
    lng: 127.0774,
  });

  // 역지오코딩 감지된 행정동 정보
  const [detectedRegion, setDetectedRegion] = useState<Region>({
    sido: "서울특별시",
    gugun: "노원구",
    dong: "상계동",
    code: "1135010300",
    lat: 37.6598,
    lng: 127.0774,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const superAdmin = isSuperAdmin(currentUser);
  const userPins = getUserDongPins(currentUser?.id || "guest");
  const maxSlots = superAdmin ? 999 : getMaxSlotsForScore(currentUser?.activity_score || 0);

  // 1. 역지오코딩 API 호출 (드래그 멈춤 시 자동 실행)
  const fetchReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoadingGeocode(true);
    try {
      const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.region) {
          setDetectedRegion(json.region);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode fetch error:", err);
    } finally {
      setIsLoadingGeocode(false);
    }
  }, []);

  // 모달 오픈 시 초기 역지오코딩
  useEffect(() => {
    if (isOpen) {
      fetchReverseGeocode(center.lat, center.lng);
      setFeedback(null);
    }
  }, [isOpen, center.lat, center.lng, fetchReverseGeocode]);

  // 2. 드래그 멈춤 감지 및 지연 역지오코딩
  const handleDragEnd = () => {
    setIsDragging(false);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchReverseGeocode(center.lat, center.lng);
    }, 250);
  };

  // 마우스 / 터치 드래그 인터랙션
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    // 픽셀 이동을 위경도 델타로 스케일 변환
    setCenter((prev) => ({
      lat: Math.max(33.0, Math.min(38.5, prev.lat + dy * 0.00015)),
      lng: Math.max(126.0, Math.min(129.5, prev.lng - dx * 0.00015)),
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setCenter((prev) => ({
      lat: Math.max(33.0, Math.min(38.5, prev.lat + dy * 0.00015)),
      lng: Math.max(126.0, Math.min(129.5, prev.lng - dx * 0.00015)),
    }));
  };

  // 3. 핀 꽂기 등록 실행
  const handleConfirmPin = () => {
    if (!detectedRegion.dong) return;

    if (superAdmin) {
      const res = warpToDong(detectedRegion.dong, currentUser);
      setFeedback({ type: "success", msg: res.message });
      onPinAdded?.(detectedRegion.dong);
      setTimeout(() => {
        onClose();
      }, 900);
      return;
    }

    const res = addDongPin(detectedRegion.dong, currentUser);
    if (res.success) {
      setFeedback({ type: "success", msg: res.message });
      onPinAdded?.(detectedRegion.dong);
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setFeedback({ type: "error", msg: res.message });
    }
  };

  // 퀵 점프 프리셋 클릭
  const handleQuickJump = (item: (typeof NATIONWIDE_DONGS)[0]) => {
    setCenter({ lat: item.lat, lng: item.lng });
    setDetectedRegion({
      sido: item.sido,
      gugun: item.gugun,
      dong: item.dong,
      code: `${item.lat}`.slice(0, 10),
      lat: item.lat,
      lng: item.lng,
    });
    setFeedback(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                지도에서 동네 핀 꽂기
              </h2>
              <p className="text-[11px] text-slate-400">
                지도를 드래그하여 원하는 동·면에 핀을 꽂으세요
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 핀 슬롯 안내 배너 */}
        <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
            {superAdmin ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span className="font-bold text-indigo-700">👑 최고관리자: 전국 무제한 슬롯 워프 가능</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  내 핀 슬롯: <strong>{userPins.length}</strong> / {maxSlots}개
                </span>
              </>
            )}
          </div>
          {!superAdmin && (
            <span className="text-[10px] text-amber-700">
              활동 점수 100점당 +1슬롯 해금
            </span>
          )}
        </div>

        {/* 지도 뷰포트 (드래그 인터랙션 + 중앙 타겟 핀) */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          className="relative h-64 w-full bg-slate-100 cursor-grab active:cursor-grabbing overflow-hidden select-none"
          title="지도를 마우스 또는 터치로 드래그하세요"
        >
          {/* 지도 배경 그리드 및 랜드마크 시각화 */}
          <div
            className="absolute inset-0 opacity-40 transition-transform duration-75"
            style={{
              backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: `24px 24px, 48px 48px, 48px 48px`,
              backgroundPosition: `${center.lng * 100}px ${center.lat * 100}px`,
            }}
          />

          {/* 지도 내 가상 행정 구역 라벨 표시 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-30 select-none">
              <p className="text-3xl font-black text-slate-400 tracking-widest">
                {detectedRegion.dong}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1">
                {detectedRegion.sido} {detectedRegion.gugun}
              </p>
            </div>
          </div>

          {/* 정중앙 타겟 핀 (중앙 고정) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
            {/* 위치 감지 뱃지 툴팁 */}
            <div className="mb-1 rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-xs flex items-center gap-1.5 whitespace-nowrap animate-bounce duration-1000">
              <Compass className={`h-3 w-3 text-amber-400 ${isLoadingGeocode ? "animate-spin" : ""}`} />
              <span>
                {isDragging ? "지도 이동 중..." : detectedRegion.dong}
              </span>
            </div>

            {/* 메인 핀 아이콘 */}
            <div className="relative">
              <MapPin className="h-9 w-9 text-rose-600 fill-rose-500 drop-shadow-md" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 h-2 w-4 rounded-full bg-black/20 blur-xs" />
            </div>
          </div>

          {/* 좌하단 실시간 위경도 표시 */}
          <div className="absolute bottom-2 left-2 rounded-md bg-white/80 px-2 py-0.5 text-[9px] font-mono text-slate-500 backdrop-blur-xs shadow-2xs">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>

          {/* 우하단 드래그 안내 캡션 */}
          <div className="absolute bottom-2 right-2 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 backdrop-blur-xs shadow-2xs flex items-center gap-1">
            <Navigation className="h-2.5 w-2.5 text-amber-600 animate-pulse" />
            <span>화면을 밀어 핀 위치 조정</span>
          </div>
        </div>

        {/* 퀵 점프 칩 및 검색 */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">추천 주요 행정동·읍·면 바로가기</span>
            <span className="text-[10px] text-slate-400">탭하면 즉시 이동</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {NATIONWIDE_DONGS.slice(0, 7).map((item) => (
              <button
                key={item.dong}
                type="button"
                onClick={() => handleQuickJump(item)}
                className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  detectedRegion.dong === item.dong
                    ? "bg-amber-500 text-white shadow-2xs font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.dong}
              </button>
            ))}
          </div>
        </div>

        {/* 현재 감지된 행정동 주소 카드 & 액션 버튼 */}
        <div className="p-4 bg-slate-50 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                선택된 행정동
              </span>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">
                {detectedRegion.sido} {detectedRegion.gugun} {detectedRegion.dong}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                법정코드: {detectedRegion.code}
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-amber-600">
                {detectedRegion.dong}
              </span>
            </div>
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-1.5 rounded-xl p-2.5 text-xs font-bold animate-in fade-in ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* 최종 등록 버튼 */}
          <button
            type="button"
            onClick={handleConfirmPin}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MapPin className="h-4 w-4" />
            <span>[📍 {detectedRegion.dong} 핀 등록하기]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
