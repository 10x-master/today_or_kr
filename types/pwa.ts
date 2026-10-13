/**
 * PWA 앱 설정 및 아이콘 관리 타입 정의
 * 테이블: app_pwa_settings
 */

export type AppPwaTarget = "TODAY_MAIN" | "TODAY_NOTE";

export interface AppPwaSetting {
  id?: string;
  app_target: AppPwaTarget;
  app_name: string;
  short_name: string;
  start_url: string;
  icon_192_url: string;
  icon_512_url: string;
  theme_color?: string;
  background_color?: string;
  updated_at?: string;
}
