-- ==============================================================================
-- PWA 앱 아이콘 교체 (today. 공식 신규 로고 + 캐시 버전 갱신)
-- ==============================================================================

UPDATE public.app_pwa_settings
SET
  icon_192_url = '/icons/today-192.png?v=2',
  icon_512_url = '/icons/today-512.png?v=2',
  updated_at = NOW()
WHERE app_target = 'TODAY_MAIN';
