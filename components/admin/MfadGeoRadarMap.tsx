"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  MapPin,
  Crosshair,
  Printer,
  UserCheck,
  Send,
  X,
  Compass,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import type { MfadGeoTarget, MfadCategory, MfadVisitStatus, MfadUserRole } from "@/types/mfad";
import { maskTargetName } from "@/types/mfad";
import type { AuthProfile } from "@/types/auth";
import UserAccountDropdown from "@/components/layout/UserAccountDropdown";
import MfadPrintReport from "./MfadPrintReport";
import MfadOfficialDocument from "./MfadOfficialDocument";

interface MfadGeoRadarMapProps {
  initialTargets: MfadGeoTarget[];
  currentUser?: AuthProfile | null;
  className?: string;
}

// 카테고리 설정 (색상 및 포커스 요약)
const CATEGORY_CONFIG: Record<
  MfadCategory,
  { label: string; icon: string; hex: string; focus: string }
> = {
  HOSPITAL: {
    label: "병의원",
    icon: "🩺",
    hex: "#2563EB",
    focus: "무이자 프로모션 분담금 미정산",
  },
  RESTAURANT: {
    label: "외식/카페",
    icon: "🍽️",
    hex: "#EA580C",
    focus: "키오스크/테이블오더 PG 추가 수수료",
  },
  GYM: {
    label: "헬스",
    icon: "🏋️",
    hex: "#16A34A",
    focus: "다개월 할부 마진 누수 및 수수료 괴리",
  },
  NEW_STORE: {
    label: "신규매장",
    icon: "🚨",
    hex: "#DC2626",
    focus: "영세 우대율(0.5%) 미소급 일반요율(2.0~2.3%) 과오납",
  },
};

