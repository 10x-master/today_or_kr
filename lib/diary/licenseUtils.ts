import type { DiaryBrand, DiaryLicenseStatus } from "@/types/diary";

export interface DiaryLicenseBadgeInfo {
  status: DiaryLicenseStatus;
  /** 만료일까지 남은 일수 (음수면 이미 만료). valid_until 미설정 시 null */
  daysLeft: number | null;
  /** 만료/정지 상태 — 신규 일정·게시글 등록이 막히는 읽기 전용 가드 */
  isReadOnly: boolean;
  /** 만료 30일 이내 갱신 유도 배너 노출 여부 */
  showRenewalBanner: boolean;
}

/**
 * 다이어리(제공자)의 라이선스 상태를 판정한다.
 * license_status/valid_until이 설정되지 않은 레거시 레코드는 ACTIVE·무제한으로 간주한다.
 */
export function getLicenseBadgeInfo(brand: Pick<DiaryBrand, "license_status" | "valid_until">): DiaryLicenseBadgeInfo {
  const status: DiaryLicenseStatus = brand.license_status || "ACTIVE";
  const validUntil = brand.valid_until ? new Date(brand.valid_until) : null;
  const daysLeft = validUntil ? Math.ceil((validUntil.getTime() - Date.now()) / 86400000) : null;

  const isReadOnly = status === "EXPIRED" || status === "SUSPENDED" || (daysLeft !== null && daysLeft < 0);
  const showRenewalBanner =
    !isReadOnly && (status === "ACTIVE" || status === "GRACE_PERIOD") && daysLeft !== null && daysLeft <= 30;

  return { status, daysLeft, isReadOnly, showRenewalBanner };
}
