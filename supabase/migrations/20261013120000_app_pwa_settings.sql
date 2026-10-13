-- ==============================================================================
-- PWA 앱 설정 및 아이콘 관리 테이블 마이그레이션
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_pwa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_target VARCHAR(30) UNIQUE NOT NULL, -- 'TODAY_MAIN', 'TODAY_NOTE'
    app_name VARCHAR(50) NOT NULL,
    short_name VARCHAR(30) NOT NULL,
    start_url VARCHAR(100) NOT NULL,
    icon_192_url TEXT NOT NULL,             -- 관리자가 등록한 192x192 아이콘
    icon_512_url TEXT NOT NULL,             -- 관리자가 등록한 512x512 아이콘
    theme_color VARCHAR(20) DEFAULT '#FFFFFF',
    background_color VARCHAR(20) DEFAULT '#FFFFFF',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.app_pwa_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_app_pwa_settings" ON public.app_pwa_settings;
CREATE POLICY "allow_public_select_app_pwa_settings" 
    ON public.app_pwa_settings 
    FOR SELECT 
    USING (true);

-- 초기 기본 아이콘 세팅
INSERT INTO public.app_pwa_settings (app_target, app_name, short_name, start_url, icon_192_url, icon_512_url)
VALUES
(
  'TODAY_MAIN', 
  'Today - 로컬 팩트 미디어', 
  'Today', 
  '/', 
  '/icons/today-192.png', 
  '/icons/today-512.png'
),
(
  'TODAY_NOTE', 
  'Today Note - 업무일지 & 워크OS', 
  'Today Note', 
  '/workspace', 
  '/icons/todaynote-192.png', 
  '/icons/todaynote-512.png'
)
ON CONFLICT (app_target) DO NOTHING;
