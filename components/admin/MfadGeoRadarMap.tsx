"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import * as XLSX from "xlsx";
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
  Download,
  Upload,
  Search,
  Building,
  CheckCircle2,
  Phone,
  Edit2,
  Check,
  Plus,
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

// 4대 카테고리 설정 (미니멀 차분한 라벨)
const CATEGORY_CONFIG: Record<
  MfadCategory,
  { label: string; icon: string; hex: string; focus: string }
> = {
  HOSPITAL: {
    label: "병의원",
    icon: "🩺",
    hex: "#334155",
    focus: "무이자 프로모션 분담금 미정산",
  },
  RESTAURANT: {
    label: "외식/카페",
    icon: "🍽️",
    hex: "#475569",
    focus: "키오스크/테이블오더 PG 추가 수수료",
  },
  GYM: {
    label: "헬스",
    icon: "🏋️",
    hex: "#334155",
    focus: "다개월 할부 마진 누수 및 수수료 괴리",
  },
  NEW_STORE: {
    label: "신규매장",
    icon: "🚨",
    hex: "#475569",
    focus: "영세 우대율(0.5%) 미소급 일반요율 과오납",
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

  // 인라인 전화번호 편집 상태
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneInputValue, setPhoneInputValue] = useState<string>("");

  // 1. 권한 격리 상태 (최고 관리자 vs 로컬 Today 서포터즈)
  const [userRole, setUserRole] = useState<MfadUserRole>("HQ_ADMIN");
  const [supporterDistrict, setSupporterDistrict] = useState<string>("분당구");
  const [unmaskPermission, setUnmaskPermission] = useState<boolean>(false);

  // 2. 공문(Official Document) 모달 제어 상태
  const [isOfficialDocOpen, setIsOfficialDocOpen] = useState<boolean>(false);

  // 3. 필터 상태 (행정구 & 행정동 2단계 필터)
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedDong, setSelectedDong] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  // 5. 엑셀 파일 인풋 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 6. 피드백 및 카카오 지도 상태
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

  // 선택된 구에 따른 행정동(Dong) 목록 추출
  const dongs = useMemo(() => {
    const set = new Set<string>();
    targets.forEach((t) => {
      if (selectedDistrict === "ALL" || t.district === selectedDistrict) {
        if (t.dong) set.add(t.dong);
      }
    });
    return Array.from(set);
  }, [targets, selectedDistrict]);

  // 구 변경 시 유효하지 않은 동 리셋
  useEffect(() => {
    if (selectedDong !== "ALL" && !dongs.includes(selectedDong)) {
      setSelectedDong("ALL");
    }
  }, [selectedDistrict, dongs, selectedDong]);

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
      if (selectedDong !== "ALL" && item.dong !== selectedDong) {
        return false;
      }
      if (!selectedCategories.includes(item.category)) {
        return false;
      }
      if (item.metadata.estimated_refund < minRefundThreshold) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.target_name.toLowerCase().includes(q);
        const matchesMasked = (item.masked_name || "").toLowerCase().includes(q);
        const matchesDong = item.dong.toLowerCase().includes(q);
        const matchesRoad = item.road_address.toLowerCase().includes(q);
        const matchesPhone = item.contact_number.toLowerCase().includes(q);
        if (!matchesName && !matchesMasked && !matchesDong && !matchesRoad && !matchesPhone) return false;
      }
      return true;
    });
  }, [targets, selectedDistrict, selectedDong, selectedCategories, minRefundThreshold, searchTerm]);

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

  const toggleAllCategories = () => {
    if (selectedCategories.length === 4) {
      setSelectedCategories(["HOSPITAL"]);
    } else {
      setSelectedCategories(["HOSPITAL", "RESTAURANT", "GYM", "NEW_STORE"]);
    }
  };

  // 인라인 전화번호 편집 시작
  const handleStartEditPhone = (e: React.MouseEvent, target: MfadGeoTarget) => {
    e.stopPropagation();
    setEditingPhoneId(target.id);
    setPhoneInputValue(target.contact_number || "");
  };

  // 인라인 전화번호 저장
  const handleSavePhone = (targetId: string) => {
    const trimmed = phoneInputValue.trim();
    setTargets((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, contact_number: trimmed } : t))
    );
    if (selectedTarget && selectedTarget.id === targetId) {
      setSelectedTarget((prev) => (prev ? { ...prev, contact_number: trimmed } : null));
    }
    setEditingPhoneId(null);
    showToast("📞 전화번호가 성공적으로 업데이트되었습니다.");
  };

  // Kakao Maps SDK 초기화
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

  // Kakao Map 마커 동기화
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
        ? "관할 외"
        : tgt.masked_name || maskTargetName(tgt.target_name);

      const overlayContent = document.createElement("div");
      overlayContent.className = "cursor-pointer transform transition-transform hover:scale-105";
      overlayContent.innerHTML = `
        <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-normal shadow-xs border ${
        isSelected ? "bg-slate-950 border-white ring-2 ring-slate-900" : isRestricted ? "bg-slate-400 border-dashed opacity-50" : "bg-slate-800 border-white/80"
      }">
          <span>${config.icon}</span>
          <span class="truncate max-w-[85px]">${displayStoreName}</span>
          <span class="bg-black/20 px-1 py-0.2 rounded text-[9.5px] font-mono text-slate-200">₩${(
            tgt.metadata.estimated_refund / 10000
          ).toFixed(0)}만</span>
        </div>
      `;

      overlayContent.onclick = () => {
        handleSelectAndCenterTarget(tgt);
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

  // 타깃 선택 및 지도 중심 이동 (Center & Pan)
  const handleSelectAndCenterTarget = (target: MfadGeoTarget) => {
    if (userRole === "LOCAL_SUPPORTER" && target.district !== supporterDistrict) {
      showToast(
        `🔒 [열람 제한] '${target.district}'은 타 지역본부 관할 구역입니다 (내 관할: ${supporterDistrict}).`
      );
      return;
    }
    setSelectedTarget(target);

    if (useKakaoMap && kakaoMapInstanceRef.current) {
      const kakao = (window as any).kakao;
      kakaoMapInstanceRef.current.panTo(new kakao.maps.LatLng(target.lat, target.lng));
    } else {
      const latRange = gridBounds.maxLat - gridBounds.minLat || 1;
      const lngRange = gridBounds.maxLng - gridBounds.minLng || 1;
      const topPercent = 1 - (target.lat - gridBounds.minLat) / latRange;
      const leftPercent = (target.lng - gridBounds.minLng) / lngRange;

      if (mapContainerRef.current) {
        const { clientWidth, clientHeight } = mapContainerRef.current;
        const targetOffsetX = (0.5 - leftPercent) * clientWidth * zoom;
        const targetOffsetY = (0.5 - topPercent) * clientHeight * zoom;
        setPan({ x: targetOffsetX, y: targetOffsetY });
      }
    }
  };

  // ============================================================
  // [📥 엑셀 다운로드 (.xlsx 바이너리 직접 생성 - SheetJS)]
  // ============================================================
  const handleDownloadExcel = () => {
    if (filteredTargets.length === 0) {
      showToast("⚠️ 다운로드할 가맹점 내역이 없습니다.");
      return;
    }

    const excelData = filteredTargets.map((item) => {
      const categoryLabel = CATEGORY_CONFIG[item.category]?.label || item.category;
      const maskedName = item.masked_name || maskTargetName(item.target_name);
      const fullName = userRole === "HQ_ADMIN" ? item.target_name : maskedName;
      const statusText =
        item.visit_status === "VISITED"
          ? "누수 확정 (방문접수)"
          : item.visit_status === "ASSIGNED"
          ? "의심 탐지 (서포터즈 배정)"
          : "의심 탐지 (미방문 발굴)";

      return {
        "업종 카테고리": categoryLabel,
        "가맹점명 (별칭)": maskedName,
        "정식 상호명": fullName,
        "대표자명": item.representative_name,
        "연락처": item.contact_number || "",
        "관할 자치구": item.district,
        "행정동": item.dong,
        "도로명 주소": item.road_address,
        "월평균 카드매출 (원)": item.metadata.monthly_card_sales || 0,
        "현재 적용 요율(%)": item.metadata.applied_rate,
        "정상 우대 요율(%)": item.metadata.statutory_rate,
        "추정 누수 금액 (원)": item.metadata.estimated_refund,
        "초과 사유 코드": item.metadata.primary_leak_code,
        "초과 수수료 발생 사유": item.leakage_reason_comment || item.metadata.leakage_cause,
        "점검 상태": statusText,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 14 }, // 업종 카테고리
      { wch: 20 }, // 가맹점명 (별칭)
      { wch: 22 }, // 정식 상호명
      { wch: 12 }, // 대표자명
      { wch: 16 }, // 연락처
      { wch: 12 }, // 관할 자치구
      { wch: 10 }, // 행정동
      { wch: 36 }, // 도로명 주소
      { wch: 18 }, // 월평균 카드매출
      { wch: 16 }, // 현재 적용 요율
      { wch: 16 }, // 정상 우대 요율
      { wch: 18 }, // 추정 누수 금액
      { wch: 15 }, // 초과 사유 코드
      { wch: 45 }, // 초과 수수료 발생 사유
      { wch: 22 }, // 점검 상태
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "가맹점_수수료_누수목록");

    const todayStr = new Date().toISOString().slice(0, 10);
    const districtName = selectedDistrict === "ALL" ? "전국" : selectedDistrict;
    const dongName = selectedDong === "ALL" ? "전체동" : selectedDong;
    const fileName = `t.note_Sales_가맹점목록_${districtName}_${dongName}_${todayStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    showToast(`📥 [${filteredTargets.length}개 가맹점] .xlsx 엑셀 다운로드가 완료되었습니다.`);
  };

  // ============================================================
  // [📤 엑셀 업로드 및 양방향 병합(Upsert) 엔진]
  // ============================================================
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rawRows || rawRows.length === 0) {
        showToast("⚠️ 업로드된 엑셀 파일에 데이터가 없습니다.");
        return;
      }

      let updatedCount = 0;

      setTargets((prev) => {
        const next = prev.map((target) => {
          // 일치하는 행 매칭 (정식상호명, 가맹점명(별칭), 도로명주소 기준 대조)
          const matchedRow = rawRows.find((row) => {
            const rowFullName = String(row["정식 상호명"] || row["정식상호명"] || row["상호명"] || "").trim();
            const rowMaskedName = String(row["가맹점명 (별칭)"] || row["가맹점명(마스킹)"] || row["가맹점명"] || "").trim();
            const rowAddress = String(row["도로명 주소"] || row["도로명주소"] || row["주소"] || "").trim();

            if (rowFullName && target.target_name.includes(rowFullName)) return true;
            if (rowMaskedName && (target.masked_name === rowMaskedName || target.target_name.includes(rowMaskedName.replace(/\*/g, "")))) return true;
            if (rowAddress && (target.road_address.includes(rowAddress) || rowAddress.includes(target.road_address))) return true;
            return false;
          });

          if (!matchedRow) return target;

          const newPhone = matchedRow["연락처"] || matchedRow["전화번호"] || matchedRow["핸드폰"];
          const newStatus = matchedRow["점검 상태"] || matchedRow["실사 상태"] || matchedRow["상태"];
          const newMemo = matchedRow["초과 수수료 발생 사유"] || matchedRow["메모"] || matchedRow["주요 누수 원인"];

          let hasChanged = false;
          let updatedPhone = target.contact_number;
          let updatedStatus = target.visit_status;
          let updatedMemo = target.leakage_reason_comment;

          if (newPhone && String(newPhone).trim() && String(newPhone).trim() !== target.contact_number) {
            updatedPhone = String(newPhone).trim();
            hasChanged = true;
          }

          if (newStatus) {
            const statusStr = String(newStatus);
            if ((statusStr.includes("확정") || statusStr.includes("완료")) && target.visit_status !== "VISITED") {
              updatedStatus = "VISITED";
              hasChanged = true;
            } else if (statusStr.includes("배정") && target.visit_status !== "ASSIGNED") {
              updatedStatus = "ASSIGNED";
              hasChanged = true;
            }
          }

          if (newMemo && String(newMemo).trim() && String(newMemo).trim() !== target.leakage_reason_comment) {
            updatedMemo = String(newMemo).trim();
            hasChanged = true;
          }

          if (hasChanged) {
            updatedCount++;
            return {
              ...target,
              contact_number: updatedPhone,
              visit_status: updatedStatus,
              leakage_reason_comment: updatedMemo,
            };
          }

          return target;
        });

        return next;
      });

      // selectedTarget 동기화
      if (selectedTarget) {
        setSelectedTarget((prev) => {
          if (!prev) return null;
          const updated = targets.find((t) => t.id === prev.id);
          return updated || prev;
        });
      }

      showToast(`총 ${updatedCount}건의 가맹점 정보가 성공적으로 업데이트되었습니다.`);
    } catch (err) {
      console.error(err);
      showToast("❌ 엑셀 파일을 읽는 중 오류가 발생했습니다. 올바른 .xlsx 파일인지 확인하세요.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

  // 지도 드래그 팬(Pan) & 휠 줌(Zoom)
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

  const canShowFullName = (target: MfadGeoTarget): boolean => {
    if (userRole === "HQ_ADMIN" && unmaskPermission) return true;
    if (target.visit_status === "VISITED") return true;
    return false;
  };

  return (
    <div className={`relative w-full h-full flex flex-col font-sans overflow-hidden bg-white text-slate-900 ${className}`}>
      {/* 카카오 SDK 로더 */}
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
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-60 px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 슬림 헤더 (52px 단일 바 - t.note Sales 브랜딩 & 순백 미니멀)]
         ============================================================ */}
      <header className="h-[52px] w-full bg-white border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 select-none">
        {/* 좌측: t.note Sales 브랜딩 */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/admin/crm"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-800 transition-colors py-1 px-1.5 rounded-md hover:bg-slate-50"
            title="CRM 백오피스로 이동"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-normal">CRM</span>
          </Link>

          <span className="text-slate-200">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-sm">⚡</span>
            <h1 className="text-xs sm:text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="font-semibold text-slate-950">t.note Sales</span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-slate-600 font-normal">필드 세일즈 레이더</span>
            </h1>
          </div>
        </div>

        {/* 중앙: 차분한 업종 텍스트 인라인 필터 (강한 원색 배제) */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={toggleAllCategories}
            className={`py-1 px-1 transition-colors cursor-pointer ${
              selectedCategories.length === 4
                ? "text-slate-950 font-medium border-b border-slate-900"
                : "text-slate-500 hover:text-slate-900 font-normal"
            }`}
          >
            <span>전체</span>
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
                className={`flex items-center gap-1 py-1 px-1 transition-colors cursor-pointer ${
                  isActive
                    ? "text-slate-950 font-medium border-b border-slate-900"
                    : "text-slate-500 hover:text-slate-900 font-normal"
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 우측: 관내 요약 통계 + 권한 전환 / 계정 */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-normal">
            <span>관내 타깃</span>
            <span className="font-medium text-slate-900 font-mono">{stats.count}개소</span>
            <span className="text-slate-200 mx-1">|</span>
            <span>예상 환급액</span>
            <span className="font-medium text-slate-800 font-mono">{stats.amountText}</span>
          </div>

          <span className="hidden md:inline text-slate-200">|</span>

          {/* 권한 토글 */}
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
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 hover:bg-slate-50 transition-colors font-normal cursor-pointer"
              title="권한 모드 전환"
            >
              {userRole === "HQ_ADMIN" ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-slate-800 font-medium">HQ 관리자</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-slate-800 font-medium">서포터즈</span>
                </>
              )}
            </button>

            {userRole === "HQ_ADMIN" && (
              <button
                type="button"
                onClick={() => setUnmaskPermission(!unmaskPermission)}
                className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded-md hover:bg-slate-50 cursor-pointer"
                title={unmaskPermission ? "실명 상호 노출 중 (클릭 시 마스킹)" : "마스킹 중 (클릭 시 실명 언마스킹)"}
              >
                {unmaskPermission ? <Unlock className="h-3.5 w-3.5 text-slate-700" /> : <Lock className="h-3.5 w-3.5" />}
              </button>
            )}
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
          [2. 스플릿 바디 (좌: 행정동 업체 리스트 + 엑셀 / 우: 전면 지도)]
         ============================================================ */}
      <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden bg-white">
        {/* ============================================================
            [A. 좌측 사이드 패널 (폭 약 390px, 순백색 무경계 테이블 리스트)]
           ============================================================ */}
        <aside
          aria-label="행정동 가맹점 수수료 누수 목록"
          className="w-full md:w-[390px] lg:w-[410px] h-full flex flex-col bg-white border-r border-slate-100 shrink-0 z-20"
        >
          {/* 상단 컨트롤러: 행정동 필터 & 엑셀 양방향 동기화(다운로드/업로드) */}
          <div className="p-3 border-b border-slate-100 bg-white space-y-2">
            {/* 1행: 관할 구 & 행정동 셀렉터 */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-normal text-slate-400 mb-0.5">
                  관할 자치구
                </label>
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
                  className="w-full bg-slate-50/70 hover:bg-slate-100 text-slate-800 font-normal px-2.5 py-1.5 rounded-lg text-xs border border-slate-200/60 focus:outline-none focus:border-slate-800 cursor-pointer transition-colors"
                >
                  {userRole === "HQ_ADMIN" && <option value="ALL">전체 자치구 ({districts.join(", ")})</option>}
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {userRole === "LOCAL_SUPPORTER" ? `배정: ${d}` : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-normal text-slate-400 mb-0.5">
                  행정동 선택
                </label>
                <select
                  value={selectedDong}
                  onChange={(e) => setSelectedDong(e.target.value)}
                  className="w-full bg-slate-50/70 hover:bg-slate-100 text-slate-800 font-normal px-2.5 py-1.5 rounded-lg text-xs border border-slate-200/60 focus:outline-none focus:border-slate-800 cursor-pointer transition-colors"
                >
                  <option value="ALL">전체 행정동 ({dongs.length}개동)</option>
                  {dongs.map((dong) => (
                    <option key={dong} value={dong}>
                      {dong}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2행: 엑셀 양방향 동기화 액션 바 [📥 엑셀 다운로드] & [📤 엑셀 업로드] */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200/70 transition-colors cursor-pointer"
                title="현재 필터 가맹점 .xlsx 엑셀 다운로드"
              >
                <Download className="h-3 w-3 text-slate-500" />
                <span>📥 엑셀 다운로드 (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-normal border border-slate-200/70 transition-colors cursor-pointer"
                title="수정된 엑셀(.xlsx) 파일 업로드 및 병합"
              >
                <Upload className="h-3 w-3 text-slate-500" />
                <span>📤 엑셀 업로드</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadExcel}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
            </div>

            {/* 3행: 검색 인풋 및 요약 카운터 */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="매장명, 전화번호, 주소 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50/70 rounded-lg text-xs text-slate-800 placeholder-slate-400 border border-slate-200/60 focus:outline-none focus:border-slate-800 transition-colors font-normal"
                />
              </div>

              <div className="text-[11px] text-slate-500 shrink-0 font-normal">
                <span>{filteredTargets.length}개소</span>
              </div>
            </div>
          </div>

          {/* 가맹점 행 리스트 (순백색 무경계 테이블 & 인라인 전화번호 편집) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTargets.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-slate-400 font-normal">
                선택한 조건에 해당하는 가맹점 데이터가 없습니다.
              </div>
            ) : (
              filteredTargets.map((item) => {
                const config = CATEGORY_CONFIG[item.category];
                const isSelected = selectedTarget?.id === item.id;
                const isRestricted = userRole === "LOCAL_SUPPORTER" && item.district !== supporterDistrict;
                const displayStoreName = isRestricted
                  ? "관할 외 가맹점"
                  : canShowFullName(item)
                  ? item.target_name
                  : item.masked_name || maskTargetName(item.target_name);

                const isEditingPhone = editingPhoneId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectAndCenterTarget(item)}
                    className={`p-3 transition-colors cursor-pointer text-xs select-none ${
                      isSelected
                        ? "bg-slate-50/90 border-l-2 border-l-slate-900"
                        : "hover:bg-slate-50/50 bg-white"
                    }`}
                  >
                    {/* 1행: 업종 뱃지, 상호명, 동 */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-600 bg-slate-100 font-normal shrink-0">
                          {config.icon} {config.label}
                        </span>
                        <span className="font-medium text-slate-900 truncate text-[12px]">
                          {displayStoreName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {item.dong}
                      </span>
                    </div>

                    {/* 2행: 전화번호 인라인 표기 / 수정 및 다이얼 링크 */}
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                      {isEditingPhone ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="tel"
                            value={phoneInputValue}
                            onChange={(e) => setPhoneInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePhone(item.id);
                              if (e.key === "Escape") setEditingPhoneId(null);
                            }}
                            placeholder="010-0000-0000"
                            autoFocus
                            className="px-1.5 py-0.5 text-[11px] font-mono border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-slate-800 w-32"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePhone(item.id)}
                            className="p-1 text-slate-700 hover:text-black hover:bg-slate-100 rounded cursor-pointer"
                            title="저장"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhoneId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="취소"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : item.contact_number ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-600 text-[11px]">
                          <a
                            href={`tel:${item.contact_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-0.5 text-slate-700 hover:text-slate-950 hover:underline"
                            title="전화 걸기"
                          >
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{item.contact_number}</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPhone(e, item)}
                            className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                            title="전화번호 수정"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleStartEditPhone(e, item)}
                          className="text-[10.5px] text-slate-400 hover:text-slate-700 hover:underline flex items-center gap-0.5 cursor-pointer font-normal"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span>+ 번호 입력</span>
                        </button>
                      )}

                      {/* 상태 뱃지 */}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-normal border ${
                          item.visit_status === "VISITED"
                            ? "bg-slate-100 text-slate-800 border-slate-200"
                            : item.visit_status === "ASSIGNED"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        {item.visit_status === "VISITED"
                          ? "접수완료"
                          : item.visit_status === "ASSIGNED"
                          ? "배정완료"
                          : "미방문"}
                      </span>
                    </div>

                    {/* 3행: 초과 수수료 사유 코멘트 */}
                    <div className="mt-1 text-[11px] text-slate-500 line-clamp-1 font-normal flex items-center gap-1">
                      <span className="text-slate-400 shrink-0">·</span>
                      <span className="truncate">{item.leakage_reason_comment || item.metadata.leakage_cause}</span>
                    </div>

                    {/* 4행: 예상 환급액 */}
                    <div className="mt-1 pt-1 border-t border-slate-50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 text-[10.5px] font-normal">예상 환급</span>
                      <span className="font-mono font-medium text-slate-800 text-xs">
                        ₩{item.metadata.estimated_refund.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            [B. 우측 메인 뷰 (전면 순백색 인터랙티브 GIS 지도)]
           ============================================================ */}
        <main className="flex-1 h-full relative overflow-hidden select-none bg-white">
          {useKakaoMap ? (
            <div ref={kakaoMapContainerRef} className="w-full h-full bg-white" />
          ) : (
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
                <circle cx="50%" cy="50%" r="160" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="6 6" />
                <circle cx="50%" cy="50%" r="320" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="6 6" />
                <circle cx="50%" cy="50%" r="480" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* 순백색 레이더 스위프 빔 효과 */}
              {isRadarSweepActive && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden opacity-10"
                  style={{
                    background:
                      "conic-gradient(from 0deg at 50% 50%, rgba(30, 41, 59, 0.25) 0deg, rgba(30, 41, 59, 0) 60deg, transparent 360deg)",
                    animation: "radarSweep 6s linear infinite",
                  }}
                />
              )}

              {/* 타깃 핀 렌더링 컨테이너 */}
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
                    ? "관할 외"
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
                      onClick={() => handleSelectAndCenterTarget(item)}
                      style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                      className={`radar-pin-node absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform ${
                        isHovered ? "z-40 scale-105" : "z-20"
                      }`}
                    >
                      {/* 메인 핀 노드 배지 (미니멀 순백/슬레이트) */}
                      <div
                        className={`relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal shadow-xs border transition-all ${
                          isRestricted
                            ? "bg-slate-300 text-slate-600 opacity-40 border-dashed"
                            : isSelected
                            ? "bg-slate-950 text-white border-white ring-2 ring-slate-800 scale-105"
                            : "bg-slate-800 text-white border-white/80 hover:bg-slate-900"
                        }`}
                      >
                        <span className="text-[10px]">{config.icon}</span>
                        <span className="hidden sm:inline-block max-w-[95px] truncate text-[11px]">
                          {displayStoreName}
                        </span>
                        <span className="bg-black/20 px-1 py-0.2 rounded font-mono text-[9px] text-slate-200">
                          ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                        </span>
                      </div>

                      {/* 롤오버 툴팁 */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl bg-white/98 text-slate-800 p-2.5 text-xs border border-slate-200 shadow-md pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                          <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-1 min-w-0 font-medium text-slate-900 truncate text-[11.5px]">
                              <span>{config.icon}</span>
                              <span className="truncate">{displayStoreName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {item.dong}
                            </span>
                          </div>

                          {isRestricted ? (
                            <div className="mt-1.5 p-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-normal flex items-center gap-1">
                              <Lock className="h-3 w-3 shrink-0" />
                              <span>타 지역본부 관할 구역 (열람 제한)</span>
                            </div>
                          ) : (
                            <>
                              <div className="mt-1.5 text-slate-600 text-[10.5px] leading-snug font-normal flex items-start gap-1">
                                <span className="text-slate-400 shrink-0">·</span>
                                <span>{item.leakage_reason_comment || item.metadata.leakage_cause}</span>
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 text-[10.5px]">예상 환급액</span>
                                <span className="font-mono font-medium text-slate-900 text-xs">
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

              {/* 하단 좌측 텔레메트리 */}
              <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-[10.5px] text-slate-400 font-mono">
                <span>VIEW: {selectedDistrict === "ALL" ? "수도권 전역" : selectedDistrict} ({selectedDong === "ALL" ? "전체동" : selectedDong})</span>
                <span>·</span>
                <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              </div>

              {/* 하단 우측 플랫 컨트롤러 */}
              <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1 bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="확대"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="축소"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-slate-200 mx-0.5">|</span>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="flex items-center gap-0.5 text-[10.5px] text-slate-600 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-50 transition-colors cursor-pointer font-normal"
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
                    isRadarSweepActive ? "text-slate-900 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-50"
                  }`}
                  title="스위프 토글"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              [C. 핀/행 클릭 시 슬라이딩 인 상세 패널 (순백 미니멀 디자인)]
             ============================================================ */}
          {selectedTarget && (
            <aside
              aria-label="가맹점 정밀 진단 패널"
              className="absolute top-0 right-0 bottom-0 w-full sm:w-[380px] bg-white border-l border-slate-100 z-40 shadow-lg p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150"
            >
              <div className="space-y-4">
                {/* 패널 헤더 */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] text-slate-600 bg-slate-100 font-normal">
                        {CATEGORY_CONFIG[selectedTarget.category].icon} {CATEGORY_CONFIG[selectedTarget.category].label}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-normal border ${
                          selectedTarget.visit_status === "VISITED"
                            ? "bg-slate-100 text-slate-800 border-slate-200"
                            : selectedTarget.visit_status === "ASSIGNED"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-white text-slate-400 border-slate-200"
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
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {canShowFullName(selectedTarget)
                          ? selectedTarget.target_name
                          : selectedTarget.masked_name || maskTargetName(selectedTarget.target_name)}
                      </h3>
                      {!canShowFullName(selectedTarget) && (
                        <span className="text-[10px] font-normal text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                          마스킹
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate font-normal">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>{selectedTarget.road_address}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTarget(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 환급 추정액 카드 (단정한 모노톤) */}
                <div className="rounded-lg bg-slate-50/70 border border-slate-200/60 p-3 space-y-1">
                  <span className="text-[11px] font-normal text-slate-500">
                    3개년 추정 과오납 회수 예상액
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-medium text-slate-900 font-mono tracking-tight">
                      ₩{selectedTarget.metadata.estimated_refund.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">환급 소명 대상</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[11px] text-slate-600 font-normal">
                    <span>현재 차감 {selectedTarget.metadata.applied_rate}%</span>
                    <span>➔ 법정 우대 {selectedTarget.metadata.statutory_rate}% (소급)</span>
                  </div>
                </div>

                {/* 누수 원인 상세 */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-slate-400" />
                      <span>주요 누수 원인</span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        ({selectedTarget.metadata.primary_leak_code})
                      </span>
                    </span>
                    <p className="p-2.5 rounded-lg bg-slate-50/50 border border-slate-200/60 text-slate-700 text-[11px] font-normal leading-snug">
                      {selectedTarget.leakage_reason_comment || selectedTarget.metadata.leakage_cause}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-700">
                      현장 실사 진단 상세:
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 font-normal">
                      {selectedTarget.metadata.leakage_detail}
                    </p>
                  </div>

                  {/* 기본 정보 그리드 & 전화번호 인라인 수정 */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="text-slate-400 text-[10px] font-normal">대표자 성명</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {selectedTarget.representative_name} 대표
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="text-slate-400 text-[10px] font-normal">연락처</span>
                      <div className="mt-0.5">
                        {editingPhoneId === selectedTarget.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="tel"
                              value={phoneInputValue}
                              onChange={(e) => setPhoneInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePhone(selectedTarget.id);
                                if (e.key === "Escape") setEditingPhoneId(null);
                              }}
                              placeholder="010-0000-0000"
                              autoFocus
                              className="px-1 py-0.5 text-[10.5px] font-mono border border-slate-300 rounded bg-white text-slate-900 w-24"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePhone(selectedTarget.id)}
                              className="p-0.5 text-slate-700"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPhoneId(null)}
                              className="p-0.5 text-slate-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : selectedTarget.contact_number ? (
                          <div className="flex items-center gap-1 font-mono">
                            <a
                              href={`tel:${selectedTarget.contact_number}`}
                              className="text-slate-800 hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{selectedTarget.contact_number}</span>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleStartEditPhone(e, selectedTarget)}
                              className="text-slate-300 hover:text-slate-600 p-0.5 cursor-pointer"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPhone(e, selectedTarget)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="h-2 w-2" />
                            <span>번호 입력</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="text-slate-400 text-[10px] font-normal">월평균 카드매출</span>
                      <p className="font-medium text-slate-900 mt-0.5 font-mono">
                        {(selectedTarget.metadata.monthly_card_sales || 35000000).toLocaleString()}원
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50/50 border border-slate-200/50">
                      <span className="text-slate-400 text-[10px] font-normal">단말기 / 솔루션</span>
                      <p className="font-medium text-slate-900 mt-0.5 truncate">
                        {selectedTarget.metadata.terminal_company || "표준 POS"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 패널 하단 단정한 액션 바 */}
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setIsOfficialDocOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal shadow-2xs transition-colors cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 text-slate-300" />
                  <span>정식 점검 공문 발송 / A4 즉시 인쇄</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintReport(selectedTarget)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-normal transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-400" />
                  <span>사전 실사 브리핑 리포트 출력</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAssignVisit(selectedTarget)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-normal transition-colors cursor-pointer"
                  >
                    <UserCheck className="h-3 w-3 text-slate-500" />
                    <span>방문 접수</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatchTSign(selectedTarget)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-normal transition-colors cursor-pointer"
                  >
                    <Send className="h-3 w-3 text-slate-500" />
                    <span>t.sign 약정서</span>
                  </button>
                </div>
              </div>
            </aside>
          )}
        </main>
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
