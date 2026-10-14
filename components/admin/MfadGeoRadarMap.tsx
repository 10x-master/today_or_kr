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
  Star,
  Calendar,
  MessageSquare,
  Clock,
  FolderPlus,
  Layers,
  ChevronRight,
} from "lucide-react";
import type {
  MfadGeoTarget,
  MfadCategory,
  MfadVisitStatus,
  MfadUserRole,
  CrmProject,
  CrmConsultRecord,
} from "@/types/mfad";
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

// 4대 카테고리 설정 (아이콘 없는 순수 텍스트 라벨)
const CATEGORY_CONFIG: Record<
  MfadCategory,
  { label: string; focus: string }
> = {
  HOSPITAL: {
    label: "병의원",
    focus: "무이자 프로모션 분담금 미정산",
  },
  RESTAURANT: {
    label: "외식/카페",
    focus: "키오스크/테이블오더 PG 추가 수수료",
  },
  GYM: {
    label: "헬스",
    focus: "다개월 할부 마진 누수 및 수수료 괴리",
  },
  NEW_STORE: {
    label: "신규매장",
    focus: "영세 우대율(0.5%) 미소급 일반요율 과오납",
  },
};

// 기본 프로젝트 목록
const DEFAULT_PROJECTS: CrmProject[] = [
  { id: "t-refund", name: "T-환급 (기본)", isDefault: true, color: "#2563eb" },
  { id: "water-purifier", name: "정수기 렌탈", color: "#0284c7" },
  { id: "table-order", name: "테이블오더", color: "#4f46e5" },
];

