"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Share2,
  ExternalLink,
  Sparkles,
  Users,
  Briefcase,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  FileCheck,
  Send,
  X,
  ChevronRight,
  Calculator,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Building,
  Check,
} from "lucide-react";
import type { TenantProfile, JobPostingItem, JobApplicantSubmission } from "@/types/homepage";
import type { LinkPickDeskItem } from "@/types/desk";
import { DEFAULT_TENANT, MOCK_TENANTS, MOCK_JOB_POSTINGS } from "@/lib/homepageSeed";
import { MOCK_LINKPICK_DESK_ITEMS } from "@/lib/deskSeed";

interface THomepageViewProps {
  tenantCode?: string;
  initialTenant?: TenantProfile;
}

export default function THomepageView({
  tenantCode = "hwaro-jungja",
  initialTenant,
}: THomepageViewProps) {
  // 테넌트 데이터 결정
  const tenant: TenantProfile =
    initialTenant ||
    MOCK_TENANTS[tenantCode] ||
    DEFAULT_TENANT;

  // 1. 링크픽 실시간 연동 상태 (t.note에서 사장님이 활성화한 아이템만 동기화)
  const [activeLinkpicks, setActiveLinkpicks] = useState<LinkPickDeskItem[]>([]);

  // 2. 구인 공고 목록
  const [jobPostings, setJobPostings] = useState<JobPostingItem[]>([]);

  // 3. 비디오 플레이어 상태
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 4. 모달 상태
  const [activeModal, setActiveModal] = useState<
    "TCHECK" | "TSIGN" | "JOB_APPLY" | "MFAD_DIAG" | null
  >(null);
  const [selectedJob, setSelectedJob] = useState<JobPostingItem | null>(null);

  // 5. 간편 지원 폼 상태
  const [applyName, setApplyName] = useState<string>("");
  const [applyPhone, setApplyPhone] = useState<string>("");
  const [applyIntro, setApplyIntro] = useState<string>("");

  // 6. t.check 출결 상태
  const [checkStatus, setCheckStatus] = useState<"IDLE" | "CHECKED_IN" | "CHECKED_OUT">("IDLE");
  const [checkTimestamp, setCheckTimestamp] = useState<string>("");

  // 7. t.sign 서약 서명 상태
  const [signedName, setSignedName] = useState<string>("");
  const [isSigned, setIsSigned] = useState<boolean>(false);

  // 8. M-FAD 수수료 진단 상태
  const [monthlySales, setMonthlySales] = useState<number>(3000); // 단위: 만원
  const [posType, setPosType] = useState<string>("TABLE_ORDER");

  // 9. 토스트 알림
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 링크픽 및 구인 공고 로드
  useEffect(() => {
    // 1) LinkPick 아이템 로드: t.note 데스크의 localStorage 변경사항 실시간 감지
    const loadLinkpicks = () => {
      try {
        const saved = localStorage.getItem("today_linkpick_desk_items");
        if (saved) {
          const parsed: LinkPickDeskItem[] = JSON.parse(saved);
          setActiveLinkpicks(parsed.filter((item) => item.is_active));
          return;
        }
      } catch {}
      // 기본값: 테넌트 제공 아이템 중 is_active = true
      const fallback = tenant.linkpick_items || MOCK_LINKPICK_DESK_ITEMS;
      setActiveLinkpicks(fallback.filter((item) => item.is_active));
    };

    loadLinkpicks();

    // 2) 구인 공고 필터링
    const tenantJobs = MOCK_JOB_POSTINGS.filter(
      (job) => job.tenant_slug === tenant.slug || job.tenant_id === tenant.id
    );
    setJobPostings(tenantJobs.length > 0 ? tenantJobs : [MOCK_JOB_POSTINGS[0]]);
  }, [tenant]);

  // 비디오 재생/정지 제어
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 1초 간편 지원 제출
  const handleSubmitJobApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyName.trim() || !applyPhone.trim()) {
      alert("성함과 연락처를 입력해주세요.");
      return;
    }

    const newApplication: JobApplicantSubmission = {
      id: `app-${Date.now()}`,
      job_posting_id: selectedJob?.id || "job-default",
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      applicant_name: applyName.trim(),
      applicant_phone: applyPhone.trim(),
      applicant_intro: applyIntro.trim() || "성실히 일하겠습니다.",
      pipeline_stage: "APPLIED",
      applied_at: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem("today_job_applicants");
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem("today_job_applicants", JSON.stringify([newApplication, ...list]));
      // 사장님 t.note 데스크 실시간 카운팅 동기화 이벤트
      window.dispatchEvent(
        new CustomEvent("today_applicant_added", { detail: newApplication })
      );
    } catch {}

    showToast(`🎉 [${tenant.name}] ${selectedJob?.title || "채용 공고"}에 1초 간편 지원이 완료되었습니다! 사장님께 실시간 알림이 전송되었습니다.`);
    setActiveModal(null);
    setApplyName("");
    setApplyPhone("");
    setApplyIntro("");
  };

  // t.check 현장 출퇴근 처리
  const handleTCheckAction = (action: "CHECK_IN" | "CHECK_OUT") => {
    const timeStr = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setCheckTimestamp(timeStr);
    setCheckStatus(action === "CHECK_IN" ? "CHECKED_IN" : "CHECKED_OUT");
    showToast(
      action === "CHECK_IN"
        ? `📍 [t.check 출근 완료] ${tenant.name} 현장 반경 50m 지오펜스 안착 (${timeStr})`
        : `👋 [t.check 퇴근 완료] 오늘 하루도 수고하셨습니다 (${timeStr})`
    );
  };

  // t.sign 서약 완료 처리
  const handleTSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedName.trim()) {
      alert("서명자 성함을 입력해주세요.");
      return;
    }
    setIsSigned(true);
    showToast(`📜 [t.sign 서약 완료] '${signedName}'님의 안심 약정서가 SHA-256 전자 인장 날인되었습니다.`);
    setTimeout(() => {
      setActiveModal(null);
      setIsSigned(false);
      setSignedName("");
    }, 1200);
  };

  // URL 복사 공유
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("🔗 티홈페이지 공식 주소가 클립보드에 복사되었습니다.");
    }
  };

  // M-FAD 수수료 진단 계산
  const estimatedRefund = Math.floor(monthlySales * 0.016 * 12 * 2.8); // 3개년 과오납 회수 예상액

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-24 selection:bg-slate-900 selection:text-white">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-normal shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          [1. 상단 헤더: 사업자 인증, 상호명, 업종 태그, 데스크 전환]
         ============================================================ */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 좌측: 인증 뱃지 & 상호명 */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shrink-0 shadow-xs">
              t.
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {tenant.name}
                </h1>
                {tenant.verified && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    공식 인증
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 font-normal truncate hidden sm:block">
                {tenant.category_name} • {tenant.dong}
              </p>
            </div>
          </div>

          {/* 우측 액션: 내 티노트 데스크 바로가기 & 공유 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="티홈페이지 주소 복사"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <Link
              href="/desk"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>내 티노트 데스크 →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
          [2. 메인 콘텐츠 컨테이너]
         ============================================================ */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* 매장 기본 정보 배너 */}
        <section className="rounded-2xl bg-slate-50/70 border border-slate-200/90 p-4 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10.5px] font-medium">
                  {tenant.category_name}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  사업자등록번호: {tenant.biz_reg_number}
                </span>
                <span className="text-xs text-slate-500">
                  대표: {tenant.representative_name}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {tenant.short_intro}
              </p>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end gap-1 text-[11px] text-slate-500 shrink-0">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{tenant.road_address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{tenant.operating_hours}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            [3. 비디오/미디어 쇼룸 & 글래스모피즘 인터랙션 칩]
           ============================================================ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-600 text-white text-[10px] font-bold">
                ▶
              </span>
              <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                매장 쇼룸 & 현장 인터랙션
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">9:16 모바일 숏폼</span>
          </div>

          {/* 9:16 세로형 숏폼 비디오 컨테이너 */}
          <div className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200 group">
            {/* 비디오 엘리먼트 */}
            <video
              ref={videoRef}
              src={tenant.video_url}
              poster={tenant.video_poster}
              loop
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
            />

            {/* 어두운 비네팅 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

            {/* 상단 컨트롤러 (음소거 토글 & 뱃지) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10.5px] font-semibold border border-white/20">
                🏢 {tenant.name}
              </span>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer border border-white/20"
                title={isMuted ? "음소거 해제" : "음소거"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {/* 중앙 재생 버튼 (일시정지 상태일 때 표시) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-2xl transition-transform hover:scale-110 cursor-pointer z-10"
              >
                <Play className="h-7 w-7 ml-1 fill-white" />
              </button>
            )}

            {/* 하단 인터랙션 영역: 글래스모피즘 칩 2종 */}
            <div className="absolute bottom-4 left-3 right-3 z-10 space-y-2.5">
              <div className="text-white space-y-0.5 px-1">
                <p className="text-xs font-bold drop-shadow-sm">{tenant.name} 공식 쇼룸</p>
                <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed">
                  {tenant.short_intro}
                </p>
              </div>

              {/* 글래스모피즘 인터랙션 칩 2종 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 칩 1: [⚡ t.check 1초 현장 출퇴근] */}
                <button
                  type="button"
                  onClick={() => setActiveModal("TCHECK")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>⚡ t.check 출퇴근</span>
                </button>

                {/* 칩 2: [t.sign 간편 서약 체결] */}
                <button
                  type="button"
                  onClick={() => setActiveModal("TSIGN")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span>t.sign 간편 서약</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            [4. 링크픽(LinkPick) 실시간 연동 그리드]
           ============================================================ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-600 text-white text-[10px] font-bold">
                🔗
              </span>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                  사장님 추천 링크픽 (LinkPick)
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  t.note 데스크에서 실시간 활성화된 제휴·생필품 목록
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
              실시간 공개 {activeLinkpicks.length}건
            </span>
          </div>

          {activeLinkpicks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
              현재 사장님이 공개 설정한 링크픽 상품이 없습니다. t.note 스마트 데스크에서 상품을 활성화하세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeLinkpicks.map((item) => (
                <a
                  key={item.id}
                  href={item.affiliate_url || item.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs hover:shadow-sm hover:border-slate-400 transition-all text-xs"
                >
                  <div className="space-y-2">
                    <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnail_url || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80"}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9.5px] font-medium backdrop-blur-xs">
                        {item.item_type === "COUPANG" ? "쿠팡 특가" : "추천"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {item.display_price ? `₩${item.display_price.toLocaleString()}` : "특가 확인"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-indigo-600 font-semibold group-hover:underline">
                      <span>1초 담기</span>
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            [5. 티홈페이지 자체 구인 공고 섹션]
           ============================================================ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-600 text-white text-[10px] font-bold">
                💼
              </span>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                  {tenant.name} 로컬 채용 정보
                </h2>
                <span className="text-[10.5px] text-slate-400">
                  Today 로컬 구인 피드 자동 동기화
                </span>
              </div>
            </div>

            <Link
              href="/local"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
            >
              <span>동네 전체 구인 보기</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {jobPostings.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                      {job.salary_text}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                      {job.work_schedule}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      지원자 {job.applicant_count}명 접수 중
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                  <p className="text-[11.5px] text-slate-600 line-clamp-1">{job.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(job);
                      setActiveModal("JOB_APPLY");
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>1초 간편 지원</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            [6. 하단 M-FAD 수수료 진단 CTA 배너]
           ============================================================ */}
        <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 p-5 text-white shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold border border-white/10">
                <Sparkles className="h-3 w-3" />
                동료 소상공인 권익보호 센터
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white">
                우리 매장 숨은 카드 초과 수수료 10초 무료 진단 (M-FAD)
              </h3>
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                테이블오더, 키오스크, PG 결제대행 과오납 수수료 3개년 소급 환급 여부를 지금 즉시 진단해보세요.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("MFAD_DIAG")}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-amber-300 font-bold text-xs transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              <Calculator className="h-4 w-4 text-slate-900" />
              <span>10초 진단 시작</span>
            </button>
          </div>
        </section>
      </main>

      {/* ============================================================
          [모달 1: ⚡ t.check 1초 현장 출퇴근 팝업]
         ============================================================ */}
      {activeModal === "TCHECK" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-4 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
                ⚡
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  t.check 1초 현장 출퇴근 체크
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  {tenant.name} 지오펜스 (반경 50m) 실시간 연동
                </p>
              </div>
            </div>

            {/* GPS 현장 검증 상태 카드 */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>현장 지오펜스 반경 50m 이내 안착 확인</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                위치: {tenant.road_address} ({tenant.dong})
              </p>
              {checkStatus !== "IDLE" && (
                <div className="pt-1 text-[11px] font-semibold text-emerald-900 border-t border-emerald-200 mt-1">
                  최근 기록: {checkStatus === "CHECKED_IN" ? "출근 완료" : "퇴근 완료"} ({checkTimestamp})
                </div>
              )}
            </div>

            {/* 출근/퇴근 액션 버튼 */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleTCheckAction("CHECK_IN")}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span>☀️ 1초 출근 체크</span>
                <span className="text-[9.5px] text-emerald-100 font-normal">GPS 반경 50m 검증</span>
              </button>

              <button
                type="button"
                onClick={() => handleTCheckAction("CHECK_OUT")}
                className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span>🌙 1초 퇴근 체크</span>
                <span className="text-[9.5px] text-slate-400 font-normal">실시간 근무 마감</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              * 출결 내역은 사장님의 t.note 스마트 데스크 및 t.check 출근부에 24시간 암호화 동기화됩니다.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 2: 📜 t.sign 간편 서약 체결 팝업]
         ============================================================ */}
      {activeModal === "TSIGN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
                📜
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  t.sign 비대면 안심 표준 서약서
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  {tenant.name} 고객·근로자 표준 안심 서약
                </p>
              </div>
            </div>

            {/* 서약 약관 프리뷰 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] leading-relaxed space-y-2 max-h-48 overflow-y-auto">
              <p className="font-bold text-slate-900">[서약 내용]:</p>
              <p>1. 본 서약인은 {tenant.name}의 시설 이용 및 제반 규정을 성실히 준수하며, 상호 존중의 원칙을 지킵니다.</p>
              <p>2. 비급여 고지 및 개인정보 처리는 관계 법령에 따라 안전하게 보호되며 목적 외 이용되지 않습니다.</p>
              <p>3. 본 전자서명은 전자서명법에 의거하여 자필 서명과 동일한 법적 효력을 갖습니다.</p>
            </div>

            <form onSubmit={handleTSignSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  서명자 성함 (정자 입력):
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSigned}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSigned ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>서약 인장 날인 완료!</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 text-amber-400" />
                    <span>SHA-256 서명 인장 날인 및 제출</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 3: 💼 1초 간편 지원 팝업]
         ============================================================ */}
      {activeModal === "JOB_APPLY" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-xs">
                💼
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  {selectedJob?.title || "채용 공고"} 1초 간편 지원
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  {tenant.name} • {selectedJob?.salary_text}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitJobApply} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  지원자 성함:
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김지민"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  연락처 (휴대폰 번호):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="예: 010-1234-5678"
                  value={applyPhone}
                  onChange={(e) => setApplyPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  한 줄 소개 및 희망 근무 일정:
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 인근 거주하며 주 3회 성실히 근무 가능합니다."
                  value={applyIntro}
                  onChange={(e) => setApplyIntro(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>1초 간편 지원서 전송</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          [모달 4: 🧮 M-FAD 수수료 10초 무료 진단 팝업]
         ============================================================ */}
      {activeModal === "MFAD_DIAG" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl space-y-3.5 border border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs">
                🧮
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-950">
                  M-FAD 카드 초과 수수료 10초 무료 진단
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  여신금융협회 법정 영세·중소 우대요율 정합성 소명 시뮬레이터
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>매장 월 카드 매출액:</span>
                  <span className="text-indigo-600 font-mono">{monthlySales.toLocaleString()}만 원</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={15000}
                  step={100}
                  value={monthlySales}
                  onChange={(e) => setMonthlySales(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  주요 결제 방식:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "TABLE_ORDER", label: "테이블오더/PG" },
                    { id: "KIOSK", label: "무인 키오스크" },
                    { id: "POS", label: "일반 유선 단말기" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPosType(p.id)}
                      className={`py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
                        posType === p.id
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 진단 결과 카드 */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                <span className="text-[10.5px] text-amber-300 font-bold">
                  ★ 3개년 과오납 회수 예상액 시뮬레이션 결과
                </span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ₩{estimatedRefund.toLocaleString()} 원
                </div>
                <p className="text-[10.5px] text-slate-300 leading-relaxed">
                  PG 결제대행 우대요율(0.5%) 미적용으로 출혈 차감된 수수료를 8개 카드사 전산 소명을 통해 사업자 통장으로 직접 환급받으실 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  showToast("🚀 M-FAD 전담 서포터즈 무료 실사 방문 예약이 접수되었습니다!");
                  setActiveModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>소명 전담 서포터즈 무료 실사 신청 (착수금 0원)</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
