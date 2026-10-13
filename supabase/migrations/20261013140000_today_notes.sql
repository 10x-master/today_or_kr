-- 티노트(t.note) & 티단노트(t.단노트) 원클릭 고시 스크랩 및 일정 테이블
CREATE TABLE IF NOT EXISTS public.today_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    note_type VARCHAR(50) DEFAULT 'SCHEDULE',
    due_date DATE,
    linked_notice_id UUID,
    linked_kapt_code VARCHAR(30), -- 단지 티단노트 연동 시 kapt_code 매핑 (null이면 개인 티노트)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 개발/익명 접근 정책
ALTER TABLE public.today_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'today_notes' AND policyname = 'Allow public read today_notes'
    ) THEN
        CREATE POLICY "Allow public read today_notes" ON public.today_notes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'today_notes' AND policyname = 'Allow public insert today_notes'
    ) THEN
        CREATE POLICY "Allow public insert today_notes" ON public.today_notes FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'today_notes' AND policyname = 'Allow public update today_notes'
    ) THEN
        CREATE POLICY "Allow public update today_notes" ON public.today_notes FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'today_notes' AND policyname = 'Allow public delete today_notes'
    ) THEN
        CREATE POLICY "Allow public delete today_notes" ON public.today_notes FOR DELETE USING (true);
    END IF;
END $$;
