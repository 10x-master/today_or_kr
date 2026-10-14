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
  ShieldCheck,
  FileCheck,
  Lock,
  Unlock,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type { MfadGeoTarget, MfadCategory, MfadVisitStatus, MfadUserRole } from "@/types/mfad";
import { maskTargetName } from "@/types/mfad";
import MfadPrintReport from "./MfadPrintReport";
import MfadOfficialDocument from "./MfadOfficialDocument";

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
  const [hoveredTarget, setHoveredTarget] = useState<MfadGeoTarget | null>(null);

  // 1. 권한 격리 상태 (최고 관리자 vs 로컬 Today 서포터즈)
  const [userRole, setUserRole] = useState<MfadUserRole>("HQ_ADMIN");
  const [supporterDistrict, setSupporterDistrict] = useState<string>("분당구");
  const [unmaskPermission, setUnmaskPermission] = useState<boolean>(false);

  // 2. 공문(Official Document) 모달 제어 상태
  const [isOfficialDocOpen, setIsOfficialDocOpen] = useState<boolean>(false);

  // 3. 필터 상태
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

  // 4. 지도 인터랙티브 팬(Pan) & 줌(Zoom) 상태
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 5. 피드백 및 카카오 지도 상태
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

  // 자치구(District) 목록 추출
  const districts = useMemo(() => {
    const set = new Set<string>();
    targets.forEach((t) => {
      if (t.district) set.add(t.district);
    });
    return Array.from(set);
  }, [targets]);

  // 서포터즈 모드 시 관할 구역 자동 연동
  useEffect(() => {
    if (userRole === "LOCAL_SUPPORTER") {
      setSelectedDistrict(supporterDistrict);
    }
  }, [userRole, supporterDistrict]);

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
        const matchesMasked = (item.masked_name || "").toLowerCase().includes(query);
        const matchesAddress = item.road_address.toLowerCase().includes(query);
        const matchesDong = item.dong.toLowerCase().includes(query);
        if (!matchesName && !matchesMasked && !matchesAddress && !matchesDong) return false;
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
      const isRestricted = userRole === "LOCAL_SUPPORTER" && tgt.district !== supporterDistrict;
      const displayStoreName = isRestricted
        ? "🔒 관할 외 구역"
        : tgt.masked_name || maskTargetName(tgt.target_name);

      // 커스텀 오버레이 DOM
      const overlayContent = document.createElement("div");
      overlayContent.className = "cursor-pointer transform transition-transform hover:scale-110";
      overlayContent.innerHTML = `
        <div style="background-color: ${isRestricted ? "#64748B" : config.hex};" class="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg border-2 ${
        isSelected ? "border-white ring-4 ring-slate-900" : isRestricted ? "border-dashed border-slate-300 opacity-60" : "border-white/80"
      }">
          <span>${config.icon}</span>
          <span class="truncate max-w-[90px]">${displayStoreName}</span>
          <span style="background: rgba(0,0,0,0.25);" class="px-1 py-0.2 rounded text-[10px] font-mono">₩${(
            tgt.metadata.estimated_refund / 10000
          ).toFixed(0)}만</span>
        </div>
      `;

      overlayContent.onclick = () => {
        handleSelectTarget(tgt);
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
  }, [useKakaoMap, kakaoSdkLoaded, filteredTargets, selectedTarget, userRole, supporterDistrict]);

  // 타깃 클릭 & 권한 격리 검증
  const handleSelectTarget = (target: MfadGeoTarget) => {
    if (userRole === "LOCAL_SUPPORTER" && target.district !== supporterDistrict) {
      showToast(
        `🔒 [열람 제한] '${target.district}'은 타 지역본부 관할 구역입니다 (내 관할: ${supporterDistrict}).`
      );
      return;
    }
    setSelectedTarget(target);
  };

  // 1) [📄 M-FAD 사전 실사 브리핑 리포트 출력]
  const handlePrintReport = (target: MfadGeoTarget) => {
    setSelectedTarget(target);
    showToast(`📄 [${target.masked_name || target.target_name}] A4 1장 브리핑 리포트 출력을 준비합니다...`);
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
              visit_notes: "현장 방문 접수 완료 (M-FAD 실사 브리핑 및 공문 전달)",
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
            visit_notes: "현장 방문 접수 완료 (M-FAD 실사 브리핑 및 공문 전달)",
          }
        : prev
    );

    showToast(`✅ [${target.masked_name || target.target_name}] 서포터즈 방문 접수 및 실사 상태가 등록되었습니다!`);
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

  // 4) 지도 팬(Pan) & 줌(Zoom) 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 핀이나 버튼 클릭 시 팬 드래그 차단
    if ((e.target as HTMLElement).closest(".radar-pin-node, button, select, input")) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    setZoom((prev) => Math.min(2.5, Math.max(0.65, prev + zoomDelta)));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, +(prev + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.65, +(prev - 0.2).toFixed(1)));
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedTarget(null);
  };

  // Tactical Grid Bounds 계산
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

  // 실명 상호 표시 여부 판단 (본사 승인/실사 완료 또는 최고관리자 명시 언마스킹)
  const canShowFullName = (target: MfadGeoTarget): boolean => {
    if (userRole === "HQ_ADMIN" && unmaskPermission) return true;
    if (target.visit_status === "VISITED") return true;
    return false;
  };

  return (
    <div className={`relative w-full h-[calc(100vh-3.5rem)] flex flex-col font-sans overflow-hidden bg-white text-slate-900 ${className}`}>
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

      {/* 인쇄용 단일 A4 리포트 컴포넌트 (@media print 시 자동 노출, 공문 모달 미활성화 시에만 연동) */}
      {!isOfficialDocOpen && <MfadPrintReport target={selectedTarget} />}

      {/* 정규 점검 [공문(Official Letter)] 모달 */}
      <MfadOfficialDocument
        target={selectedTarget}
        isOpen={isOfficialDocOpen}
        onClose={() => setIsOfficialDocOpen(false)}
        showFullName={selectedTarget ? canShowFullName(selectedTarget) || userRole === "HQ_ADMIN" : true}
      />

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
      <div className="absolute top-4 left-4 right-4 z-30 max-w-6xl mx-auto pointer-events-none">
        <div className="rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200 p-3.5 sm:p-4 shadow-xl space-y-3 pointer-events-auto">
          {/* 1행: 메인 타이틀 및 2단계 권한 시뮬레이션 스위치 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-xs">
                🛰️
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    가맹점 수수료 누수 레이더 <span className="text-slate-500 font-normal text-xs sm:text-sm">(카드 수수료 초과분 환급 시스템)</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                    M-FAD Live GIS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  개인정보 보호 매장명 마스킹 별칭 적용 · 롤오버 누수 툴팁 · 권한별 관할 구역 격리
                </p>
              </div>
            </div>

            {/* 권한 모드 시뮬레이션 전환 스위치 (최고 관리자 vs 로컬 Today 서포터즈) */}
            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setUserRole("HQ_ADMIN");
                    showToast("🏢 [최고 관리자 모드] 전국 전역 가맹점 데이터 및 관할 지정 권한이 활성화되었습니다.");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    userRole === "HQ_ADMIN"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>최고 관리자 (HQ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserRole("LOCAL_SUPPORTER");
                    setSelectedDistrict(supporterDistrict);
                    showToast(`🏃 [로컬 서포터즈 모드] 배정 관할 구역 '${supporterDistrict}' 핀만 활성화되었습니다.`);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    userRole === "LOCAL_SUPPORTER"
                      ? "bg-white text-blue-900 shadow-xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>로컬 서포터즈</span>
                </button>
              </div>

              {/* 실시간 카운터 뱃지 */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <Compass className="h-4 w-4 text-blue-600 animate-spin-slow shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-500">관내 타깃: </span>
                  <span className="font-bold text-slate-900">{stats.count}개</span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  <span className="text-slate-500">예상 환급: </span>
                  <span className="font-bold text-red-600 font-mono">{stats.amountText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2행: 컨트롤 바 (행정구역 선택, 서포터즈 관할, 4대 카테고리 필, 슬라이더) */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* 행정구역 선택 (최고 관리자: 전체/자유선택 vs 로컬 서포터즈: 관할 구역 고정/선택) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-normal text-[11px] shrink-0">
                {userRole === "HQ_ADMIN" ? "행정구역 필터:" : "서포터즈 관할:"}
              </span>
              {userRole === "HQ_ADMIN" ? (
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="ALL">전국 전역 ({districts.join(", ")})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={supporterDistrict}
                  onChange={(e) => {
                    setSupporterDistrict(e.target.value);
                    setSelectedDistrict(e.target.value);
                    showToast(`📍 로컬 서포터즈 관할 구역이 '${e.target.value}'(으)로 변경되었습니다.`);
                  }}
                  className="rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-xs text-blue-900 font-bold focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      배정 구역: {d}
                    </option>
                  ))}
                </select>
              )}

              {/* 최고 관리자 전용 언마스킹 스위치 */}
              {userRole === "HQ_ADMIN" && (
                <button
                  type="button"
                  onClick={() => setUnmaskPermission(!unmaskPermission)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer ${
                    unmaskPermission
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                  title="본사 최고 관리자 정식 상호명 언마스킹 열람 권한 토글"
                >
                  {unmaskPermission ? <Unlock className="h-3 w-3 text-amber-600" /> : <Lock className="h-3 w-3 text-slate-400" />}
                  <span>{unmaskPermission ? "실명 상호 노출 ON" : "별칭 마스킹 중"}</span>
                </button>
              )}
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
                최소 환급:
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
                {(minRefundThreshold / 10000).toLocaleString()}만+
              </span>
            </div>

            {/* 레이더 모드 전환 */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsRadarSweepActive(!isRadarSweepActive)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium transition-colors cursor-pointer border ${
                  isRadarSweepActive
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
                title="레이더 스위프 애니메이션 토글"
              >
                <Crosshair className="h-3 w-3" />
                <span>스위프 {isRadarSweepActive ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          [2. 순백색 인터랙티브 동적 GIS 맵 (Pan/Zoom 지원)]
         ============================================================ */}
      <div className="relative w-full h-full pt-32 pb-4 px-4 flex">
        {/* 모드 A: 카카오 지도 SDK 활성화 시 */}
        {useKakaoMap ? (
          <div ref={kakaoMapContainerRef} className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white" />
        ) : (
          /* 모드 B: 카카오 SDK 대기 시 순백색 인터랙티브 팬/줌 캔버스 */
          <div
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`relative w-full h-full rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* 배경 순백색 격자 그리드 및 동심 조준원 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <defs>
                <pattern id="whiteRadarGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#whiteRadarGrid)" />
              {/* 중앙 조준원 */}
              <circle cx="50%" cy="50%" r="140" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="50%" cy="50%" r="280" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 6" />
              <circle cx="50%" cy="50%" r="420" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* 순백색 레이더 부드러운 스위프 빔 효과 */}
            {isRadarSweepActive && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden opacity-25"
                style={{
                  background:
                    "conic-gradient(from 0deg at 50% 50%, rgba(37, 99, 235, 0.25) 0deg, rgba(37, 99, 235, 0) 65deg, transparent 360deg)",
                  animation: "radarSweep 6s linear infinite",
                }}
              />
            )}

            {/* 좌측 상단 실시간 좌표 및 줌 레벨 오버레이 */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span className="font-mono text-slate-700 font-medium">
                INTERACTIVE RADAR: {selectedDistrict === "ALL" ? "수도권 전역" : selectedDistrict}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                [Zoom: {(zoom * 100).toFixed(0)}% | {filteredTargets.length}개 핀]
              </span>
            </div>

            {/* 타깃 핀 렌더링 컨테이너 (Pan & Zoom transform 동기화) */}
            <div
              className="absolute inset-16 z-20 transition-transform duration-75 origin-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              {filteredTargets.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const isSelected = selectedTarget?.id === item.id;
                const isHovered = hoveredTarget?.id === item.id;
                const isRestricted = userRole === "LOCAL_SUPPORTER" && item.district !== supporterDistrict;

                // 상호명 표시: 관할 외인 경우 마스킹/열람 제한, 승인 완료 시 실명 가능
                const displayStoreName = isRestricted
                  ? "타 지역 관할"
                  : canShowFullName(item)
                  ? item.target_name
                  : item.masked_name || maskTargetName(item.target_name);

                // 정규화된 캔버스 좌표 (0% ~ 100%)
                const latRange = gridBounds.maxLat - gridBounds.minLat || 1;
                const lngRange = gridBounds.maxLng - gridBounds.minLng || 1;

                const topPercent = Math.max(
                  8,
                  Math.min(92, (1 - (item.lat - gridBounds.minLat) / latRange) * 100)
                );
                const leftPercent = Math.max(
                  8,
                  Math.min(92, ((item.lng - gridBounds.minLng) / lngRange) * 100)
                );

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredTarget(item)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onClick={() => handleSelectTarget(item)}
                    style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                    className={`radar-pin-node absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform ${
                      isHovered ? "z-40 scale-110" : "z-20"
                    }`}
                  >
                    {/* 펄스 애니메이션 링 */}
                    {!isRestricted && (
                      <div
                        style={{ borderColor: config.hex }}
                        className={`absolute -inset-2 rounded-full border opacity-50 ${
                          isSelected ? "animate-ping scale-150" : isHovered ? "animate-ping" : ""
                        }`}
                      />
                    )}

                    {/* 메인 핀 노드 배지 */}
                    <div
                      style={{
                        backgroundColor: isRestricted ? "#94A3B8" : config.hex,
                      }}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white text-xs font-bold shadow-md border-2 transition-all ${
                        isRestricted
                          ? "opacity-40 grayscale border-dashed border-slate-300"
                          : isSelected
                          ? "scale-120 border-white ring-4 ring-slate-900 shadow-xl"
                          : "border-white hover:scale-105"
                      }`}
                    >
                      <span className="text-xs">{config.icon}</span>
                      <span className="hidden sm:inline-block max-w-[110px] truncate text-[11px] font-semibold">
                        {displayStoreName}
                      </span>
                      <span className="bg-black/25 px-1.5 py-0.2 rounded font-mono text-[10px] text-amber-200">
                        ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                      </span>
                    </div>

                    {/* ============================================================
                        [롤오버 누수 예측 코멘트 화이트 팝오버 툴팁]
                       ============================================================ */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 rounded-2xl bg-white text-slate-900 p-3.5 text-xs border border-slate-200 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        {/* 툴팁 상단: 카테고리 뱃지 & 상호명 */}
                        <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              style={{ backgroundColor: isRestricted ? "#64748B" : config.hex }}
                              className="px-1.5 py-0.5 rounded text-[10px] text-white font-bold shrink-0"
                            >
                              {config.icon} {config.label}
                            </span>
                            <span className="font-bold text-slate-900 truncate text-[11.5px]">
                              {displayStoreName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {item.dong}
                          </span>
                        </div>

                        {/* 관할 외 제한 경고 뱃지 */}
                        {isRestricted ? (
                          <div className="mt-2 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] leading-snug font-medium flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                            <span>해당 지역은 타 지역본부 관할 구역입니다 (열람 제한)</span>
                          </div>
                        ) : (
                          <>
                            {/* 초과 카드 수수료 예상 이유 상세 코멘트 */}
                            <div className="mt-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] leading-snug font-medium">
                              <div className="flex items-start gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{item.leakage_reason_comment || item.metadata.leakage_cause}</span>
                              </div>
                            </div>

                            {/* 예상 환급 금액 */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">예상 누수 환급액</span>
                              <span className="font-mono font-black text-red-600 text-[13px]">
                                ₩{item.metadata.estimated_refund.toLocaleString()}원
                              </span>
                            </div>
                          </>
                        )}

                        {/* 하단 화살표 */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 하단 우측 전술 지도 컨트롤러 (Pan/Zoom 버튼 & 리셋) */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs backdrop-blur-md shadow-md">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="확대 (Zoom In)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="축소 (Zoom Out)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleResetView}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="위치 및 줌 100% 원점 복귀"
              >
                <RotateCcw className="h-3 w-3" />
                <span>원점 복귀</span>
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
                <div className="flex items-center gap-1.5 flex-wrap">
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

                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-950 truncate">
                    {canShowFullName(selectedTarget)
                      ? selectedTarget.target_name
                      : selectedTarget.masked_name || maskTargetName(selectedTarget.target_name)}
                  </h3>
                  {!canShowFullName(selectedTarget) && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      보안 마스킹
                    </span>
                  )}
                </div>

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
                  {selectedTarget.leakage_reason_comment || selectedTarget.metadata.leakage_cause}
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
              [현장 정규 공문 및 실사 액션 바]
             ============================================================ */}
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            {/* 액션 1: 정식 점검 공문(Official Letter) 발송 및 인쇄 */}
            <button
              type="button"
              onClick={() => setIsOfficialDocOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileCheck className="h-4 w-4 text-white" />
              <span>📜 정식 점검 공문 발송 / A4 즉시 인쇄</span>
            </button>

            {/* 액션 2: M-FAD 사전 실사 브리핑 리포트 출력 */}
            <button
              type="button"
              onClick={() => handlePrintReport(selectedTarget)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span>📄 M-FAD 사전 실사 브리핑 리포트 출력</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* 액션 3: 서포터즈 방문 접수 */}
              <button
                type="button"
                onClick={() => handleAssignVisit(selectedTarget)}
                className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>서포터즈 방문 접수</span>
              </button>

              {/* 액션 4: t.sign 약정서 카톡 발송 */}
              <button
                type="button"
                onClick={() => handleDispatchTSign(selectedTarget)}
                className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                <span>t.sign 약정서 카톡</span>
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