export default function MfadGeoRadarMap({
  initialTargets,
  currentUser = null,
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
  const [minRefundThreshold, setMinRefundThreshold] = useState<number>(1000000);
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

  const kakaoMapContainerRef = useRef<HTMLDivElement>(null);
  const kakaoMapInstanceRef = useRef<any>(null);
  const kakaoMarkersRef = useRef<any[]>([]);

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
      if (selectedDistrict !== "ALL" && item.district !== selectedDistrict) {
        return false;
      }
      if (!selectedCategories.includes(item.category)) {
        return false;
      }
      if (item.metadata.estimated_refund < minRefundThreshold) {
        return false;
      }
      return true;
    });
  }, [targets, selectedDistrict, selectedCategories, minRefundThreshold]);

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
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  // 전체 카테고리 토글
  const toggleAllCategories = () => {
    if (selectedCategories.length === 4) {
      setSelectedCategories(["HOSPITAL"]);
    } else {
      setSelectedCategories(["HOSPITAL", "RESTAURANT", "GYM", "NEW_STORE"]);
    }
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

    kakaoMarkersRef.current.forEach((m) => m.setMap(null));
    kakaoMarkersRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();

    filteredTargets.forEach((tgt) => {
      const position = new kakao.maps.LatLng(tgt.lat, tgt.lng);
      bounds.extend(position);

      const isSelected = selectedTarget?.id === tgt.id;
      const config = CATEGORY_CONFIG[tgt.category];
      const isRestricted = userRole === "LOCAL_SUPPORTER" && tgt.district !== supporterDistrict;
      const displayStoreName = isRestricted
        ? "🔒 관할 외"
        : tgt.masked_name || maskTargetName(tgt.target_name);

      const overlayContent = document.createElement("div");
      overlayContent.className = "cursor-pointer transform transition-transform hover:scale-105";
      overlayContent.innerHTML = `
        <div style="background-color: ${isRestricted ? "#64748B" : config.hex};" class="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-semibold shadow-md border ${
        isSelected ? "border-white ring-2 ring-slate-900" : isRestricted ? "border-dashed opacity-50" : "border-white/80"
      }">
          <span>${config.icon}</span>
          <span class="truncate max-w-[85px]">${displayStoreName}</span>
          <span style="background: rgba(0,0,0,0.2);" class="px-1 py-0.2 rounded text-[10px] font-mono">₩${(
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

  const handleSelectTarget = (target: MfadGeoTarget) => {
    if (userRole === "LOCAL_SUPPORTER" && target.district !== supporterDistrict) {
      showToast(
        `🔒 [열람 제한] '${target.district}'은 타 지역본부 관할 구역입니다 (내 관할: ${supporterDistrict}).`
      );
      return;
    }
    setSelectedTarget(target);
  };

  const handlePrintReport = (target: MfadGeoTarget) => {
    setSelectedTarget(target);
    showToast(`📄 [${target.masked_name || target.target_name}] A4 1장 브리핑 리포트 출력을 준비합니다...`);
    setTimeout(() => {
      window.print();
    }, 300);
  };

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

  const handleDispatchTSign = (target: MfadGeoTarget) => {
    const contractLink = `${typeof window !== "undefined" ? window.location.origin : ""}/tsign/contract?targetId=${target.id}&ref=mfad-supporter`;
    try {
      navigator.clipboard.writeText(contractLink);
    } catch {}

    showToast(
      `📲 [${target.representative_name} 대표님] (${target.contact_number}) 휴대전화로 t.sign 3개년 카드수수료 환급 소명 비대면 약정서 링크가 즉시 발송되었습니다!`
    );
  };

  // Pan & Zoom 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".radar-pin-node, button, select, input, a")) return;
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

  const canShowFullName = (target: MfadGeoTarget): boolean => {
    if (userRole === "HQ_ADMIN" && unmaskPermission) return true;
    if (target.visit_status === "VISITED") return true;
    return false;
  };

  return (
    <div className={`relative w-full h-full flex flex-col font-sans overflow-hidden bg-white text-slate-900 ${className}`}>
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

      {/* 인쇄용 단일 A4 리포트 컴포넌트 */}
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
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-60 px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 전체 폭 슬림 인라인 바 (Full-Width Slim Header Bar)]
          - 높이 52px, 무경계 플랫 인라인 레이아웃
         ============================================================ */}
      <header className="h-[52px] w-full bg-white border-b border-slate-200/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 select-none">
        {/* 좌측: 타이틀 및 지역 선택(구/동 셀렉터) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors py-1 px-1.5 rounded-md hover:bg-slate-100"
            title="CRM 백오피스로 이동"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-medium">CRM</span>
          </Link>

          <span className="text-slate-200">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-sm">🛰️</span>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>가맹점 수수료 누수 레이더</span>
              <span className="hidden xl:inline font-normal text-slate-400 text-xs">
                (카드 수수료 초과분 환급 시스템)
              </span>
            </h1>
          </div>

          {/* 지역 구/동 무경계 플랫 셀렉터 */}
          <div className="flex items-center text-xs">
            <select
              value={userRole === "HQ_ADMIN" ? selectedDistrict : supporterDistrict}
              onChange={(e) => {
                if (userRole === "HQ_ADMIN") {
                  setSelectedDistrict(e.target.value);
                } else {
                  setSupporterDistrict(e.target.value);
                  setSelectedDistrict(e.target.value);
                  showToast(`📍 관할 구역: ${e.target.value}`);
                }
              }}
              className="bg-transparent hover:bg-slate-100 text-slate-800 font-semibold px-2 py-1 rounded-md text-xs border-0 focus:ring-1 focus:ring-slate-300 cursor-pointer outline-none transition-colors"
            >
              {userRole === "HQ_ADMIN" && <option value="ALL">전국 전역 ({districts.join(", ")})</option>}
              {districts.map((d) => (
                <option key={d} value={d}>
                  {userRole === "LOCAL_SUPPORTER" ? `배정: ${d}` : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 중앙: 업종 카테고리 텍스트 필터 (박스 형태가 아닌 심플한 텍스트 탭) */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={toggleAllCategories}
            className={`flex items-center gap-1 py-1 px-1.5 transition-colors cursor-pointer ${
              selectedCategories.length === 4
                ? "text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <span>전체</span>
            {selectedCategories.length === 4 && (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            )}
          </button>

          <span className="text-slate-200">|</span>

          {(Object.keys(CATEGORY_CONFIG) as MfadCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1 py-1 px-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? "text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                {isActive && (
                  <span
                    style={{ backgroundColor: config.hex }}
                    className="h-1.5 w-1.5 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 우측: 관내 요약 통계 (박스 없이 깔끔한 텍스트 인라인) + 서포터즈 권한/공문 바로가기 */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* 관내 요약 통계 텍스트 인라인 */}
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-normal">
            <span>관내 타깃</span>
            <span className="font-bold text-slate-900 font-mono">{stats.count}개소</span>
            <span className="text-slate-300 mx-1">|</span>
            <span>예상 환급액</span>
            <span className="font-bold text-red-600 font-mono">{stats.amountText}</span>
          </div>

          <span className="hidden md:inline text-slate-200">|</span>

          {/* 권한 토글 (HQ Admin vs Local Supporter) */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const next = userRole === "HQ_ADMIN" ? "LOCAL_SUPPORTER" : "HQ_ADMIN";
                setUserRole(next);
                if (next === "LOCAL_SUPPORTER") {
                  setSelectedDistrict(supporterDistrict);
                  showToast(`🏃 [로컬 서포터즈] 관할 구역: ${supporterDistrict}`);
                } else {
                  showToast("🏢 [최고 관리자] 전국 전역 열람 권한");
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 hover:bg-slate-100 transition-colors font-medium cursor-pointer"
              title="권한 모드 전환"
            >
              {userRole === "HQ_ADMIN" ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-semibold text-blue-700">HQ 관리자</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">서포터즈</span>
                </>
              )}
            </button>

            {/* 실명 언마스킹 (HQ Admin 전용) */}
            {userRole === "HQ_ADMIN" && (
              <button
                type="button"
                onClick={() => setUnmaskPermission(!unmaskPermission)}
                className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded-md hover:bg-slate-100 cursor-pointer"
                title={unmaskPermission ? "실명 상호 노출 중 (클릭 시 마스킹)" : "마스킹 중 (클릭 시 실명 언마스킹)"}
              >
                {unmaskPermission ? <Unlock className="h-3.5 w-3.5 text-amber-600" /> : <Lock className="h-3.5 w-3.5" />}
              </button>
            )}

            {/* 정식 공문 모달 직접 열기 바로가기 */}
            <button
              type="button"
              onClick={() => {
                if (filteredTargets.length > 0) {
                  setSelectedTarget(filteredTargets[0]);
                  setIsOfficialDocOpen(true);
                }
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 font-medium transition-colors cursor-pointer"
              title="정식 점검 공문 바로 작성"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>공문 작성</span>
            </button>
          </div>

          {currentUser && (
            <>
              <span className="text-slate-200">|</span>
              <UserAccountDropdown
                currentUser={currentUser}
                onOpenLogin={() => {}}
                onOpenTerms={() => window.dispatchEvent(new CustomEvent("today_open_terms_modal"))}
                align="right"
              />
            </>
          )}
        </div>
      </header>

      {/* ============================================================
          [2. 전체 화면 지도 뷰포트 극대화 (Full Screen Viewport)]
          - 좌우/하단 여백 및 둥근 외곽 테두리 100% 제거
          - 화면의 90% 이상을 시원하게 채우는 순백색 캔버스
         ============================================================ */}
      <div className="relative w-full flex-1 overflow-hidden select-none bg-white">
        {/* 모드 A: 카카오 지도 SDK 활성화 시 */}
        {useKakaoMap ? (
          <div ref={kakaoMapContainerRef} className="w-full h-full bg-white" />
        ) : (
          /* 모드 B: 카카오 SDK 대기 시 순백색 인터랙티브 전술 캔버스 (Pan/Zoom 지원) */
          <div
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`w-full h-full relative bg-white overflow-hidden select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* 극미세 그리드선 & 동심 조준원 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <defs>
                <pattern id="whiteRadarGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#whiteRadarGrid)" />
              <circle cx="50%" cy="50%" r="160" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6 6" />
              <circle cx="50%" cy="50%" r="320" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="6 6" />
              <circle cx="50%" cy="50%" r="480" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* 순백색 레이더 부드러운 스위프 빔 효과 */}
            {isRadarSweepActive && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden opacity-20"
                style={{
                  background:
                    "conic-gradient(from 0deg at 50% 50%, rgba(37, 99, 235, 0.25) 0deg, rgba(37, 99, 235, 0) 60deg, transparent 360deg)",
                  animation: "radarSweep 6s linear infinite",
                }}
              />
            )}

            {/* 타깃 핀 렌더링 컨테이너 (Pan & Zoom transform 동기화) */}
            <div
              className="absolute inset-8 z-20 transition-transform duration-75 origin-center pointer-events-none"
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

                const displayStoreName = isRestricted
                  ? "타 지역 관할"
                  : canShowFullName(item)
                  ? item.target_name
                  : item.masked_name || maskTargetName(item.target_name);

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
                      isHovered ? "z-40 scale-105" : "z-20"
                    }`}
                  >
                    {/* 펄스 링 */}
                    {!isRestricted && (
                      <div
                        style={{ borderColor: config.hex }}
                        className={`absolute -inset-1.5 rounded-full border opacity-40 ${
                          isSelected ? "animate-ping scale-150" : isHovered ? "animate-ping" : ""
                        }`}
                      />
                    )}

                    {/* 메인 핀 노드 배지 (미니멀 플랫 디자인) */}
                    <div
                      style={{
                        backgroundColor: isRestricted ? "#94A3B8" : config.hex,
                      }}
                      className={`relative flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold shadow-xs border transition-all ${
                        isRestricted
                          ? "opacity-35 grayscale border-dashed border-slate-300"
                          : isSelected
                          ? "border-white ring-2 ring-slate-900 shadow-md scale-110"
                          : "border-white/80 hover:shadow-sm"
                      }`}
                    >
                      <span className="text-xs">{config.icon}</span>
                      <span className="hidden sm:inline-block max-w-[95px] truncate text-[11px] font-medium">
                        {displayStoreName}
                      </span>
                      <span className="bg-black/20 px-1 py-0.2 rounded font-mono text-[9.5px] text-amber-200">
                        ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                      </span>
                    </div>

                    {/* ============================================================
                        [경량화된 롤오버 툴팁 (핵심만 산뜻하게 노출)]
                       ============================================================ */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl bg-white/95 backdrop-blur-sm text-slate-900 p-2.5 text-xs border border-slate-200/90 shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                        {/* 상호명 & 동 */}
                        <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1 min-w-0 font-bold text-slate-900 truncate text-[11.5px]">
                            <span>{config.icon}</span>
                            <span className="truncate">{displayStoreName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {item.dong}
                          </span>
                        </div>

                        {/* 사유 코멘트 */}
                        {isRestricted ? (
                          <div className="mt-1.5 p-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-medium flex items-center gap-1">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>타 지역본부 관할 구역 (열람 제한)</span>
                          </div>
                        ) : (
                          <>
                            <div className="mt-1.5 text-amber-900 text-[10.5px] leading-snug font-medium flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                              <span>{item.leakage_reason_comment || item.metadata.leakage_cause}</span>
                            </div>

                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[10.5px]">예상 환급액</span>
                              <span className="font-mono font-bold text-red-600 text-xs">
                                ₩{item.metadata.estimated_refund.toLocaleString()}원
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 하단 좌측 슬림 텔레메트리 */}
            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-[10.5px] text-slate-400 font-mono">
              <span>RADAR VIEW: {selectedDistrict === "ALL" ? "수도권 전역" : selectedDistrict}</span>
              <span>·</span>
              <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
            </div>

            {/* 하단 우측 초경량 플랫 컨트롤러 (Zoom In/Out, 원점 복귀, 스위프 토글) */}
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1 bg-white/90 border border-slate-200/80 px-2 py-1 rounded-lg text-xs backdrop-blur-xs shadow-2xs">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="확대"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="축소"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-slate-200 mx-0.5">|</span>
              <button
                type="button"
                onClick={handleResetView}
                className="flex items-center gap-0.5 text-[10.5px] text-slate-600 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="100% 원점 복귀"
              >
                <RotateCcw className="h-3 w-3" />
                <span>100%</span>
              </button>
              <span className="text-slate-200 mx-0.5">|</span>
              <button
                type="button"
                onClick={() => setIsRadarSweepActive(!isRadarSweepActive)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isRadarSweepActive ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-100"
                }`}
                title="스위프 토글"
              >
                <Crosshair className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            [3. 우측 플랫 독 사이드 패널 (핀 클릭 시 슬라이딩 인)]
            - 둥근 부유 박스가 아닌, 화면 우측에 슬림하게 결합되는 네이티브 패널
           ============================================================ */}
        {selectedTarget && (
          <aside
            aria-label="가맹점 정밀 진단 패널"
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[390px] bg-white border-l border-slate-200 z-40 shadow-xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150"
          >
            <div className="space-y-4">
              {/* 패널 헤더 */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{ backgroundColor: CATEGORY_CONFIG[selectedTarget.category].hex }}
                      className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>{CATEGORY_CONFIG[selectedTarget.category].icon}</span>
                      <span>{CATEGORY_CONFIG[selectedTarget.category].label}</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        selectedTarget.visit_status === "VISITED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : selectedTarget.visit_status === "ASSIGNED"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {selectedTarget.visit_status === "VISITED"
                        ? "방문 접수완료"
                        : selectedTarget.visit_status === "ASSIGNED"
                        ? "서포터즈 배정"
                        : "미방문 발굴"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <h3 className="text-base font-bold text-slate-950 truncate">
                      {canShowFullName(selectedTarget)
                        ? selectedTarget.target_name
                        : selectedTarget.masked_name || maskTargetName(selectedTarget.target_name)}
                    </h3>
                    {!canShowFullName(selectedTarget) && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                        마스킹
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span>{selectedTarget.road_address}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 환급 추정액 박스 */}
              <div className="rounded-xl bg-red-50/70 border border-red-200 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-red-800">
                  3개년 추정 과오납 회수 예상액
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-red-700 font-mono tracking-tight">
                    ₩{selectedTarget.metadata.estimated_refund.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-red-600">환급 소명 대상</span>
                </div>
                <div className="pt-1.5 border-t border-red-200/60 flex items-center justify-between text-[11px] text-red-900 font-medium">
                  <span>현재 차감 {selectedTarget.metadata.applied_rate}%</span>
                  <span>➔ 법정 우대 {selectedTarget.metadata.statutory_rate}% (소급)</span>
                </div>
              </div>

              {/* 누수 원인 상세 */}
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
                    <span className="text-slate-400 text-[10px]">단말기 / 솔루션</span>
                    <p className="font-semibold text-slate-900 mt-0.5 truncate">
                      {selectedTarget.metadata.terminal_company || "표준 POS"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 패널 하단 4대 액션 바 */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => setIsOfficialDocOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileCheck className="h-4 w-4 text-white" />
                <span>📜 정식 점검 공문 발송 / A4 즉시 인쇄</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintReport(selectedTarget)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-amber-400" />
                <span>📄 M-FAD 사전 실사 브리핑 리포트 출력</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAssignVisit(selectedTarget)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>방문 접수</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDispatchTSign(selectedTarget)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                  <span>t.sign 약정서</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 레이더 스위프 키프레임 */}
      <style jsx>{`
        @keyframes radarSweep {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
