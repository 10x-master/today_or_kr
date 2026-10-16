-- ==============================================================================
-- today.or.kr — t.다이어리 통합 마이그레이션 (supabase/migrations/ 6건 병합본)
--
-- 사용법: Supabase 대시보드 → SQL Editor → 새 쿼리에 이 파일 전체를 붙여넣고 Run.
-- 아래 6개 원본 파일을 생성 순서(날짜) 그대로 이어붙인 것이며, 내용은 수정하지
-- 않았습니다. 원본 파일은 각 섹션 변경 이력 추적용으로 계속 보존됩니다.
--   1. supabase/migrations/20261017130000_diaries.sql
--   2. supabase/migrations/20261018120000_diary_provider_portal.sql
--   3. supabase/migrations/20261019120000_diary_provider_applications.sql
--   4. supabase/migrations/20261020120000_diary_community_roles.sql
--   5. supabase/migrations/20261021120000_diary_license_tnote_tsign.sql
--   6. supabase/migrations/20261022120000_tnote_alert_queue.sql
--
-- 모든 CREATE TABLE/ADD COLUMN은 IF NOT EXISTS, 모든 INSERT 시드는
-- ON CONFLICT DO NOTHING 또는 WHERE NOT EXISTS 가드가 걸려 있어 재실행해도
-- 안전합니다(idempotent). 전체를 하나의 트랜잭션으로 묶어 중간에 실패하면
-- 전부 롤백되도록 처리했습니다.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- [1/5] 20261017130000_diaries.sql
-- t.다이어리 & t.note 지류 결합 솔루션: 발행 브랜드 및 공식 행사 일정 테이블
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- [2/5] 20261018120000_diary_provider_portal.sql
-- t.다이어리 포털 고도화: 제공자 승인/카테고리/지역, 행사 미디어, 유저 구독
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- [3/5] 20261019120000_diary_provider_applications.sql
-- t.다이어리 제공자 등록 신청 폼 + 관리자 심사 대시보드 지원 컬럼/상태 확장
-- ------------------------------------------------------------------------------

-- 1. diaries 테이블 추가 컬럼 (신청 폼 항목)
ALTER TABLE public.diaries
  ADD COLUMN IF NOT EXISTS business_reg_no TEXT,
  ADD COLUMN IF NOT EXISTS intro TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 2. approval_status에 'REJECTED'(반려) 상태 추가 (CHECK 제약조건 재생성)
ALTER TABLE public.diaries DROP CONSTRAINT IF EXISTS diaries_approval_status_check;
ALTER TABLE public.diaries
  ADD CONSTRAINT diaries_approval_status_check
  CHECK (approval_status IN ('APPROVED', 'PENDING', 'CONDITIONAL', 'REJECTED'));

-- 3. 관리자 심사 대시보드가 전체 상태를 조회할 수 있도록 공개 SELECT 정책 보강
--    (allow_public_select_diaries는 이미 모든 행을 허용하므로 변경 불필요)

-- ------------------------------------------------------------------------------
-- [4/5] 20261020120000_diary_community_roles.sql
-- t.다이어리 역할별(선생님/학부모/학생) 타깃 노출 & 폐쇄형 커뮤니티 스키마
-- ------------------------------------------------------------------------------

-- 1. diary_events 타깃 노출 컬럼 추가
ALTER TABLE public.diary_events
  ADD COLUMN IF NOT EXISTS target_roles TEXT[] NOT NULL DEFAULT ARRAY['ALL'],
  ADD COLUMN IF NOT EXISTS target_grades TEXT[] NOT NULL DEFAULT ARRAY['ALL'];

-- 2. diary_members 테이블 — 다이어리별 폐쇄형 커뮤니티 구성원
CREATE TABLE IF NOT EXISTS public.diary_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'TEACHER', 'PARENT', 'STUDENT')),
    grade_tags TEXT[] NOT NULL DEFAULT ARRAY['ALL'],
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('APPROVED', 'PENDING')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (diary_id, user_id)
);

ALTER TABLE public.diary_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_members" ON public.diary_members;
CREATE POLICY "allow_public_select_diary_members" ON public.diary_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_members" ON public.diary_members;
CREATE POLICY "allow_public_insert_diary_members" ON public.diary_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_diary_members" ON public.diary_members;
CREATE POLICY "allow_public_update_diary_members" ON public.diary_members FOR UPDATE USING (true);

