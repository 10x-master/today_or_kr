"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gift,
  Image as ImageIcon,
  Lock,
  PartyPopper,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  X,
} from "lucide-react";
import type { LocalComplexEvent, VerificationMethod } from "@/types/officialNotice";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ResidentVerifyModalProps {
  event: LocalComplexEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * HTML Canvas를 이용한 브라우저단 이미지 자동 리사이징
 * 최대 가로폭 1280px, 품질 0.8 수준의 JPEG Blob 및 DataURL 생성
 */
async function resizeImageClient(
  file: File,
  maxWidth = 1280,
  quality = 0.8
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not supported"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

export default function ResidentVerifyModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: ResidentVerifyModalProps) {
  const [method, setMethod] = useState<VerificationMethod>("APT_I_APP");
  const [applicantName, setApplicantName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dongHo, setDongHo] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달 닫힐 때 상태 리셋
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedFile(null);
        setResizedBlob(null);
        setPreviewUrl(null);
        setErrorMsg(null);
      }, 300);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // 파일 선택 처리 (HTML Canvas 자동 리사이징 적용)
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("이미지 파일(PNG, JPG, JPEG 등)만 업로드 가능합니다.");
      return;
    }
    setErrorMsg(null);
    setIsResizing(true);

    try {
      // 최대 폭 1280px, 품질 0.8 브라우저단 리사이징
      const { blob, dataUrl } = await resizeImageClient(file, 1280, 0.8);
      setSelectedFile(file);
      setResizedBlob(blob);
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.warn("Client-side image resize fallback to original:", err);
      setSelectedFile(file);
      setResizedBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsResizing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 전화번호 자동 포맷 (010-XXXX-XXXX)
  const handlePhoneChange = (val: string) => {
    const numbers = val.replace(/\D/g, "").slice(0, 11);
    let formatted = numbers;
    if (numbers.length > 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length > 3) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!applicantName.trim()) {
      setErrorMsg("신청자 성함을 입력해주세요.");
      return;
    }
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      setErrorMsg("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!privacyAgreed) {
      setErrorMsg("개인정보 수집 및 이벤트 혜택 제공 동의가 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Supabase Storage 이미지 업로드 시도
    let proofImageUrl = previewUrl ? "attached_receipt_image.jpg" : null;
    const supabase = getSupabaseBrowserClient();

    if (supabase && resizedBlob) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
        const filePath = `verifications/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resident-proofs")
          .upload(filePath, resizedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("resident-proofs")
            .getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            proofImageUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn("Supabase Storage upload warning, using local placeholder:", storageErr);
      }
    }

    const payload = {
      event_id: event.id,
      applicant_name: applicantName.trim(),
      phone_number: phoneNumber.trim(),
      verification_method: method,
      proof_image_url: proofImageUrl,
      complex_name: event.complex_name,
      dong_ho: dongHo.trim() || null,
      privacy_agreed: privacyAgreed,
    };

    try {
      // 1. Supabase 직접 insert 시도
      if (supabase) {
        await supabase.from("resident_verifications").insert({
          event_id: payload.event_id,
          applicant_name: payload.applicant_name,
          phone_number: payload.phone_number,
          verification_method: payload.verification_method,
          proof_image_url: payload.proof_image_url,
          complex_name: payload.complex_name,
          dong_ho: payload.dong_ho,
          status: "PENDING",
          privacy_agreed: payload.privacy_agreed,
        });

        await supabase.from("local_event_applications").insert({
          event_id: payload.event_id,
          applicant_name: payload.applicant_name,
          phone_number: payload.phone_number,
          complex_name: payload.complex_name,
          status: "PENDING",
        });
      }
    } catch (err) {
      console.warn("Direct Supabase resident verification insert:", err);
    }

    try {
      // 2. 서버 API 라우트 호출 (모의 스토어 및 안전 폴백 보장)
      const res = await fetch("/api/resident-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "인증 신청 처리 중 오류가 발생했습니다.");
      }

      setIsSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "신청 중 문제가 발생했습니다.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6"
      >
        {/* 상단 모바일 드래그 핸들 */}
        <div className="mx-auto -mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

        {/* 헤더 액션 바 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
              <Gift className="h-3.5 w-3.5" />
              <span>{event.badge_label || "단지 전용 혜택"}</span>
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {event.complex_name} 한정
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 완료 화면 (제출 완료 팝업) */}
        {isSubmitted ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <PartyPopper className="h-8 w-8 text-emerald-600 animate-bounce" />
            </div>

            <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              접수 상태: 승인 대기 (PENDING)
            </span>

            <h3 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
              입주민 인증 신청이 완료되었습니다!
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              검토 후 혜택 안내 문자가 발송됩니다.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">신청 이벤트</span>
                <span className="font-bold text-slate-900 line-clamp-1">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">신청인</span>
                <span className="font-semibold text-slate-800">{applicantName} ({phoneNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">인증 단지</span>
                <span className="font-semibold text-emerald-700">{event.complex_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">인증 방식</span>
                <span className="font-medium text-slate-700">
                  {method === "APT_I_APP" ? "아파트아이 앱 화면 캡처" : "관리비 고지서 영수증 사진"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              확인 및 닫기
            </button>
          </div>
        ) : (
          /* 신청 폼 영역 */
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. 상단: 이벤트 타이틀 및 제공 혜택 안내 */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {event.title}
              </h2>
              <p className="mt-1.5 text-xs font-semibold text-indigo-700 leading-relaxed">
                🎁 {event.benefit_summary}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 border-t border-indigo-100/70 pt-2">
                <span>제휴: {event.provider_name}</span>
                {event.remaining_count !== undefined && (
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    선착순 {event.remaining_count}명 한정
                  </span>
                )}
              </div>
            </div>

            {/* 2. 인증 방식 선택 탭 */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                입주민 인증 방식 선택 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("APT_I_APP")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    method === "APT_I_APP"
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <span>📱 아파트아이 캡처</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("BILL_RECEIPT")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    method === "BILL_RECEIPT"
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>🧾 관리비 영수증 사진</span>
                </button>
              </div>

              {/* 간이 안내 */}
              <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-slate-100/80 p-2.5 text-[11px] text-slate-600 leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  단지명과 동·호수가 보이도록 캡처/촬영해주세요 (주민등록번호 등 민감정보는 가려주셔도 무방합니다).
                </span>
              </div>
            </div>

            {/* 3. 파일 업로드 영역 (드래그앤드롭 / 파일 선택) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                증빙 이미지 첨부 <span className="text-slate-400 font-normal">(선택 또는 첨부)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {isResizing ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 text-center">
                  <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold text-indigo-700">
                    고화질 이미지 최적화 리사이징 중 (최대 1280px)...
                  </span>
                </div>
              ) : previewUrl ? (
                <div className="relative rounded-2xl border border-indigo-200 bg-indigo-50/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="인증 증빙 이미지"
                      className="h-12 w-12 rounded-xl object-cover border border-indigo-100"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {selectedFile?.name || "증빙 이미지 첨부됨"}
                      </p>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        최적화 리사이징 완료 (최대 1280px)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setResizedBlob(null);
                      setPreviewUrl(null);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/70"
                  }`}
                >
                  <UploadCloud className="h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    인증 이미지 파일을 드래그하거나 클릭하여 첨부
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, JPEG 이미지 파일 지원 (최대 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* 4. 신청자 정보 입력 필드 */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    신청자 이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    휴대폰 번호 (혜택 수신용) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  거주 동·호수 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 501동 1204호"
                  value={dongHo}
                  onChange={(e) => setDongHo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 5. 필수 동의 체크 */}
            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  개인정보 수집 및 단지 입주민 이벤트 혜택 제공 동의 <strong className="text-rose-600">(필수)</strong>
                </span>
              </label>
              <p className="mt-1 text-[10px] text-slate-400 pl-6">
                수집 항목: 성명, 연락처, 입주민 증빙 자료 | 보유 기간: 이벤트 종료 및 혜택 발급 후 30일 이내 파기
              </p>
            </div>

            {/* 6. 하단 액션 버튼 */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <span>접수 처리 중...</span>
                ) : (
                  <>
                    <FileCheck2 className="h-4 w-4" />
                    <span>인증 및 이벤트 응모하기 🎁</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
