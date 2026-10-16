-- ==============================================================================
-- t.다이어리 & t.note 지류 결합 솔루션: 발행 브랜드 및 공식 행사 일정 테이블
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_slug TEXT UNIQUE NOT NULL,   -- URL 쿼리 파라미터 ?brand=xxx 식별자
    brand_name TEXT NOT NULL,
    logo_url TEXT,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.diary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,     -- 공개 행사 여부 (캘린더 마커 노출)
    send_alimtalk BOOLEAN DEFAULT FALSE -- 카카오 알림톡 발송 대상 여부
);

CREATE INDEX IF NOT EXISTS idx_diary_events_diary_id ON public.diary_events(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_events_event_date ON public.diary_events(event_date);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diaries" ON public.diaries;
CREATE POLICY "allow_public_select_diaries"
    ON public.diaries
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "allow_public_select_diary_events" ON public.diary_events;
CREATE POLICY "allow_public_select_diary_events"
    ON public.diary_events
    FOR SELECT
    USING (is_public = true);

-- 기본 예시 브랜드 시드
INSERT INTO public.diaries (brand_slug, brand_name, logo_url, contact_info)
VALUES
  ('donghwa-av', '동화에이브이', NULL, '02-1234-5678'),
  ('sme-transform', '중소기업사업전환지원단', NULL, '1661-0783')
ON CONFLICT (brand_slug) DO NOTHING;

-- 기본 예시 공식 행사 일정 시드
INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk)
SELECT d.id, v.title, v.description, v.event_date::DATE, v.is_public, v.send_alimtalk
FROM (
  VALUES
    ('donghwa-av', '2027 스마트 다이어리 신년 배포 행사', '전국 대리점 대상 2027 스마트 다이어리 신제품 배포 및 활용 설명회', '2027-01-05', true, true),
    ('donghwa-av', '설 연휴 고객센터 운영 안내', '설 연휴 기간 고객센터 운영시간 단축 안내', '2027-02-06', true, false),
    ('sme-transform', '중소기업 사업전환 지원사업 설명회', '2027년도 사업전환 지원사업 공고 및 신청 절차 설명회', '2027-01-15', true, true),
    ('sme-transform', '사업전환계획 승인 신청 마감', '1차 사업전환계획 승인 신청 접수 마감일', '2027-01-31', true, true)
) AS v(brand_slug, title, description, event_date, is_public, send_alimtalk)
JOIN public.diaries d ON d.brand_slug = v.brand_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = v.title
);