export default function MfadGeoRadarMap({
  initialTargets,
  currentUser = null,
  className = "",
}: MfadGeoRadarMapProps) {
  // 1. 프로젝트 및 타깃 데이터 초기화
  const [projects, setProjects] = useState<CrmProject[]>(DEFAULT_PROJECTS);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([
    "t-refund",
    "water-purifier",
    "table-order",
  ]);

  const [targets, setTargets] = useState<MfadGeoTarget[]>(() => {
    return initialTargets.map((item, idx) => {
      let projId = item.project_id || "t-refund";
      let projName = item.project_name || "T-환급 (기본)";
      if (!item.project_id) {
        if (idx % 5 === 1) {
          projId = "water-purifier";
          projName = "정수기 렌탈";
        } else if (idx % 5 === 3) {
          projId = "table-order";
          projName = "테이블오더";
        }
      }
      return {
        ...item,
        project_id: projId,
        project_name: projName,
        interest_rating: item.interest_rating ?? (idx % 3 === 0 ? 4 : idx % 5 === 0 ? 0 : 3),
        call_result_code: item.call_result_code ?? (idx % 4 === 0 ? "방문예약" : idx % 6 === 0 ? "부재중" : null),
        consult_timeline: item.consult_timeline ?? [
          {
            id: `rec-${item.id}-1`,
            date: "2026.10.14 10:30",
            text: "1차 유선 브리핑 진행. 대표원장 부재로 14시 재통화 요청.",
            result: "재통화요청",
          },
        ],
      };
    });
  });

  const [selectedTarget, setSelectedTarget] = useState<MfadGeoTarget | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<MfadGeoTarget | null>(null);

  // 프로젝트 등록 모달 상태
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectFile, setNewProjectFile] = useState<File | null>(null);

  // 인라인 전화번호 편집 상태
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneInputValue, setPhoneInputValue] = useState<string>("");

  // CRM 상세 카드 내 입력 상태
  const [newTimelineMemo, setNewTimelineMemo] = useState<string>("");
  const [scheduledDateInput, setScheduledDateInput] = useState<string>("");

  // 권한 격리 상태 (최고 관리자 vs 로컬 Today 서포터즈)
  const [userRole, setUserRole] = useState<MfadUserRole>("HQ_ADMIN");
  const [supporterDistrict, setSupporterDistrict] = useState<string>("분당구");
  const [unmaskPermission, setUnmaskPermission] = useState<boolean>(false);

  // 공문 모달 제어 상태
  const [isOfficialDocOpen, setIsOfficialDocOpen] = useState<boolean>(false);

  // 필터 상태 (행정구 & 행정동 2단계 필터)
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedDong, setSelectedDong] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<MfadCategory[]>([
    "HOSPITAL",
    "RESTAURANT",
    "GYM",
    "NEW_STORE",
  ]);
  const [isRadarSweepActive, setIsRadarSweepActive] = useState<boolean>(true);

  // 지도 인터랙티브 팬 & 줌 상태
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // 엑셀 파일 인풋 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 피드백 및 카카오 지도 상태
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

  // 프로젝트 체크박스 토글
  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        if (prev.length === 1) return prev; // 최소 1개 유지
        return prev.filter((id) => id !== projectId);
      }
      return [...prev, projectId];
    });
  };

  // 신규 프로젝트 등록 핸들러
  const handleCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      showToast("⚠️ 프로젝트명을 입력해 주세요.");
      return;
    }

    const newProjId = `proj-${Date.now()}`;
    const newProject: CrmProject = {
      id: newProjId,
      name: trimmed,
      color: "#2563eb",
    };

    let importedTargets: MfadGeoTarget[] = [];

    // 첨부된 엑셀/CSV 파일 파싱
    if (newProjectFile) {
      try {
        const buffer = await newProjectFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

        importedTargets = rawRows.map((r, idx) => ({
          id: `tgt-${newProjId}-${idx + 1}`,
          project_id: newProjId,
          project_name: trimmed,
          target_name: String(r["정식 상호명"] || r["상호명"] || `가맹점_${idx + 1}`),
          category: "RESTAURANT",
          road_address: String(r["도로명 주소"] || r["주소"] || "서울특별시 강남구 테헤란로 152"),
          dong: String(r["행정동"] || r["동"] || "역삼동"),
          district: String(r["관할 자치구"] || r["구"] || "강남구"),
          lat: 37.498 + (Math.random() - 0.5) * 0.05,
          lng: 127.03 + (Math.random() - 0.5) * 0.05,
          contact_number: String(r["연락처"] || r["전화번호"] || ""),
          representative_name: String(r["대표자명"] || "대표자"),
          visit_status: "UNVISITED",
          metadata: {
            estimated_refund: Number(r["추정 누수 금액 (원)"] || r["누수금액"] || 3500000),
            leakage_cause: String(r["초과 수수료 발생 사유"] || r["메모"] || "신규 도입 프로모션 요율 정합성 검토 대상"),
            leakage_detail: "자체 DB 업로드를 통한 가맹점 정합성 분석 진행 중",
            primary_leak_code: "LEAK_01",
            biz_reg_no: "101-81-00000",
            monthly_card_sales: 30000000,
            applied_rate: 2.1,
            statutory_rate: 1.1,
            annual_leak_estimate: 1200000,
            three_year_recovery: 3500000,
          },
        }));
      } catch (e) {
        console.error("Project file parsing error", e);
      }
    }

    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectIds((prev) => [...prev, newProjId]);
    if (importedTargets.length > 0) {
      setTargets((prev) => [...importedTargets, ...prev]);
      showToast(`📂 [${trimmed}] 프로젝트 등록 완료 (${importedTargets.length}개 가맹점 DB 탑재)`);
    } else {
      showToast(`📂 [${trimmed}] 프로젝트가 성공적으로 등록되었습니다.`);
    }

    setIsProjectModalOpen(false);
    setNewProjectName("");
    setNewProjectFile(null);
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

  // 필터링된 타깃 목록 (프로젝트 다중 선택 필터 포함)
  const filteredTargets = useMemo(() => {
    return targets.filter((item) => {
      // 1. 프로젝트 필터
      const targetProj = item.project_id || "t-refund";
      if (!selectedProjectIds.includes(targetProj)) {
        return false;
      }
      // 2. 지역 필터
      if (selectedDistrict !== "ALL" && item.district !== selectedDistrict) {
        return false;
      }
      if (selectedDong !== "ALL" && item.dong !== selectedDong) {
        return false;
      }
      // 3. 업종 필터
      if (!selectedCategories.includes(item.category)) {
        return false;
      }
      // 4. 검색어 필터
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
  }, [targets, selectedProjectIds, selectedDistrict, selectedDong, selectedCategories, searchTerm]);

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

  // 관심도 별점 평가 핸들러
  const handleUpdateRating = (rating: number) => {
    if (!selectedTarget) return;
    setTargets((prev) =>
      prev.map((t) => (t.id === selectedTarget.id ? { ...t, interest_rating: rating } : t))
    );
    setSelectedTarget((prev) => (prev ? { ...prev, interest_rating: rating } : null));
    showToast(`⭐ [${selectedTarget.target_name}] 관심도 ${rating}점으로 반영되었습니다.`);
  };

  // 통화 결과 코드 설정 핸들러
  const handleUpdateCallResult = (code: string) => {
    if (!selectedTarget) return;
    setTargets((prev) =>
      prev.map((t) => (t.id === selectedTarget.id ? { ...t, call_result_code: code } : t))
    );
    setSelectedTarget((prev) => (prev ? { ...prev, call_result_code: code } : null));
    showToast(`📞 [${selectedTarget.target_name}] 통화 결과: ${code}`);
  };

  // 방문 상담 예약 스케줄러 저장 핸들러
  const handleSaveSchedule = () => {
    if (!selectedTarget) return;
    if (!scheduledDateInput) {
      showToast("⚠️ 방문 상담 일시를 선택해 주세요.");
      return;
    }

    const updatedStatus: MfadVisitStatus = "SCHEDULED";
    const dateFormatted = scheduledDateInput.replace("T", " ");

    const newRecord: CrmConsultRecord = {
      id: `rec-${Date.now()}`,
      date: new Date().toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      text: `방문 상담 예약 등록: ${dateFormatted} 현장 방문 예정`,
      result: "방문예약",
    };

    setTargets((prev) =>
      prev.map((t) =>
        t.id === selectedTarget.id
          ? {
              ...t,
              visit_status: updatedStatus,
              scheduled_visit_date: dateFormatted,
              consult_timeline: [newRecord, ...(t.consult_timeline || [])],
            }
          : t
      )
    );

    setSelectedTarget((prev) =>
      prev
        ? {
            ...prev,
            visit_status: updatedStatus,
            scheduled_visit_date: dateFormatted,
            consult_timeline: [newRecord, ...(prev.consult_timeline || [])],
          }
        : null
    );

    setScheduledDateInput("");
    showToast(`📅 [${selectedTarget.target_name}] ${dateFormatted} 방문 예약이 등록되었습니다. (지도 핀 예약 상태로 전환)`);
  };

  // 상담 메모 추가 핸들러
  const handleAddConsultTimeline = () => {
    if (!selectedTarget || !newTimelineMemo.trim()) return;

    const newRecord: CrmConsultRecord = {
      id: `rec-${Date.now()}`,
      date: new Date().toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) + " " + new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      text: newTimelineMemo.trim(),
      result: selectedTarget.call_result_code || "상담기록",
    };

    setTargets((prev) =>
      prev.map((t) =>
        t.id === selectedTarget.id
          ? {
              ...t,
              consult_timeline: [newRecord, ...(t.consult_timeline || [])],
            }
          : t
      )
    );

    setSelectedTarget((prev) =>
      prev
        ? {
            ...prev,
            consult_timeline: [newRecord, ...(prev.consult_timeline || [])],
          }
        : null
    );

    setNewTimelineMemo("");
    showToast("📝 상담 메모가 타임라인에 저장되었습니다.");
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

  // Kakao Map 마커 동기화 (블루 테마 & 이모지 없는 단정 텍스트 캡슐)
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
      const isScheduled = tgt.visit_status === "SCHEDULED";
      const isRestricted = userRole === "LOCAL_SUPPORTER" && tgt.district !== supporterDistrict;
      const displayStoreName = isRestricted
        ? "관할 외"
        : tgt.masked_name || maskTargetName(tgt.target_name);

      const overlayContent = document.createElement("div");
      overlayContent.className = "cursor-pointer transform transition-transform hover:scale-105";
      overlayContent.innerHTML = `
        <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-normal shadow-xs border ${
          isRestricted
            ? "bg-slate-400 border-dashed opacity-50"
            : isSelected
            ? "bg-blue-800 border-white ring-2 ring-blue-400"
            : isScheduled
            ? "bg-indigo-700 border-white ring-2 ring-indigo-300"
            : "bg-blue-600 border-white/90"
        }">
          <span class="truncate max-w-[85px]">${displayStoreName}</span>
          <span class="bg-black/20 px-1 py-0.2 rounded text-[9.5px] font-mono text-blue-100">₩${(
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

  // [📥 엑셀 다운로드 (.xlsx)]
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
        item.visit_status === "SCHEDULED"
          ? "방문 상담 예약"
          : item.visit_status === "VISITED"
          ? "누수 확정 (방문접수)"
          : item.visit_status === "ASSIGNED"
          ? "의심 탐지 (서포터즈 배정)"
          : "의심 탐지 (미방문 발굴)";

      return {
        "프로젝트": item.project_name || "T-환급 (기본)",
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
        "점검 상태": statusText,
        "관심도 점수": item.interest_rating ?? 3,
        "통화 결과": item.call_result_code || "",
        "예약 일시": item.scheduled_visit_date || "",
        "초과 사유 및 메모": item.leakage_reason_comment || item.metadata.leakage_cause,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 16 }, // 프로젝트
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
      { wch: 20 }, // 점검 상태
      { wch: 12 }, // 관심도 점수
      { wch: 14 }, // 통화 결과
      { wch: 20 }, // 예약 일시
      { wch: 45 }, // 초과 사유 및 메모
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "세일즈_가맹점DB");

    const todayStr = new Date().toISOString().slice(0, 10);
    const fileName = `t.note_Sales_DB_${todayStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    showToast(`📥 [${filteredTargets.length}개 가맹점] .xlsx 엑셀 다운로드가 완료되었습니다.`);
  };

  // [📤 엑셀 업로드 및 양방향 병합(Upsert) 엔진]
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rawRows || rawRows.length === 0) {
        showToast("⚠️ 업로드된 엑셀 파일에 데이터가 없습니다.");
        return;
      }

      let updatedCount = 0;

      setTargets((prev) => {
        return prev.map((target) => {
          const matchedRow = rawRows.find((row) => {
            const rowFullName = String(row["정식 상호명"] || row["정식상호명"] || row["상호명"] || "").trim();
            const rowMaskedName = String(row["가맹점명 (별칭)"] || row["가맹점명"] || "").trim();
            const rowAddress = String(row["도로명 주소"] || row["도로명주소"] || row["주소"] || "").trim();

            if (rowFullName && target.target_name.includes(rowFullName)) return true;
            if (rowMaskedName && (target.masked_name === rowMaskedName || target.target_name.includes(rowMaskedName.replace(/\*/g, "")))) return true;
            if (rowAddress && (target.road_address.includes(rowAddress) || rowAddress.includes(target.road_address))) return true;
            return false;
          });

          if (!matchedRow) return target;

          const newPhone = matchedRow["연락처"] || matchedRow["전화번호"] || matchedRow["핸드폰"];
          const newStatus = matchedRow["점검 상태"] || matchedRow["상태"];
          const newMemo = matchedRow["초과 사유 및 메모"] || matchedRow["메모"];
          const newRating = matchedRow["관심도 점수"];
          const newCallResult = matchedRow["통화 결과"];

          let hasChanged = false;
          let updatedPhone = target.contact_number;
          let updatedStatus = target.visit_status;
          let updatedMemo = target.leakage_reason_comment;
          let updatedRating = target.interest_rating;
          let updatedCallResult = target.call_result_code;

          if (newPhone && String(newPhone).trim() && String(newPhone).trim() !== target.contact_number) {
            updatedPhone = String(newPhone).trim();
            hasChanged = true;
          }

          if (newStatus) {
            const statusStr = String(newStatus);
            if (statusStr.includes("예약") && target.visit_status !== "SCHEDULED") {
              updatedStatus = "SCHEDULED";
              hasChanged = true;
            } else if ((statusStr.includes("확정") || statusStr.includes("완료")) && target.visit_status !== "VISITED") {
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

          if (newRating !== undefined && Number(newRating) >= 0 && Number(newRating) <= 5) {
            updatedRating = Number(newRating);
            hasChanged = true;
          }

          if (newCallResult && String(newCallResult).trim()) {
            updatedCallResult = String(newCallResult).trim();
            hasChanged = true;
          }

          if (hasChanged) {
            updatedCount++;
            return {
              ...target,
              contact_number: updatedPhone,
              visit_status: updatedStatus,
              leakage_reason_comment: updatedMemo,
              interest_rating: updatedRating,
              call_result_code: updatedCallResult,
            };
          }

          return target;
        });
      });

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
      showToast("❌ 엑셀 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePrintReport = (target: MfadGeoTarget) => {
    setSelectedTarget(target);
    showToast(`📄 [${target.masked_name || target.target_name}] 리포트 출력을 준비합니다...`);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDispatchKakaoDoc = (target: MfadGeoTarget) => {
    const docLink = `${typeof window !== "undefined" ? window.location.origin : ""}/admin/radar?targetId=${target.id}&docView=official`;
    try {
      navigator.clipboard.writeText(docLink);
    } catch {}
    showToast(`📲 [${target.target_name}] 카카오톡 공문 안내 링크가 복사 및 발송 처리되었습니다!`);
  };

  const handleDispatchTSign = (target: MfadGeoTarget) => {
    const contractLink = `${typeof window !== "undefined" ? window.location.origin : ""}/tsign/contract?targetId=${target.id}&ref=tnote-sales`;
    try {
      navigator.clipboard.writeText(contractLink);
    } catch {}
    showToast(`📲 [${target.representative_name} 대표] (${target.contact_number}) t.sign 전자계약 링크가 발송되었습니다!`);
  };

  // 지도 드래그 팬 & 휠 줌
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".radar-pin-node, button, select, input, a, textarea")) return;
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
    if (target.visit_status === "VISITED" || target.visit_status === "SCHEDULED") return true;
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

      {/* 신규 프로젝트 등록 모달 */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">📂</span>
                <h3 className="text-sm font-semibold text-slate-900">신규 세일즈 프로젝트 등록</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setNewProjectName("");
                  setNewProjectFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  프로젝트명 <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: POS/키오스크 교체 프로모션, CCTV 렌탈"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  전용 가맹점 DB 업로드 (선택, .xlsx / .csv)
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setNewProjectFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[10.5px] text-slate-400 mt-1">
                  * 엑셀 파일 첨부 시 해당 프로젝트 DB로 즉시 매핑되어 추가됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setNewProjectName("");
                  setNewProjectFile(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                프로젝트 등록 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 알림 토스트 */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-60 px-4 py-2 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-blue-300 shrink-0" />
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

        {/* 중앙: 업종 텍스트 인라인 필터 */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={toggleAllCategories}
            className={`py-1 px-1 transition-colors cursor-pointer ${
              selectedCategories.length === 4
                ? "text-blue-600 font-medium border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-900 font-normal"
            }`}
          >
            <span>전체 업종</span>
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
                    ? "text-blue-600 font-medium border-b-2 border-blue-600"
                    : "text-slate-500 hover:text-slate-900 font-normal"
                }`}
              >
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 우측: 관내 요약 통계 + 권한 전환 / 계정 */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-normal">
            <span>활성 타깃</span>
            <span className="font-medium text-blue-600 font-mono">{stats.count}개소</span>
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
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-slate-800 font-medium">HQ 관리자</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
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
                {unmaskPermission ? <Unlock className="h-3.5 w-3.5 text-blue-600" /> : <Lock className="h-3.5 w-3.5" />}
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
          [2. 메인 바디 (좌: 310px 슬림 사이드바 / 우: 전면 지도 & 도킹 CRM)]
         ============================================================ */}
      <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden bg-white relative">
        {/* ============================================================
            [A. 좌측 사이드 패널 (너비 310px 고정, 70% 슬림화 & 높은 정보밀도)]
           ============================================================ */}
        <aside
          aria-label="세일즈 프로젝트 및 가맹점 목록"
          className="w-full md:w-[310px] lg:w-[320px] h-full flex flex-col bg-white border-r border-slate-100 shrink-0 z-20 select-none"
        >
          {/* 최상단: 프로젝트 선택 및 관리 바 */}
          <div className="p-2.5 border-b border-slate-100 bg-white space-y-2 shrink-0">
            {/* 1행: 프로젝트 라벨 & 액션 버튼 3개 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📂</span>
                <span className="text-xs font-semibold text-slate-800 tracking-tight">프로젝트 선택</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({selectedProjectIds.length}/{projects.length})
                </span>
              </div>

              {/* 우측 슬림 라인 아이콘 버튼 3개 */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="[+ 프로젝트 등록]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="[📥 DB 다운로드 (.xlsx)]"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="[📤 DB 업로드 및 병합]"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadExcel}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            </div>

            {/* 2행: 프로젝트 다중 체크박스 목록 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {projects.map((p) => {
                const isChecked = selectedProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] cursor-pointer transition-colors border ${
                      isChecked
                        ? "bg-blue-50/80 border-blue-300 text-blue-900 font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-normal"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleProject(p.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    <span>{p.name}</span>
                  </label>
                );
              })}
            </div>

            {/* 3행: 관할 자치구/행정동 필터 (1개 행에 2열로 슬림 배치) */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div>
                <select
                  value={userRole === "HQ_ADMIN" ? selectedDistrict : supporterDistrict}
                  onChange={(e) => {
                    if (userRole === "HQ_ADMIN") {
                      setSelectedDistrict(e.target.value);
                    } else {
                      setSupporterDistrict(e.target.value);
                      setSelectedDistrict(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-normal px-2 py-1 rounded text-[11px] border border-slate-200/80 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
                >
                  {userRole === "HQ_ADMIN" && <option value="ALL">전체 자치구</option>}
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedDong}
                  onChange={(e) => setSelectedDong(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-normal px-2 py-1 rounded text-[11px] border border-slate-200/80 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
                >
                  <option value="ALL">전체 행정동</option>
                  {dongs.map((dong) => (
                    <option key={dong} value={dong}>
                      {dong}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4행: 슬림 검색창 */}
            <div className="relative pt-0.5">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="매장명, 전화번호, 주소 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-12 py-1 bg-slate-50 rounded text-[11px] text-slate-800 placeholder-slate-400 border border-slate-200/80 focus:outline-none focus:border-blue-600 transition-colors font-normal"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                {filteredTargets.length}개
              </span>
            </div>
          </div>

          {/* 가맹점 행 리스트 (그래픽 아이콘 전면 제거 & 단정한 행 구조) */}
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
                    className={`p-2.5 transition-colors cursor-pointer text-xs select-none ${
                      isSelected
                        ? "bg-blue-50/70 border-l-2 border-l-blue-600"
                        : "hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    {/* 1행: [연회색 박스 뱃지: 무슨동 / 카테고리명] + 점검/예약 상태 */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-normal truncate">
                        {item.dong} / {config.label}
                      </span>

                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-normal border ${
                          item.visit_status === "SCHEDULED"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : item.visit_status === "VISITED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.visit_status === "ASSIGNED"
                            ? "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-white text-slate-400 border-slate-200"
                        }`}
                      >
                        {item.visit_status === "SCHEDULED"
                          ? "방문예약"
                          : item.visit_status === "VISITED"
                          ? "접수완료"
                          : item.visit_status === "ASSIGNED"
                          ? "배정완료"
                          : "미방문"}
                      </span>
                    </div>

                    {/* 2행: 상호명 + 전화번호 (상호명 바로 옆에 번호 노출) */}
                    <div className="mt-1 flex items-baseline justify-between gap-1.5">
                      <span className="font-medium text-slate-900 truncate text-[12px] flex-1">
                        {displayStoreName}
                      </span>

                      {isEditingPhone ? (
                        <div
                          className="flex items-center gap-1 shrink-0"
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
                            className="px-1 py-0.5 text-[10.5px] font-mono border border-blue-400 rounded bg-white text-slate-900 focus:outline-none w-28"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePhone(item.id)}
                            className="p-0.5 text-blue-600 hover:text-blue-800"
                            title="저장"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhoneId(null)}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                            title="취소"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : item.contact_number ? (
                        <div className="flex items-center gap-1 font-mono text-slate-600 text-[11px] shrink-0">
                          <a
                            href={`tel:${item.contact_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-700 hover:text-blue-600 hover:underline"
                            title="전화 걸기"
                          >
                            {item.contact_number}
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPhone(e, item)}
                            className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="전화번호 수정"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleStartEditPhone(e, item)}
                          className="text-[10px] text-slate-400 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50 px-1.5 py-0.5 rounded text-chip shrink-0 cursor-pointer font-normal"
                        >
                          + 번호 기재
                        </button>
                      )}
                    </div>

                    {/* 3행: 예상 금액 또는 환급/계약 메모 (차분한 슬레이트 컬러) */}
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-normal">
                      <span className="truncate max-w-[170px]">
                        {item.call_result_code ? `[${item.call_result_code}] ` : ""}
                        {item.leakage_reason_comment || item.metadata.leakage_cause}
                      </span>
                      <span className="font-mono font-medium text-slate-700 shrink-0 text-[11.5px]">
                        ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            [B. 우측 메인 뷰 (전면 순백색 인터랙티브 GIS 지도 & 도킹 CRM)]
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
                      "conic-gradient(from 0deg at 50% 50%, rgba(37, 99, 235, 0.25) 0deg, rgba(37, 99, 235, 0) 60deg, transparent 360deg)",
                    animation: "radarSweep 6s linear infinite",
                  }}
                />
              )}

              {/* 타깃 핀 렌더링 컨테이너 (Today Link 통일 블루 테마 & 이모지 없는 단정 핀) */}
              <div
                className="absolute inset-8 z-20 transition-transform duration-75 origin-center pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                {filteredTargets.map((item) => {
                  const isSelected = selectedTarget?.id === item.id;
                  const isHovered = hoveredTarget?.id === item.id;
                  const isScheduled = item.visit_status === "SCHEDULED";
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
                      {/* 메인 핀 노드 배지 (Today Link 블루 테마 일관화) */}
                      <div
                        className={`relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal shadow-xs border transition-all ${
                          isRestricted
                            ? "bg-slate-300 text-slate-600 opacity-40 border-dashed"
                            : isSelected
                            ? "bg-blue-800 text-white border-white ring-2 ring-blue-400 scale-105 shadow-md"
                            : isScheduled
                            ? "bg-indigo-700 text-white border-white ring-2 ring-indigo-300 shadow-sm"
                            : "bg-blue-600 text-white border-white/90 hover:bg-blue-700"
                        }`}
                      >
                        <span className="max-w-[85px] truncate text-[11px]">
                          {displayStoreName}
                        </span>
                        <span className="bg-black/20 px-1 py-0.2 rounded font-mono text-[9px] text-blue-100">
                          ₩{(item.metadata.estimated_refund / 10000).toFixed(0)}만
                        </span>
                      </div>

                      {/* 롤오버 툴팁 */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-60 rounded-xl bg-white/98 text-slate-800 p-2.5 text-xs border border-slate-200 shadow-md pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                          <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-1 min-w-0 font-medium text-slate-900 truncate text-[11.5px]">
                              <span className="text-blue-600 font-semibold">•</span>
                              <span className="truncate">{displayStoreName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {item.dong}
                            </span>
                          </div>

                          {isRestricted ? (
                            <div className="mt-1.5 p-1 rounded bg-slate-50 text-slate-500 text-[10px] font-normal flex items-center gap-1">
                              <Lock className="h-3 w-3 shrink-0" />
                              <span>타 지역본부 관할 구역 (열람 제한)</span>
                            </div>
                          ) : (
                            <>
                              <div className="mt-1.5 text-slate-600 text-[10.5px] leading-snug font-normal">
                                {item.leakage_reason_comment || item.metadata.leakage_cause}
                              </div>

                              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 text-[10.5px]">예상 환급액</span>
                                <span className="font-mono font-medium text-blue-700 text-xs">
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

              {/* 하단 좌측 텔레메트리 (블루 테마) */}
              <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-[10.5px] text-blue-600 font-mono bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200 shadow-xs">
                <span>VIEW: {selectedDistrict === "ALL" ? "수도권 전역" : selectedDistrict} ({selectedDong === "ALL" ? "전체동" : selectedDong})</span>
                <span>·</span>
                <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
              </div>

              {/* 하단 우측 컨트롤러 */}
              <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs shadow-xs">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="확대"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="축소"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-slate-200 mx-0.5">|</span>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="flex items-center gap-0.5 text-[10.5px] text-slate-600 hover:text-blue-600 px-1 py-0.5 rounded hover:bg-slate-50 transition-colors cursor-pointer font-normal"
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
                    isRadarSweepActive ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-50"
                  }`}
                  title="스위프 토글"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              [C. 리스트 바로 오른쪽에 밀착되는 상세 CRM 카드 (Docked Panel)]
             ============================================================ */}
          {selectedTarget && (
            <aside
              aria-label="가맹점 TM CRM 상세 패널"
              className="absolute top-0 bottom-0 left-0 md:left-0 w-full sm:w-[360px] bg-white border-r border-slate-200/90 z-30 shadow-xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-150"
            >
              <div className="p-4 space-y-3.5">
                {/* 1. 패널 상단 헤더: 상호명, 주소, 전화번호 */}
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded text-[10px] text-blue-700 bg-blue-50 font-normal">
                          {selectedTarget.project_name || "T-환급 (기본)"}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] text-slate-600 bg-slate-100 font-normal">
                          {selectedTarget.dong} / {CATEGORY_CONFIG[selectedTarget.category]?.label}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-normal border ${
                            selectedTarget.visit_status === "SCHEDULED"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : selectedTarget.visit_status === "VISITED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          {selectedTarget.visit_status === "SCHEDULED"
                            ? "방문예약"
                            : selectedTarget.visit_status === "VISITED"
                            ? "접수완료"
                            : "미방문"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {canShowFullName(selectedTarget)
                            ? selectedTarget.target_name
                            : selectedTarget.masked_name || maskTargetName(selectedTarget.target_name)}
                        </h3>
                        {!canShowFullName(selectedTarget) && (
                          <span className="text-[10px] text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                            마스킹
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate font-normal">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{selectedTarget.road_address}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTarget(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="닫기"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 전화번호 인라인 수정 및 원클릭 다이얼 */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[10.5px]">대표 연락처</span>
                    <div>
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
                            className="px-1.5 py-0.5 text-[11px] font-mono border border-blue-400 rounded bg-white text-slate-900 w-28"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePhone(selectedTarget.id)}
                            className="p-0.5 text-blue-600 hover:text-blue-800"
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
                        <div className="flex items-center gap-1.5 font-mono">
                          <a
                            href={`tel:${selectedTarget.contact_number}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline font-medium text-[11.5px]"
                            title="원클릭 통화 연결"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{selectedTarget.contact_number}</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPhone(e, selectedTarget)}
                            className="text-slate-300 hover:text-slate-600 p-0.5 cursor-pointer"
                            title="전화번호 수정"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleStartEditPhone(e, selectedTarget)}
                          className="text-[10.5px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span>번호 입력</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. 관심도 / 반응도 원클릭 평가 (0점: 거절, 1~5점: 별점) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span>관심도 / 반응도 평가</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      현재: {selectedTarget.interest_rating ?? 3}점
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1">
                    {[
                      { val: 0, label: "0 거절" },
                      { val: 1, label: "★ 1" },
                      { val: 2, label: "★ 2" },
                      { val: 3, label: "★ 3" },
                      { val: 4, label: "★ 4" },
                      { val: 5, label: "★ 5" },
                    ].map((item) => {
                      const isActive = (selectedTarget.interest_rating ?? 3) === item.val;
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleUpdateRating(item.val)}
                          className={`py-1 text-[10px] rounded transition-colors cursor-pointer border ${
                            isActive
                              ? item.val === 0
                                ? "bg-slate-200 text-slate-800 border-slate-300 font-semibold"
                                : "bg-blue-600 text-white border-blue-600 font-semibold"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. 통화 결과 코드 원클릭 선택 */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-700 block">
                    통화 결과 코드
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {["부재중", "재통화요청", "방문예약", "계약완료"].map((code) => {
                      const isActive = selectedTarget.call_result_code === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleUpdateCallResult(code)}
                          className={`py-1 px-1 text-[10px] rounded transition-colors cursor-pointer border text-center ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-900 font-medium"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 방문 상담 스케줄러 (저장 시 지도 핀이 '예약 핀'으로 즉시 전환) */}
                <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-blue-900 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      <span>방문 상담 스케줄러</span>
                    </span>
                    {selectedTarget.scheduled_visit_date && (
                      <span className="text-[10px] font-mono text-blue-700 font-medium">
                        예약: {selectedTarget.scheduled_visit_date}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="datetime-local"
                      value={scheduledDateInput}
                      onChange={(e) => setScheduledDateInput(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-[10.5px] text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] rounded font-medium transition-colors cursor-pointer shrink-0"
                    >
                      예약 저장
                    </button>
                  </div>
                </div>

                {/* 5. 상담 메모 입력창 & 타임라인 기록 */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-slate-400" />
                    <span>상담 메모 & 타임라인 기록</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="통화 내용, 대표 반응, 특이사항 입력..."
                      value={newTimelineMemo}
                      onChange={(e) => setNewTimelineMemo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddConsultTimeline();
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 focus:outline-none focus:border-blue-600 font-normal"
                    />
                    <button
                      type="button"
                      onClick={handleAddConsultTimeline}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10.5px] rounded font-normal transition-colors cursor-pointer shrink-0"
                    >
                      기록 저장
                    </button>
                  </div>

                  {/* 타임라인 목록 */}
                  <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                    {(selectedTarget.consult_timeline || []).map((rec) => (
                      <div
                        key={rec.id}
                        className="p-1.5 rounded bg-slate-50 border border-slate-100 text-[10.5px] text-slate-600 space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-mono text-[9.5px] text-slate-400">
                          <span>{rec.date}</span>
                          {rec.result && <span className="text-blue-600 font-medium">{rec.result}</span>}
                        </div>
                        <p className="text-slate-800 leading-snug">{rec.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. 환급/영업 금액 요약 */}
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">회수/영업 대상 금액</span>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      ₩{selectedTarget.metadata.estimated_refund.toLocaleString()}원
                    </span>
                  </div>
                  <div className="text-right text-[10.5px] text-slate-500 font-mono">
                    <span>월매출: ₩{(selectedTarget.metadata.monthly_card_sales / 10000).toFixed(0)}만</span>
                  </div>
                </div>
              </div>

              {/* 하단 액션 버튼 바 */}
              <div className="p-3 border-t border-slate-100 bg-white space-y-1.5">
                <button
                  type="button"
                  onClick={() => setIsOfficialDocOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>공문 카톡 전송 & 정식 공문 출력</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDispatchTSign(selectedTarget)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-normal transition-colors cursor-pointer"
                  >
                    <Send className="h-3 w-3 text-blue-600" />
                    <span>✍️ t.sign 전자계약</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintReport(selectedTarget)}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-normal transition-colors cursor-pointer"
                  >
                    <Printer className="h-3 w-3 text-slate-500" />
                    <span>브리핑 출력</span>
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
