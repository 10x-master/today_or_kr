-- ==============================================================================
-- t.홈피-t.노트-t.싸인 3각 연계 + 라이선스 엔진
-- ==============================================================================

-- 1. diaries 라이선스 제어 컬럼
ALTER TABLE public.diaries
  ADD COLUMN IF NOT EXISTS license_status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (license_status IN ('ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED')),
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'BUNDLE'
    CHECK (plan IN ('BUNDLE', 'PRO', 'ENTERPRISE')),
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_members INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS connected_homepage_slug TEXT;

-- 2. diary_events 멀티미디어 + t.sign 연동 컬럼
ALTER TABLE public.diary_events
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS bookmark_urls JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
  ADD COLUMN IF NOT EXISTS audio_duration INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS record_date DATE,
  ADD COLUMN IF NOT EXISTS t_sign_doc_id UUID,
  ADD COLUMN IF NOT EXISTS sign_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (sign_status IN ('NONE', 'REQUESTED', 'COMPLETED'));

-- 3. today_notes(t.note) 멀티미디어 + 일정 바인딩 컬럼
ALTER TABLE public.today_notes
  ADD COLUMN IF NOT EXISTS diary_event_id UUID REFERENCES public.diary_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS bookmark_urls JSONB[] NOT NULL DEFAULT ARRAY[]::JSONB[],
  ADD COLUMN IF NOT EXISTS audio_duration INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS record_date DATE,
  ADD COLUMN IF NOT EXISTS t_sign_doc_id UUID,
  ADD COLUMN IF NOT EXISTS sign_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (sign_status IN ('NONE', 'REQUESTED', 'COMPLETED'));

-- 4. 기존 중소기업사업전환지원단 라이선스 보정
UPDATE public.diaries
SET license_status = 'ACTIVE', plan = 'ENTERPRISE', valid_until = '2027-03-01T00:00:00.000Z', max_members = 100
WHERE brand_slug = 'sme-transform';

-- 5. 8대 핵심 시드 중 신규 7건 (라이선스 정보 포함)
INSERT INTO public.diaries (brand_slug, brand_name, logo_url, contact_info, approval_status, provider_type, region_code, intro, license_status, plan, valid_until, max_members, connected_homepage_slug)
VALUES
  ('linkpick', '링크픽', NULL, 'linkpick@today.or.kr', 'APPROVED', 'ENTERPRISE', NULL, '추천샵 모바일 1-Page 허브 · 엠버서더 커머스 연동', 'ACTIVE', 'PRO', '2027-10-20T00:00:00.000Z', 50, 'apt-sanggye14'),
  ('aptlink', '아파트링크', NULL, 'aptlink@today.or.kr', 'APPROVED', 'ENTERPRISE', NULL, '아파트 단지 전용 공동체 플랫폼 · 장기수선충당금 진단 연계', 'ACTIVE', 'ENTERPRISE', '2027-06-01T00:00:00.000Z', 200, '/aptlink'),
  ('procurement-infra', '조달인프라사업단', NULL, '02-6000-1000', 'APPROVED', 'PUBLIC', NULL, '공공조달 인프라 구축 및 중소기업 입찰 지원 사업단', 'GRACE_PERIOD', 'PRO', '2026-11-05T00:00:00.000Z', 30, NULL),
  ('well-global', '웰글로벌', NULL, '02-555-7000', 'APPROVED', 'ENTERPRISE', NULL, '글로벌 헬스케어·웰니스 유통 전문기업', 'ACTIVE', 'PRO', '2027-01-15T00:00:00.000Z', 20, NULL),
  ('ai-interior-assoc', '한국AI인테리어공간협회', NULL, '02-333-8000', 'APPROVED', 'PUBLIC', NULL, 'AI 기반 인테리어 공간 설계 표준 및 하이퍼로컬 공공 팩트 피드 주관 협회', 'EXPIRED', 'BUNDLE', '2026-09-30T00:00:00.000Z', 40, NULL),
  ('art-high-school-music', '영광고 관악예술과', NULL, '02-900-4000', 'APPROVED', 'CREATOR', '노원구', '관악 전공 실기·입시 지도 및 정기연주회 알림 커뮤니티', 'ACTIVE', 'BUNDLE', '2027-08-31T00:00:00.000Z', 60, NULL),
  ('nowon-youth-center', '노원청년일삶센터', NULL, '02-950-6000', 'APPROVED', 'PUBLIC', '노원구', '노원구 청년 일자리·자립 지원 프로그램 운영 센터', 'GRACE_PERIOD', 'BUNDLE', '2026-11-10T00:00:00.000Z', 80, NULL)
ON CONFLICT (brand_slug) DO NOTHING;

-- 6. 멀티미디어(다중사진/북마크) + t.sign 연동 데모 일정
INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, media_url, voice_url, target_roles, target_grades, image_urls, bookmark_urls, record_date, t_sign_doc_id, sign_status)
SELECT d.id, '정기연주회 리허설 활동 기록',
  '관악 전공생 정기연주회 리허설 사진 모음 및 참고 기사 스크랩', '2026-10-18'::DATE, true, false, 'IMAGE', NULL, NULL,
  ARRAY['ALL'], ARRAY['ALL'],
  ARRAY['https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80'],
  ARRAY['{"url":"https://www.youtube.com/@todayorkr","title":"영광고 관악예술과 공식 채널","description":"정기연주회 지난 영상 모음"}'::JSONB],
  '2026-10-16'::DATE, NULL, 'NONE'
FROM public.diaries d
WHERE d.brand_slug = 'art-high-school-music'
  AND NOT EXISTS (SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = '정기연주회 리허설 활동 기록');

INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, media_url, voice_url, target_roles, target_grades, t_sign_doc_id, sign_status)
SELECT d.id, '중소기업 조달 입찰 참가 동의서 서명 요청',
  '2026년 4분기 공공조달 입찰 참가를 위한 전자 동의서 서명 요청', '2026-10-22'::DATE, false, true, 'NONE', NULL, NULL,
  ARRAY['ALL'], ARRAY['ALL'], gen_random_uuid(), 'REQUESTED'
FROM public.diaries d
WHERE d.brand_slug = 'procurement-infra'
  AND NOT EXISTS (SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = '중소기업 조달 입찰 참가 동의서 서명 요청');
