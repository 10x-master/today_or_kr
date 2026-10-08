/**
 * 아직 로그인/세션 체계가 없어 10X 마이페이지는 고정된 데모 계정을 사용합니다.
 * user-003(최상계, 상계동)은 user-001(박노원)의 1단계 하위 추천인으로 시드되어 있어,
 * 가상 실적 트리거 클릭 시 상위 추천인에게 수당이 적립되는 흐름을 바로 확인할 수 있습니다.
 */
export const DEMO_USER_ID = "user-003";

export const DEMO_USER_NAMES: Record<string, string> = {
  "user-001": "박노원",
  "user-002": "이돌산",
  "user-003": "최상계",
};

export function displayUserName(userId: string): string {
  return DEMO_USER_NAMES[userId] ?? userId;
}
