-- 아파트링크 입주민 인증 이벤트 및 응모 관리 테이블
CREATE TABLE IF NOT EXISTS public.local_complex_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complex_name VARCHAR(100) NOT NULL,            -- 대상 아파트 단지명 (예: 상계주공 5단지)
    kapt_code VARCHAR(30),                         -- 국토부 공동주택 관리코드 (예: A113501050)
    district_code VARCHAR(10) NOT NULL,            -- 법정동 코드 (예: 1135010500)
    title VARCHAR(255) NOT NULL,                   -- 이벤트 타이틀
    badge_label VARCHAR(50) DEFAULT '단지 전용 혜택',
    benefit_summary TEXT NOT NULL,                 -- 제공 혜택 요약
    provider_name VARCHAR(100) NOT NULL,           -- 제휴 업체명 (피트니스, 마트, 학원 등)
    valid_until DATE,                              -- 유효 기간
    remaining_count INT DEFAULT 50,                -- 잔여 선착순 인원
    image_url TEXT,                                -- 대표 이미지
    is_active BOOLEAN DEFAULT true,                -- 진행 여부
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 입주민 인증 신청 테이블 (resident_verifications)
CREATE TABLE IF NOT EXISTS public.resident_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.local_complex_events(id) ON DELETE SET NULL,
    applicant_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    verification_method VARCHAR(30) NOT NULL,      -- 'APT_I_APP'(아파트아이 앱 캡처), 'BILL_RECEIPT'(관리비 고지서)
    proof_image_url TEXT,                          -- 인증 증빙 이미지 URL
    complex_name VARCHAR(100) NOT NULL,            -- 인증 대상 단지명
    dong_ho VARCHAR(50),                           -- 동/호수 (선택)
    status VARCHAR(20) DEFAULT 'PENDING',          -- 'PENDING'(접수), 'APPROVED'(승인), 'REJECTED'(반려)
    privacy_agreed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로컬 이벤트 응모 목록 (local_event_applications)
CREATE TABLE IF NOT EXISTS public.local_event_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.local_complex_events(id) ON DELETE CASCADE,
    verification_id UUID REFERENCES public.resident_verifications(id) ON DELETE SET NULL,
    applicant_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    complex_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',          -- 'PENDING', 'CONFIRMED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정 (공개 접근 및 익명 insert 허용)
ALTER TABLE public.local_complex_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_event_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'local_complex_events' AND policyname = 'Allow public read local_complex_events') THEN
        CREATE POLICY "Allow public read local_complex_events" ON public.local_complex_events FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resident_verifications' AND policyname = 'Allow public insert resident_verifications') THEN
        CREATE POLICY "Allow public insert resident_verifications" ON public.resident_verifications FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resident_verifications' AND policyname = 'Allow public select resident_verifications') THEN
        CREATE POLICY "Allow public select resident_verifications" ON public.resident_verifications FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'local_event_applications' AND policyname = 'Allow public insert local_event_applications') THEN
        CREATE POLICY "Allow public insert local_event_applications" ON public.local_event_applications FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'local_event_applications' AND policyname = 'Allow public select local_event_applications') THEN
        CREATE POLICY "Allow public select local_event_applications" ON public.local_event_applications FOR SELECT USING (true);
    END IF;
END $$;