-- 3. diary_posts 테이블 — 우리 반/우리 그룹 커뮤니티 알림장·활동 게시글
CREATE TABLE IF NOT EXISTS public.diary_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('OWNER', 'TEACHER', 'PARENT', 'STUDENT')),
    title TEXT NOT NULL,
    content TEXT,
    media_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    target_grades TEXT[] NOT NULL DEFAULT ARRAY['ALL'],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_posts" ON public.diary_posts;
CREATE POLICY "allow_public_select_diary_posts" ON public.diary_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_posts" ON public.diary_posts;
CREATE POLICY "allow_public_insert_diary_posts" ON public.diary_posts FOR INSERT WITH CHECK (true);

-- 4. diary_comments 테이블 — 게시글 비밀 댓글 (안심 소통창구)
CREATE TABLE IF NOT EXISTS public.diary_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.diary_posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_comments" ON public.diary_comments;
CREATE POLICY "allow_public_select_diary_comments" ON public.diary_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_comments" ON public.diary_comments;
CREATE POLICY "allow_public_insert_diary_comments" ON public.diary_comments FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_diary_posts_diary_id ON public.diary_posts(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_comments_post_id ON public.diary_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_diary_members_diary_id ON public.diary_members(diary_id);

-- 5. 예시 "상계 꿈나무 공부방" 커뮤니티 시드
INSERT INTO public.diaries (brand_slug, brand_name, logo_url, contact_info, approval_status, provider_type, region_code, intro)
VALUES (
  'sanggye-after-school', '상계 꿈나무 공부방', NULL, '02-930-3333', 'APPROVED', 'LOCAL_BIZ', '노원구',
  '선생님·학부모·학생이 함께하는 역할별 폐쇄형 학급 커뮤니티 다이어리'
)
ON CONFLICT (brand_slug) DO NOTHING;

INSERT INTO public.diary_members (diary_id, user_id, role, grade_tags, status)
SELECT d.id, v.user_id, v.role, v.grade_tags, v.status
FROM (
  VALUES
    ('teacher-kim', 'OWNER', ARRAY['ALL'], 'APPROVED'),
    ('teacher-lee', 'TEACHER', ARRAY['1학년', '2학년'], 'APPROVED'),
    ('user-001', 'PARENT', ARRAY['1학년'], 'APPROVED'),
    ('parent-park', 'PARENT', ARRAY['2학년'], 'PENDING'),
    ('student-choi', 'STUDENT', ARRAY['1학년'], 'APPROVED')
) AS v(user_id, role, grade_tags, status)
CROSS JOIN LATERAL (SELECT id FROM public.diaries WHERE brand_slug = 'sanggye-after-school') AS d
ON CONFLICT (diary_id, user_id) DO NOTHING;

INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, media_url, voice_url, target_roles, target_grades)
SELECT d.id, v.title, v.description, v.event_date::DATE, v.is_public, false, v.media_type, v.media_url, NULL, v.target_roles, v.target_grades
FROM (
  VALUES
    ('1학년 그림책 만들기 활동 안내', '1학년 학부모 대상 활동 사진 공유 및 준비물 안내', '2026-10-22', false, 'IMAGE', 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80', ARRAY['PARENT'], ARRAY['1학년']),
    ('2학년 현장학습 (서울숲) 공지', '2학년 전체 현장학습 일정 및 집합 시간 안내', '2026-10-24', false, 'NONE', NULL, ARRAY['PARENT', 'STUDENT'], ARRAY['2학년']),
    ('전체 학부모 상담 주간', '1~3학년 전체 학부모 대상 개별 상담 신청 안내', '2026-10-27', false, 'NONE', NULL, ARRAY['PARENT'], ARRAY['ALL'])
) AS v(title, description, event_date, is_public, media_type, media_url, target_roles, target_grades)
JOIN public.diaries d ON d.brand_slug = 'sanggye-after-school'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = v.title
);

