-- ==============================================================================
-- t.다이어리 포털 고도화: 제공자 승인/카테고리/지역, 행사 미디어, 유저 구독
-- ==============================================================================

-- 1. diaries 테이블 확장
ALTER TABLE public.diaries
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (approval_status IN ('APPROVED', 'PENDING', 'CONDITIONAL')),
  ADD COLUMN IF NOT EXISTS provider_type TEXT NOT NULL DEFAULT 'LOCAL_BIZ'
    CHECK (provider_type IN ('ENTERPRISE', 'LOCAL_BIZ', 'PUBLIC', 'CREATOR')),
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel TEXT;

-- 2. diary_events 테이블 확장 (미디어 컬럼)
ALTER TABLE public.diary_events
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'NONE'
    CHECK (media_type IN ('NONE', 'YOUTUBE', 'IMAGE', 'VOICE')),
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- 3. user_diary_subscriptions 테이블 신설
CREATE TABLE IF NOT EXISTS public.user_diary_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, diary_id)
);

ALTER TABLE public.user_diary_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_subscriptions" ON public.user_diary_subscriptions;
CREATE POLICY "allow_public_select_diary_subscriptions"
    ON public.user_diary_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_subscriptions" ON public.user_diary_subscriptions;
CREATE POLICY "allow_public_insert_diary_subscriptions"
    ON public.user_diary_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_delete_diary_subscriptions" ON public.user_diary_subscriptions;
CREATE POLICY "allow_public_delete_diary_subscriptions"
    ON public.user_diary_subscriptions FOR DELETE USING (true);

-- 4. 기존 2개 브랜드(동화에이브이/중소기업사업전환지원단) 분류 보정
UPDATE public.diaries SET approval_status = 'APPROVED', provider_type = 'ENTERPRISE', region_code = NULL
WHERE brand_slug = 'donghwa-av';

UPDATE public.diaries SET approval_status = 'APPROVED', provider_type = 'PUBLIC', region_code = NULL
WHERE brand_slug = 'sme-transform';

-- 5. 신규 예시 제공자 5건 시드 (지역/카테고리/승인상태 다양화)
INSERT INTO public.diaries (brand_slug, brand_name, logo_url, contact_info, approval_status, provider_type, region_code, youtube_channel)
VALUES
  ('nowon-market', '노원 전통시장 상인회', NULL, '02-950-0000', 'APPROVED', 'LOCAL_BIZ', '노원구', NULL),
  ('nowon-gu', '노원구청', NULL, '02-2116-3114', 'APPROVED', 'PUBLIC', '노원구', NULL),
  ('ambassador-studio', '김민수 엠버서더 스튜디오', NULL, 'ambassador@today.or.kr', 'APPROVED', 'CREATOR', '노원구', 'https://www.youtube.com/@todayorkr'),
  ('jungnang-repair-shop', '중계동 생활가전 수리상점', NULL, '02-930-1111', 'CONDITIONAL', 'LOCAL_BIZ', '노원구', NULL),
  ('sanggye-craft-studio', '상계동 공방 스튜디오', NULL, '02-930-2222', 'PENDING', 'LOCAL_BIZ', '노원구', NULL)
ON CONFLICT (brand_slug) DO NOTHING;

-- 6. 신규 예시 공식 행사 일정 (유튜브/사진/음성 미디어 데모 포함)
INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, media_url, voice_url)
SELECT d.id, v.title, v.description, v.event_date::DATE, v.is_public, v.send_alimtalk, v.media_type, v.media_url, v.voice_url
FROM (
  VALUES
    ('nowon-market', '노원 전통시장 온누리상품권 환급 행사', '전통시장 방문 고객 대상 온누리상품권 10% 환급 행사 (신청: https://www.sijang.or.kr)', '2026-10-19', true, true, 'IMAGE', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80,https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&q=80', NULL),
    ('nowon-gu', '노원구 노후 공동주택 재건축 설명회', '상계·중계동 노후 공동주택 재건축 사업설명회 및 주민 Q&A', '2026-10-21', true, true, 'VOICE', NULL, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
    ('ambassador-studio', '엠버서더 숏폼 제작 꿀팁 라이브', '15초 세로형 숏폼 촬영·편집 꿀팁 라이브 강의', '2026-10-20', true, false, 'YOUTUBE', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL),
    ('jungnang-repair-shop', '가전 무상점검 조건부 이벤트', '사업자 서류 보완 완료 후 노출되는 조건부 승인 예시 행사', '2026-10-23', true, false, 'NONE', NULL, NULL),
    ('sanggye-craft-studio', '공방 체험 프로그램 (심사 대기)', '관리자 승인 완료 전까지 검색 결과에 노출되지 않는 예시 행사', '2026-10-25', true, false, 'NONE', NULL, NULL)
) AS v(brand_slug, title, description, event_date, is_public, send_alimtalk, media_type, media_url, voice_url)
JOIN public.diaries d ON d.brand_slug = v.brand_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = v.title
);
