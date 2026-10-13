-- 티노트(t.note) 구글 캘린더 OAuth 토큰 및 연동 관리 테이블
CREATE TABLE IF NOT EXISTS public.user_google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL UNIQUE,          -- 티노트 사용자 ID (예: 'user-001')
    email VARCHAR(255),                            -- 연동된 구글 계정 이메일
    access_token TEXT NOT NULL,                    -- Google OAuth Access Token
    refresh_token TEXT,                            -- Google OAuth Refresh Token
    scope TEXT,                                    -- 허용된 권한 범위
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expiry_date BIGINT,                            -- 토큰 만료 타임스탬프 (ms)
    is_active BOOLEAN DEFAULT TRUE,                -- 연동 활성화 여부
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.user_google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_google_calendar_tokens' AND policyname = 'Allow public select google tokens') THEN
        CREATE POLICY "Allow public select google tokens" ON public.user_google_calendar_tokens FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_google_calendar_tokens' AND policyname = 'Allow public insert google tokens') THEN
        CREATE POLICY "Allow public insert google tokens" ON public.user_google_calendar_tokens FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_google_calendar_tokens' AND policyname = 'Allow public update google tokens') THEN
        CREATE POLICY "Allow public update google tokens" ON public.user_google_calendar_tokens FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_google_calendar_tokens' AND policyname = 'Allow public delete google tokens') THEN
        CREATE POLICY "Allow public delete google tokens" ON public.user_google_calendar_tokens FOR DELETE USING (true);
    END IF;
END $$;
