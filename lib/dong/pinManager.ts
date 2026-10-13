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
      created_at: "2026-10-13T00:00:00.000Z",
    },
    {
      id: `pin-${userId}-junggye`,
      user_id: userId,
      dong_name: "중계동",
      pin_type: "VERIFIED",
      is_primary: false,
      created_at: "2026-10-13T00:00:00.000Z",
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

/** 전국 주요 행정동·읍·면 사전 데이터 */
export const NATIONWIDE_DONGS: Array<{
  sido: string;
  gugun: string;
  dong: string;
  lat: number;
  lng: number;
}> = [
  { sido: "서울특별시", gugun: "노원구", dong: "상계동", lat: 37.6598, lng: 127.0774 },
  { sido: "서울특별시", gugun: "노원구", dong: "중계동", lat: 37.6496, lng: 127.0768 },
  { sido: "서울특별시", gugun: "노원구", dong: "하계동", lat: 37.6364, lng: 127.0682 },
  { sido: "서울특별시", gugun: "노원구", dong: "공릉동", lat: 37.6258, lng: 127.0728 },
  { sido: "서울특별시", gugun: "노원구", dong: "월계동", lat: 37.6225, lng: 127.0583 },
  { sido: "서울특별시", gugun: "강남구", dong: "역삼동", lat: 37.5006, lng: 127.0365 },
  { sido: "서울특별시", gugun: "강남구", dong: "대치동", lat: 37.4946, lng: 127.0628 },
  { sido: "서울특별시", gugun: "서초구", dong: "반포동", lat: 37.5042, lng: 127.0051 },
  { sido: "서울특별시", gugun: "마포구", dong: "상암동", lat: 37.5776, lng: 126.8916 },
  { sido: "서울특별시", gugun: "송파구", dong: "잠실동", lat: 37.5133, lng: 127.0982 },
  { sido: "경기도", gugun: "성남시 분당구", dong: "정자동", lat: 37.3664, lng: 127.1082 },
  { sido: "경기도", gugun: "고양시 일산동구", dong: "마두동", lat: 37.6521, lng: 126.7774 },
  { sido: "경기도", gugun: "수원시 영통구", dong: "이의동", lat: 37.2965, lng: 127.0475 },
  { sido: "경기도", gugun: "파주시", dong: "문산읍", lat: 37.8589, lng: 126.7842 },
  { sido: "인천광역시", gugun: "연수구", dong: "송도동", lat: 37.3888, lng: 126.6534 },
  { sido: "전라남도", gugun: "여수시", dong: "돌산읍", lat: 34.6797, lng: 127.7483 },
  { sido: "부산광역시", gugun: "해운대구", dong: "우동", lat: 35.1631, lng: 129.1384 },
  { sido: "대구광역시", gugun: "수성구", dong: "범어동", lat: 35.8588, lng: 128.6254 },
  { sido: "제주특별자치도", gugun: "서귀포시", dong: "안덕면", lat: 33.2505, lng: 126.3314 },
  { sido: "강원특별자치도", gugun: "춘천시", dong: "신북읍", lat: 37.9348, lng: 127.7532 },
];

/**
 * 전국 동/읍/면 검색 헬퍼
 */
export function searchAllDongs(query: string) {
  const clean = query.trim().toLowerCase();
  if (!clean) return NATIONWIDE_DONGS.slice(0, 8);
  return NATIONWIDE_DONGS.filter(
    (d) =>
      d.dong.toLowerCase().includes(clean) ||
      d.gugun.toLowerCase().includes(clean) ||
      d.sido.toLowerCase().includes(clean)
  );
}

/**
 * 최고관리자 전역 검색 워프 또는 사용자 동네 핀 즉시 전환
 */
export function warpToDong(
  dongName: string,
  user?: AuthProfile | null
): { success: boolean; message: string; pin?: UserDongPin } {
  const userId = user?.id || "guest";
  const superAdmin = isSuperAdmin(user);
  const cleanDong = dongName.trim();

  // 최고관리자는 슬롯 제한 없이 전역 전국 동네 워프 즉시 허용
  if (superAdmin) {
    const currentPins = getUserDongPins(userId);
    let targetPin = currentPins.find((p) => p.dong_name === cleanDong);

    if (!targetPin) {
      targetPin = {
        id: `pin-${userId}-${Date.now()}`,
        user_id: userId,
        dong_name: cleanDong,
        pin_type: "VERIFIED",
        is_primary: true,
        created_at: new Date().toISOString(),
      };
      saveUserDongPins([targetPin, ...currentPins], userId);
    } else {
      setPrimaryDongPin(targetPin.id, userId);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("today_admin_warp", {
          detail: { dongName: cleanDong, userId },
        })
      );
    }

    return {
      success: true,
      message: `[최고관리자] ${cleanDong}(으)로 전역 워프 완료 (슬롯 무제한).`,
      pin: targetPin,
    };
  }

  // 일반 사용자는 기존 addDongPin 슬롯 정책 준수
  return addDongPin(cleanDong, user);
}
