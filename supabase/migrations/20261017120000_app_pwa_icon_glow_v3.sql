-- ==============================================================================
-- PWA 모바일 앱 아이콘 v3 (옐로우/골드 발광 링 + 확대된 't' + 캐시 버전 갱신)
-- ==============================================================================

UPDATE public.app_pwa_settings
SET
  icon_192_url = '/icons/today-192.png?v=3',
  icon_512_url = '/icons/today-512.png?v=3',
  updated_at = NOW()
WHERE app_target = 'TODAY_MAIN';