INSERT INTO public.diary_posts (diary_id, author_id, author_role, title, content, media_urls, target_grades)
SELECT d.id, v.author_id, v.author_role, v.title, v.content, v.media_urls, v.target_grades
FROM (
  VALUES
    ('teacher-lee', 'TEACHER', '1학년 그림책 만들기 활동 사진 공유', '오늘 1학년 친구들이 직접 만든 그림책을 소개합니다! 모두 집중해서 멋진 작품을 완성했어요.', ARRAY['https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80'], ARRAY['1학년']),
    ('teacher-kim', 'OWNER', '10월 전체 공지 - 독감 예방접종 안내', '전체 학년 대상 독감 예방접종 안내문을 배포했습니다. 가정통신문을 꼭 확인해주세요.', ARRAY[]::TEXT[], ARRAY['ALL'])
) AS v(author_id, author_role, title, content, media_urls, target_grades)
JOIN public.diaries d ON d.brand_slug = 'sanggye-after-school'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_posts p WHERE p.diary_id = d.id AND p.title = v.title
);

-- ------------------------------------------------------------------------------
-- [5/5] 20261021120000_diary_license_tnote_tsign.sql
-- t.홈피-t.노트-t.싸인 3각 연계 + 라이선스 엔진
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- [6/6] 20261022120000_tnote_alert_queue.sql
-- T.노트 스마트 알림 큐 (중요도 D-7 선제 알림 + 당일 실시간 알람) + 앱 아이콘 v4
-- ------------------------------------------------------------------------------

-- 1. today_notes 알림 큐 컬럼
ALTER TABLE public.today_notes
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_alert_date TIMESTAMPTZ;

-- 2. diary_events 알림 큐 컬럼
ALTER TABLE public.diary_events
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_alert_date TIMESTAMPTZ;

-- 3. 앱 아이콘 v4 (대문자 'T' 볼드 심볼) 캐시 버전 갱신
UPDATE public.app_pwa_settings
SET
  icon_192_url = '/icons/today-192.png?v=4',
  icon_512_url = '/icons/today-512.png?v=4',
  updated_at = NOW()
WHERE app_target = 'TODAY_MAIN';

-- 4. 8대 핵심 시드: 당일 일정 / D-7 중요 행사 데모
INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, target_roles, target_grades, is_important, reminder_days_before, target_alert_date)
SELECT d.id, v.title, v.description, v.event_date::DATE, v.is_public, v.send_alimtalk, 'NONE', ARRAY['ALL'], ARRAY['ALL'], v.is_important, v.reminder_days_before, v.target_alert_date::TIMESTAMPTZ
FROM (
  VALUES
    ('linkpick', '링크픽 신규 파트너 온보딩 미팅', '오늘 오후 신규 추천샵 파트너 온보딩 및 수수료 정책 안내', '2026-10-16', true, false, false, 7, NULL),
    ('aptlink', '아파트링크 전국 단지 품질 점검 보고회', '전국 가입 단지 대상 분기별 품질 점검 결과 보고회', '2026-10-23', true, true, true, 7, '2026-10-23T10:00:00.000Z'),
    ('procurement-infra', '조달 입찰 서류 당일 마감 안내', '오늘 18시까지 입찰 참가 서류 제출 마감', '2026-10-16', false, true, false, 7, NULL),
    ('sme-transform', '사업전환지원단 4분기 심사위원회', '4분기 사업전환계획 승인 심사위원회 개최', '2026-10-23', true, true, true, 7, '2026-10-23T09:00:00.000Z'),
    ('well-global', '웰글로벌 신제품 입고 당일 안내', '오늘 신제품 입고 완료, 금일 주문건 우선 배송', '2026-10-16', true, false, false, 7, NULL),
    ('ai-interior-assoc', '한국AI인테리어공간협회 정기총회', '2026년도 정기총회 및 라이선스 갱신 안내', '2026-10-23', true, true, true, 7, '2026-10-23T13:00:00.000Z'),
    ('art-high-school-music', '영광고 관악과 정기 레슨 당일 알림', '오늘 방과후 정기 레슨 시간 변경 안내 (17시 → 17시 30분)', '2026-10-16', false, true, false, 7, NULL),
    ('nowon-youth-center', '노원청년센터 지원사업 접수 마감 D-7', '청년 일자리 지원사업 서류 접수 마감이 일주일 앞으로 다가왔습니다', '2026-10-23', true, true, true, 7, '2026-10-23T18:00:00.000Z')
) AS v(brand_slug, title, description, event_date, is_public, send_alimtalk, is_important, reminder_days_before, target_alert_date)
JOIN public.diaries d ON d.brand_slug = v.brand_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = v.title
);

COMMIT;
