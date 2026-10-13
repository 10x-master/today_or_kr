"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { AuthProfile, UserDongPin } from "@/types/auth";
import {
  BASE_PIN_SLOTS,
  MAX_PIN_SLOTS,
  getMaxSlotsForScore,
  getNextSlotGoal,
  getUserDongPins,
  isSuperAdmin,
  removeDongPin,
  setPrimaryDongPin,
} from "@/lib/dong/pinManager";

interface DongPinSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthProfile | null;
  currentDong: string;
  onSelectDong: (dong: string) => void;
  onOpenSearch: () => void;
}

export default function DongPinSheet({
  isOpen,
  onClose,
  currentUser,
  currentDong,
  onSelectDong,
  onOpenSearch,
}: DongPinSheetProps) {
  const router = useRouter();
  const [pins, setPins] = useState<UserDongPin[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const superAdmin = isSuperAdmin(currentUser);
  const activityScore = currentUser?.activity_score || 0;
  const maxSlots = superAdmin ? 999 : getMaxSlotsForScore(activityScore);
  const nextGoal = getNextSlotGoal(activityScore);

  const syncPins = () => {
    const p = getUserDongPins(currentUser?.id || "guest");
    setPins(p);
  };

  useEffect(() => {
    if (isOpen) {
      syncPins();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setMessage(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentUser]);

  // 외부 변경 이벤트 리스너
  useEffect(() => {
    const handlePinsChange = () => syncPins();
    window.addEventListener("today_pins_changed", handlePinsChange);
    return () => window.removeEventListener("today_pins_changed", handlePinsChange);
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSelect = (dong: string) => {
    onSelectDong(dong);
    onClose();
    router.push(`/${encodeURIComponent(dong)}`);
  };

  const handleSetPrimary = (e: React.MouseEvent, pinId: string, dong: string) => {
    e.stopPropagation();
    const updated = setPrimaryDongPin(pinId, currentUser?.id || "guest");
    setPins(updated);
    setMessage(`'${dong}'이(가) 대표 동네로 설정되었습니다.`);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleRemove = (e: React.MouseEvent, pinId: string, dong: string) => {
    e.stopPropagation();
    const res = removeDongPin(pinId, currentUser?.id || "guest");
    if (res.success) {
      syncPins();
      setMessage(res.message);
      setTimeout(() => setMessage(null), 2500);
    } else {
      setMessage(res.message);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* 바깥 딤 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 바텀시트 컨테이너 (max-w-md 정렬) */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* 상단 드래그 핸들 */}
        <div className="pt-2.5 pb-1 flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 안내 메시지 토스트 */}
        {message && (
          <div className="mx-4 my-1 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-md animate-in slide-in-from-top-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900">내 동네 핀 관리</h2>
              {superAdmin && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300">
                  <Crown className="h-3 w-3 text-amber-600 fill-amber-500" />
                  <span>최고관리자</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              자주 찾는 동네를 핀으로 꽂아두고 원클릭으로 전환하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 슬롯 현황 & 활동 점수 가이드 */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              <span>사용 중인 핀 슬롯:</span>
              <span className="text-amber-600 font-black">
                {pins.length} / {superAdmin ? "무제한" : `${maxSlots}개`}
              </span>
            </div>

            {!superAdmin && (
              <span className="text-[11px] font-semibold text-slate-400">
                활동점수 {activityScore}P
              </span>
            )}
          </div>

          {!superAdmin && nextGoal && (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-amber-50/80 border border-amber-200/60 p-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                <span>
                  {nextGoal.neededScore}P 더 모으면 {nextGoal.nextSlot}번째 슬롯 해금!
                </span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">
                (최대 {MAX_PIN_SLOTS}개)
              </span>
            </div>
          )}

          {superAdmin && (
            <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-100/70 border border-amber-300 p-2 text-[11px] text-amber-900 font-bold">
              <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              <span>전국 모든 동네를 핀 제한 없이 즉시 검색하고 모니터링할 수 있습니다.</span>
            </div>
          )}
        </div>

        {/* 등록된 핀 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {pins.map((pin) => {
            const isCurrent = pin.dong_name === currentDong;
            return (
              <div
                key={pin.id}
                onClick={() => handleSelect(pin.dong_name)}
                className={`group flex items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer ${
                  isCurrent
                    ? "border-amber-400 bg-amber-50/60 shadow-2xs"
                    : "border-slate-200/80 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${
                      isCurrent
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">
                        {pin.dong_name}
                      </span>
                      {pin.is_primary && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 border border-amber-200">
                          대표동네
                        </span>
                      )}
                      {pin.pin_type === "BONUS" && (
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          해금슬롯
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isCurrent ? "현재 활성화된 피드" : "터치하여 이 동네로 이동"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!pin.is_primary && (
                    <button
                      type="button"
                      onClick={(e) => handleSetPrimary(e, pin.id, pin.dong_name)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      대표 설정
                    </button>
                  )}
                  {pins.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, pin.id, pin.dong_name)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="핀 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isCurrent && (
                    <div className="flex h-6 w-6 items-center justify-center text-amber-600 font-bold">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 새 동네 핀 추가 버튼 */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-2">
          {(superAdmin || pins.length < maxSlots) ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.99] transition-all shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>새 동네 검색 및 핀 추가 ({pins.length}/{superAdmin ? "∞" : maxSlots})</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs font-bold text-slate-600">
                등록 가능한 모든 핀 슬롯을 사용 중입니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="mt-1.5 text-xs font-bold text-amber-600 hover:underline"
              >
                타 지역 둘러보기 (검색창 열기) →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
