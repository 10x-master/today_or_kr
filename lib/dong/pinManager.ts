import type { AuthProfile, UserDongPin } from "@/types/auth";

export const BASE_PIN_SLOTS = 2; // 기본 인증 슬롯
export const MAX_PIN_SLOTS = 5;  // 최대 해금 슬롯

/**
 * 사용자 활동 점수(activity_score)에 따른 최대 핀 슬롯 계산
 * - 기본 2개 슬롯
 * - 100점 이상: +1 (총 3개)
 * - 300점 이상: +2 (총 4개)
 * - 500점 이상: +3 (총 5개 최대)
 */
export function getMaxSlotsForScore(activityScore: number = 0): number {
  if (activityScore >= 500) return 5;
  if (activityScore >= 300) return 4;
  if (activityScore >= 100) return 3;
  return BASE_PIN_SLOTS;
}

/**
 * 다음 슬롯 해금까지 필요한 점수 계산
 */
export function getNextSlotGoal(activityScore: number = 0): {
  nextSlot: number;
  neededScore: number;
  currentScore: number;
} | null {
  if (activityScore >= 500) return null; // 최대치 달성
  if (activityScore >= 300) {
    return { nextSlot: 5, neededScore: 500 - activityScore, currentScore: activityScore };
  }
  if (activityScore >= 100) {
    return { nextSlot: 4, neededScore: 300 - activityScore, currentScore: activityScore };
  }
  return { nextSlot: 3, neededScore: 100 - activityScore, currentScore: activityScore };
}

/**
 * 최고관리자 여부 판별
 */
export function isSuperAdmin(user?: AuthProfile | null): boolean {
  if (!user) return false;
  return user.role === "SUPER_ADMIN" || user.email?.includes("admin@today.or.kr") === true;
}

/**
 * 기본 목 핀 데이터 생성 (최초 방문 또는 로그인 시)
 */
export function getDefaultPins(userId: string = "guest"): UserDongPin[] {
  return [
    {
      id: `pin-${userId}-sanggye`,
      user_id: userId,
      dong_name: "상계동",
      pin_type: "VERIFIED",
      is_primary: true,
      created_at: new Date().toISOString(),
    },
    {
      id: `pin-${userId}-junggye`,
      user_id: userId,
      dong_name: "중계동",
      pin_type: "VERIFIED",
      is_primary: false,
      created_at: new Date().toISOString(),
    },
  ];
}

const STORAGE_KEY_PREFIX = "today_user_dong_pins_";

/**
 * 사용자 동네 핀 목록 조회
 */
export function getUserDongPins(userId: string = "guest"): UserDongPin[] {
  if (typeof window === "undefined") return getDefaultPins(userId);

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed: UserDongPin[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load user pins from localStorage:", err);
  }

  // 초기값이 없으면 기본 2개 핀 생성 및 저장
  const defaults = getDefaultPins(userId);
  saveUserDongPins(defaults, userId);
  return defaults;
}

/**
 * 사용자 동네 핀 저장 및 이벤트 브로드캐스트
 */
export function saveUserDongPins(pins: UserDongPin[], userId: string = "guest"): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(pins));
    window.dispatchEvent(
      new CustomEvent("today_pins_changed", {
        detail: { userId, pins },
      })
    );
  } catch (err) {
    console.warn("Failed to save user pins:", err);
  }
}

/**
 * 신규 동네 핀 추가
 */
export function addDongPin(
  dongName: string,
  user?: AuthProfile | null
): { success: boolean; message: string; pin?: UserDongPin } {
  const userId = user?.id || "guest";
  const currentPins = getUserDongPins(userId);
  const cleanDong = dongName.trim();

  // 이미 핀으로 등록되어 있는지 검사
  if (currentPins.some((p) => p.dong_name === cleanDong)) {
    return {
      success: false,
      message: `이미 내 핀 목록에 등록된 동네입니다 (${cleanDong}).`,
    };
  }

  const superAdmin = isSuperAdmin(user);
  const maxSlots = superAdmin ? 999 : getMaxSlotsForScore(user?.activity_score || 0);

  if (!superAdmin && currentPins.length >= maxSlots) {
    const nextGoal = getNextSlotGoal(user?.activity_score || 0);
    const goalMsg = nextGoal
      ? `활동 점수 ${nextGoal.neededScore}점을 더 모으면 다음 슬롯(${nextGoal.nextSlot}번째)이 해금됩니다.`
      : "최대 5개 핀 슬롯을 모두 사용 중입니다.";
    return {
      success: false,
      message: `등록 가능한 동네 핀 슬롯(${maxSlots}개)이 가득 찼습니다. ${goalMsg}`,
    };
  }

  const isFirst = currentPins.length === 0;
  const newPin: UserDongPin = {
    id: `pin-${userId}-${Date.now()}`,
    user_id: userId,
    dong_name: cleanDong,
    pin_type: currentPins.length < BASE_PIN_SLOTS ? "VERIFIED" : "BONUS",
    is_primary: isFirst,
    created_at: new Date().toISOString(),
  };

  const updated = [...currentPins, newPin];
  saveUserDongPins(updated, userId);

  return {
    success: true,
    message: `${cleanDong}이(가) 내 동네 핀에 등록되었습니다.`,
    pin: newPin,
  };
}

/**
 * 동네 핀 삭제
 */
export function removeDongPin(
  pinId: string,
  userId: string = "guest"
): { success: boolean; message: string } {
  const currentPins = getUserDongPins(userId);

  if (currentPins.length <= 1) {
    return {
      success: false,
      message: "최소 1개의 동네 핀은 유지되어야 합니다.",
    };
  }

  const target = currentPins.find((p) => p.id === pinId);
  if (!target) {
    return { success: false, message: "삭제할 핀을 찾을 수 없습니다." };
  }

  let updated = currentPins.filter((p) => p.id !== pinId);

  // 삭제된 핀이 대표(is_primary)였다면 첫 번째 핀을 대표로 변경
  if (target.is_primary && updated.length > 0) {
    updated = updated.map((p, idx) => ({
      ...p,
      is_primary: idx === 0,
    }));
  }

  saveUserDongPins(updated, userId);
  return {
    success: true,
    message: `${target.dong_name} 핀이 삭제되었습니다.`,
  };
}

/**
 * 대표(Primary) 동네 핀 설정
 */
export function setPrimaryDongPin(pinId: string, userId: string = "guest"): UserDongPin[] {
  const currentPins = getUserDongPins(userId);
  const updated = currentPins.map((p) => ({
    ...p,
    is_primary: p.id === pinId,
  }));
  saveUserDongPins(updated, userId);
  return updated;
}
