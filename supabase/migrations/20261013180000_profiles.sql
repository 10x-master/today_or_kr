-- 사용자 프로필 테이블 (카카오 OAuth 연동 및 Supabase Auth profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(30) DEFAULT 'USER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public read profiles') THEN
        CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow insert profiles') THEN
        CREATE POLICY "Allow insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow update profiles') THEN
        CREATE POLICY "Allow update profiles" ON public.profiles FOR UPDATE USING (true);
    END IF;
END $$;
