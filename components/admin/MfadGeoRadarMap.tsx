"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Script from "next/script";
import {
  MapPin,
  Crosshair,
  Layers,
  Filter,
  Printer,
  UserCheck,
  Send,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  X,
  Compass,
  SlidersHorizontal,
  RefreshCw,
  Search,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { MfadGeoTarget, MfadCategory, MfadVisitStatus } from "@/types/mfad";
import MfadPrintReport from "./MfadPrintReport";

interface MfadGeoRadarMapProps {
  initialTargets: MfadGeoTarget[];
  className?: string;
}

// 카테고리 설정 (색상 및 포커스 요약)
const CATEGORY_CONFIG: Record<
  MfadCategory,
  { label: string; icon: string; hex: string; bgClass: string; textClass: string; borderClass: string; focus: string }
> = {
  HOSPITAL: {
    label: "병원·의원",
    icon: "🩺",
    hex: "#2563EB",
    bgClass: "bg-blue-500",
    textClass: "text-blue-700",
    borderClass: "border-blue-300",
    focus: "무이자 프로모션 분담금 미정산",
  },
  RESTAURANT: {
    label: "식당·카페",
    icon: "🍽️",
    hex: "#EA580C",
    bgClass: "bg-orange-500",
    textClass: "text-orange-700",
    borderClass: "border-orange-300",
    focus: "키오스크/테이블오더 PG 추가 수수료",
  },
  GYM: {
    label: "헬스·웰니스",
    icon: "🏋️",
    hex: "#16A34A",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-300",
    focus: "다개월 할부 마진 누수 및 수수료 괴리",
  },
  NEW_STORE: {
    label: "신규매장 (<6개월)",
    icon: "🚨",
    hex: "#DC2626",
    bgClass: "bg-red-600",
    textClass: "text-red-700",
    borderClass: "border-red-300",
    focus: "영세 우대율(0.5%) 미소급 일반요율(2.0~2.3%) 과오납",
  },
};

export default function MfadGeoRadarMap({
  initialTargets,
  className = "",
}: MfadGeoRadarMapProps) {
  const [targets, setTargets] = useState<MfadGeoTarget[]>(initialTargets);
  const [selectedTarget, setSelectedTarget] = useState<MfadGeoTarget | null>(null);

  // 1. 필터 상태
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedCategories, setSelectedCategories] = useState<MfadCategory[]>([
    "HOSPITAL",
    "RESTAURANT",
    "GYM",
    "NEW_STORE",
  ]);
  const [minRefundThreshold, setMinRefundThreshold] = useState<number>(1000000); // 최소 100만 원
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRadarSweepActive, setIsRadarSweepActive] = useState<boolean>(true);

  // 2. 피드백 및 모달 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kakaoSdkLoaded, setKakaoSdkLoaded] = useState<boolean>(false);
  const [useKakaoMap, setUseKakaoMap] = useState<boolean>(false);

  // Kakao Map 컨테이너 ref
  const kakaoMapContainerRef = useRef<HTMLDivElement>(null);
  const kakaoMapInstanceRef = useRef<any>(null);
  const kakaoMarkersRef = useRef<any[]>([]);

  // 토스트 헬퍼
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 구(District) 목록 추출
  const districts = useMemo(() => {
    const set = new Set<string>();
    targets.forEach((t) => {
      if (t.district) set.add(t.district);
    });
    return Array.from(set);
  }, [targets]);

  // 필터링된 타깃 목록
  const filteredTargets = useMemo(() => {
    return targets.filter((item) => {
      // 1) 구/동 필터
      if (selectedDistrict !== "ALL" && item.district !== selectedDistrict) {
        return false;
      }
      // 2) 카테고리 필터
      if (!selectedCategories.includes(item.category)) {
        return false;
      }
      // 3) 환급액 임계치 필터
      if (item.metadata.estimated_refund < minRefundThreshold) {
        return false;
      }
      // 4) 검색어 필터
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.target_name.toLowerCase().includes(query);
        const matchesAddress = item.road_address.toLowerCase().includes(query);
        const matchesDong = item.dong.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesDong) return false;
      }
      return true;
    });
  }, [targets, selectedDistrict, selectedCategories, minRefundThreshold, searchTerm]);

  // 관내 타깃 통계 집계
  const stats = useMemo(() => {
    const count = filteredTargets.length;
    const totalAmount = filteredTargets.reduce((acc, t) => acc + t.metadata.estimated_refund, 0);

    const billions = Math.floor(totalAmount / 100000000);
    const millions = Math.floor((totalAmount % 100000000) / 10000000);
    const remainderMillions = Math.floor((totalAmount % 10000000) / 10000);

    let amountText = "";
    if (billions > 0) {
      amountText += `${billions}억 `;
    }
    if (millions > 0 || billions > 0) {
      amountText += `${millions * 1000 + remainderMillions}만 원`;
    } else {
      amountText += `${(totalAmount / 10000).toFixed(0)}만 원`;
    }

    return { count, totalAmount, amountText };
  }, [filteredTargets]);

  // 카테고리 필터 토글
  const toggleCategory = (cat: MfadCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // 최소 1개 유지
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  // Kakao Maps SDK 초기화 시도
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (typeof window === "undefined" || !kakaoAppKey) return;
    const kakao = (window as any).kakao;
    if (kakao && kakao.maps) {
      kakao.maps.load(() => {
        setKakaoSdkLoaded(true);
        setUseKakaoMap(true);
      });
    }
  }, [kakaoAppKey]);

  // Kakao Map 렌더링 & 마커 동기화
  useEffect(() => {
    if (!useKakaoMap || !kakaoSdkLoaded || !kakaoMapContainerRef.current) return;
    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps) return;

    if (!kakaoMapInstanceRef.current) {
      const centerCoords = new kakao.maps.LatLng(37.498, 127.03);
      const options = { center: centerCoords, level: 6 };
      kakaoMapInstanceRef.current = new kakao.maps.Map(kakaoMapContainerRef.current, options);
    }

    const map = kakaoMapInstanceRef.current;

    // 기존 마커 제거
    kakaoMarkersRef.current.forEach((m) => m.setMap(null));
    kakaoMarkersRef.current = [];

    // 신규 마커 및 오버레이 생성
    const bounds = new kakao.maps.LatLngBounds();

    filteredTargets.forEach((tgt) => {
      const position = new kakao.maps.LatLng(tgt.lat, tgt.lng);
      bounds.extend(position);

      const isSelected = selectedTarget?.id === tgt.id;
      const config = CATEGORY_CONFIG[tgt.category];

      // 커스텀 오버레이 DOM
      const overlayContent = document.createElement("div");
      overlayContent.className = "cursor-pointer transform transition-transform hover:scale-110";
      overlayContent.innerHTML = `
        <div style="background-color: ${config.hex};" class="flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-bold shadow-lg border-2 ${
        isSelected ? "border-white ring-4 ring-slate-900" : "border-white/80"
      }">
          <span>${config.icon}</span>
          <span class="truncate max-w-[90px]">${tgt.target_name}</span>
          <span style="background: rgba(0,0,0,0.25);" class="px-1 py-0.2 rounded text-[10px] font-mono">₩${(
            tgt.metadata.estimated_refund / 10000
          ).toFixed(0)}만</span>
        </div>
      `;

      overlayContent.onclick = () => {
        setSelectedTarget(tgt);
        map.panTo(position);
      };

      const customOverlay = new kakao.maps.CustomOverlay({
        position,
        content: overlayContent,
        yAnchor: 1.2,
      });

      customOverlay.setMap(map);
      kakaoMarkersRef.current.push(customOverlay);
    });

    if (filteredTargets.length > 0) {
      map.setBounds(bounds);
    }
  }, [useKakaoMap, kakaoSdkLoaded, filteredTargets, selectedTarget]);

  // 타깃 클릭 및 센터링
  const handleSelectTarget = (target: MfadGeoTarget) => {
    setSelectedTarget(target);
    if (useKakaoMap && kakaoMapInstanceRef.current) {
      const kakao = (window as any).kakao;
      const position = new kakao.maps.LatLng(target.lat, target.lng);
      kakaoMapInstanceRef.current.panTo(position);
    }
  };

  // 1) [📄 M-FAD 사전 실사 브리핑 리포트 출력]
  const handlePrintReport = (target: MfadGeoTarget) => {
    setSelectedTarget(target);
    showToast(`📄 [${target.target_name}] A4 1장 브리핑 리포트 출력을 준비합니다...`);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // 2) [서포터즈 방문 접수]
  const handleAssignVisit = (target: MfadGeoTarget) => {
    const updatedStatus: MfadVisitStatus = "VISITED";
    const nowTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

    setTargets((prev) =>
      prev.map((t) =>
        t.id === target.id
          ? {
              ...t,
              visit_status: updatedStatus,
              last_visited_at: `오늘 ${nowTime}`,
              visit_notes: "현장 방문 접수 완료 (M-FAD 실사 브리핑 예정)",
            }
          : t
      )
    );

    setSelectedTarget((prev) =>
      prev && prev.id === target.id
        ? {
            ...prev,
            visit_status: updatedStatus,
            last_visited_at: `오늘 ${nowTime}`,
            visit_notes: "현장 방문 접수 완료 (M-FAD 실사 브리핑 예정)",
          }
        : prev
    );

    showToast(`✅ [${target.target_name}] 서포터즈 방문 접수 및 실사 상태가 등록되었습니다!`);
  };

  // 3) [t.sign 약정서 카톡 발송]
  const handleDispatchTSign = (target: MfadGeoTarget) => {
    const contractLink = `${typeof window !== "undefined" ? window.location.origin : ""}/tsign/contract?targetId=${target.id}&ref=mfad-supporter`;

    try {
      navigator.clipboard.writeText(contractLink);
    } catch {}

    showToast(
      `📲 [${target.representative_name} 대표님] (${target.contact_number}) 휴대전화로 t.sign 3개년 카드수수료 환급 소명 비대면 약정서 링크가 즉시 발송되었습니다!`
    );
  };

  // Fallback GIS Tactical Grid Bounds Calculation
  const gridBounds = useMemo(() => {
    if (filteredTargets.length === 0) {
      return { minLat: 37.35, maxLat: 37.66, minLng: 127.01, maxLng: 127.12 };
    }
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    filteredTargets.forEach((t) => {
      if (t.lat < minLat) minLat = t.lat;
      if (t.lat > maxLat) maxLat = t.lat;
      if (t.lng < minLng) minLng = t.lng;
      if (t.lng > maxLng) maxLng = t.lng;
    });

    const latPadding = Math.max((maxLat - minLat) * 0.15, 0.02);
    const lngPadding = Math.max((maxLng - minLng) * 0.15, 0.02);

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
    };
  }, [filteredTargets]);

  return (
    <div className={`relative w-full h-[calc(100vh-4rem)] flex flex-col font-sans overflow-hidden bg-slate-950 text-slate-100 ${className}`}>
      {/* 카카오 SDK 로더 (키가 있을 때만 활성화) */}
      {kakaoAppKey && (
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services,clusterer`}
          onLoad={() => {
            const kakao = (window as any).kakao;
            if (kakao && kakao.maps) {
              kakao.maps.load(() => {
                setKakaoSdkLoaded(true);
                setUseKakaoMap(true);
              });
            }
          }}
        />
      )}

      {/* 인쇄용 단일 A4 리포트 컴포넌트 (@media print 시 자동 노출) */}
      <MfadPrintReport target={selectedTarget} />

      {/* 상단 알림 토스트 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 탑 필터 바 (NEWNEEK / Notion Minimalist Card)]
         ============================================================ */}
      <div className="absolute top-4 left-4 right-4 z-30 max-w-6xl mx-auto">
        <div className="rounded-2xl bg-white text-slate-900 border border-slate-200 p-3.5 sm:p-4 shadow-xl space-y-3">
          {/* 1행: 타이틀 및 구/동 필터 & 실시간 카운터 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-xs">
                🛰️
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    M-FAD Geo-Radar <span className="text-slate-400 font-normal">가맹점 수수료 누수 레이더</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                    Live GIS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  관내 4대 업종 카드 수수료 법정 요율 괴리 및 과오납 3개년 환급 타깃 실사 데스크
                </p>
              </div>
            </div>

            {/* 실시간 카운터 뱃지 */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start lg:self-auto">
              <Compass className="h-4 w-4 text-blue-600 animate-spin-slow shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500">관내 발굴 타깃: </span>
                <span className="font-bold text-slate-900">{stats.count}개</span> 매장
                <span className="mx-1.5 text-slate-300">|</span>
                <span className="text-slate-500">예상 환급 총액: </span>
                <span className="font-bold text-red-600 font-mono">{stats.amountText}</span>
              </div>
            </div>
          </div>

          {/* 2행: 컨트롤 바 (지역 셀렉트, 카테고리 필터 필, 임계치 슬라이더) */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* 지역 구 선택 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-normal text-[11px] shrink-0">행정구역:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">전체 자치구 ({districts.join(", ")})</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 4대 카테고리 멀티 셀렉트 필 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.keys(CATEGORY_CONFIG) as MfadCategory[]).map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isActive = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11.5px] font-medium transition-all cursor-pointer border ${
                      isActive
                        ? "bg-white text-slate-900 border-slate-300 shadow-2xs"
                        : "bg-slate-50 text-slate-400 border-slate-200/70 hover:text-slate-600"
                    }`}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                    <span
                      style={{ backgroundColor: config.hex }}
                      className="h-2 w-2 rounded-full inline-block ml-0.5"
                    />
                  </button>
                );
              })}
            </div>

            {/* 환급액 임계치 슬라이더 */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[10.5px] text-slate-500 whitespace-nowrap">
                최소 환급액:
              </span>
              <input
                type="range"
                min={1000000}
                max={8000000}
                step={500000}
                value={minRefundThreshold}
                onChange={(e) => setMinRefundThreshold(Number(e.target.value))}
                className="w-20 sm:w-28 accent-slate-900 cursor-pointer h-1 bg-slate-200 rounded-lg"
              />
              <span className="font-mono font-bold text-slate-900 text-[11px] whitespace-nowrap">
                {(minRefundThreshold / 10000).toLocaleString()}만원+
              </span>
            </div>

            {/* 레이더 모드 전환 & 새로고침 */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsRadarSweepActive(!isRadarSweepActive)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium transition-colors cursor-pointer border ${
                  isRadarSweepActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
                title="전술 레이더 스위프 애니메이션 토글"
              >
                <Crosshair className="h-3 w-3" />
                <span>스위프 {isRadarSweepActive ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          [2. GIS 인터랙티브 맵 뷰포트]
         ============================================================ */}
      <div className="relative w-full h-full pt-32 pb-4 px-4 flex">
        {/* 모드 A: 카카오 지도 SDK 활성화 시 */}
        {useKakaoMap ? (
          <div ref={kakaoMapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800" />
        ) : (
          /* 모드 B: 카카오 SDK 미설정/대기 시 초정밀 인터랙티브 전술 레이더 캔버스 */
          <div className="relative w-full h-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center select-none">
            {/* 배경 전술 그리드선 & 동심원 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <defs>
                <pattern id="radarGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#38BDF8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#radarGrid)" />
              {/* 중앙 조준원 */}
              <circle cx="50%" cy="50%" r="120" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="50%" cy="50%" r="240" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="50%" cy="50%" r="360" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* 레이더 스위프 빔 효과 */}
            {isRadarSweepActive && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden opacity-30"
                style={{
                  background:
                    "conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.4) 0deg, rgba(56, 189, 248, 0) 60deg, transparent 360deg)",
                  animation: "radarSweep 5s linear infinite",
                }}
              />
            )}

            {/* 지도 내 좌표 오버레이 안내 */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-slate-300">
                TACTICAL RADAR VIEW: {selectedDistrict === "ALL" ? "수도권 전역" : selectedDistrict}
              </span>
              <span className="text-[10px] text-slate-500">
                ({filteredTargets.length}개 핀 활성화)
              </span>
            </div>

            {/* 타깃 핀 인터랙티브 렌더링 */}
            <div className="absolute inset-16 z-20">
              {filteredTargets.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const isSelected = selectedTarget?.id === item.id;

                // 정규화된 캔버스 좌표 (0% ~ 100%)
                const latRange = gridBounds.maxLat - gridBounds.minLat || 1;
                const lngRange = gridBounds.maxLng - gridBounds.minLng || 1;

                const topPercent = Math.max(
                  5,
                  Math.min(95, (1 - (item.lat - gridBounds.minLat) / latRange) * 100)
                );
                const leftPercent = Math.max(
                  5,
                  Math.min(95, ((item.lng - gridBounds.minLng) / lngRange) * 100)
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTarget(item)}
                    style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all"
                  >
                    {/* 펄스 애니메이션 링 */}
                    <div
                      style={{ borderColor: config.hex }}
                      className={`absolute -inset-2 rounded-full border opacity-75 ${
                        isSelected ? "animate-ping scale-150" : "group-hover:animate-ping"
                      }`}
                    />

                    {/* 메인 핀 노드 */}
                    <div
                      style={{ backgroundColor: config.hex }}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white text-xs font-bold shadow-xl border-2 transition-all ${
                        isSelected
                          ? "scale-125 border-white ring-4 ring-slate-400"
                          : "border-slate-900 group-hover:scale-110"
                      }`}
                    >
                      <span className="text-xs">{config.icon}</span>
                      <span className="hidden sm:inline-block max-w-[100px] truncate text-[11px]">
                        {item.target_name}
                      </span>
                      <span className="bg-black/30 px-1.5 py-0.2 rounded font-mono text-[10px] text-amber-300">
                        ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                      </span>
                    </div>

                    {/* 호버 시 툴팁 미리보기 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-40 w-48 rounded-xl bg-slate-900 text-white p-2 text-[10.5px] border border-slate-700 shadow-2xl pointer-events-none">
                      <p className="font-bold truncate text-slate-100">{item.target_name}</p>
                      <p className="text-slate-400 text-[10px] truncate">{item.road_address}</p>
                      <p className="font-semibold text-red-400 mt-1">
                        예상 환급: ₩{item.metadata.estimated_refund.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 우측 전술 지도 컨트롤러 */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
              <span className="text-[11px] text-slate-400 font-mono">
                CENTER: {gridBounds.minLat.toFixed(3)}, {gridBounds.minLng.toFixed(3)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="text-[10.5px] text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 cursor-pointer"
              >
                뷰 리셋
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          [3. 사이드 드로어 & 현장 액션 (핀 클릭 시 슬라이딩 패널)]
         ============================================================ */}
      {selectedTarget && (
        <aside
          aria-label="가맹점 정밀 진단 및 현장 액션 패널"
          className="absolute top-24 bottom-6 right-6 z-40 w-full sm:w-[420px] max-w-[calc(100vw-3rem)] rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-200"
        >
          {/* 드로어 헤더 */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: CATEGORY_CONFIG[selectedTarget.category].hex }}
                    className="px-2 py-0.5 rounded-full text-white text-[10.5px] font-bold flex items-center gap-1"
                  >
                    <span>{CATEGORY_CONFIG[selectedTarget.category].icon}</span>
                    <span>{CATEGORY_CONFIG[selectedTarget.category].label}</span>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      selectedTarget.visit_status === "VISITED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : selectedTarget.visit_status === "ASSIGNED"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {selectedTarget.visit_status === "VISITED"
                      ? "방문 접수완료"
                      : selectedTarget.visit_status === "ASSIGNED"
                      ? "서포터즈 배정"
                      : "미방문 발굴"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-950 truncate">
                  {selectedTarget.target_name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{selectedTarget.road_address}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 핵심 환급 추정액 하이라이트 박스 */}
            <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-red-800">
                3개년 추정 과오납 회수 예상액
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-red-700 font-mono tracking-tight">
                  ₩{selectedTarget.metadata.estimated_refund.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-red-600">환급 소명 대상</span>
              </div>
              <div className="pt-1.5 border-t border-red-200/80 flex items-center justify-between text-[11px] text-red-900 font-medium">
                <span>현재 차감 {selectedTarget.metadata.applied_rate}%</span>
                <span>➔ 법정 우대 {selectedTarget.metadata.statutory_rate}% (소급)</span>
              </div>
            </div>

            {/* 주요 누수 원인 & 상세 진단 내용 */}
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>주요 누수 원인</span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    ({selectedTarget.metadata.primary_leak_code})
                  </span>
                </span>
                <p className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] font-medium leading-snug">
                  {selectedTarget.metadata.leakage_cause}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800">
                  현장 실사 진단 상세:
                </span>
                <p className="text-[11.5px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {selectedTarget.metadata.leakage_detail}
                </p>
              </div>

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px]">대표자 성명</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedTarget.representative_name} 대표
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px]">전화번호</span>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {selectedTarget.contact_number}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px]">월평균 카드매출</span>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {(selectedTarget.metadata.monthly_card_sales || 35000000).toLocaleString()}원
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px]">단말기 / 결제솔루션</span>
                  <p className="font-semibold text-slate-900 mt-0.5 truncate">
                    {selectedTarget.metadata.terminal_company || "표준 POS"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              [현장 3대 퀵 액션 버튼 바]
             ============================================================ */}
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            {/* 액션 1: M-FAD 사전 실사 브리핑 리포트 출력 */}
            <button
              type="button"
              onClick={() => handlePrintReport(selectedTarget)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>📄 M-FAD 사전 실사 브리핑 리포트 출력</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* 액션 2: 서포터즈 방문 접수 */}
              <button
                type="button"
                onClick={() => handleAssignVisit(selectedTarget)}
                className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>서포터즈 방문 접수</span>
              </button>

              {/* 액션 3: t.sign 약정서 카톡 발송 */}
              <button
                type="button"
                onClick={() => handleDispatchTSign(selectedTarget)}
                className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                <span>t.sign 약정서 카톡 발송</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 레이더 애니메이션 키프레임 스타일 */}
      <style jsx>{`
        @keyframes radarSweep {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
