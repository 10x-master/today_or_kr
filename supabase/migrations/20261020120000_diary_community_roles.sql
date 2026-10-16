-- ==============================================================================
-- t.다이어리 역할별(선생님/학부모/학생) 타깃 노출 & 폐쇄형 커뮤니티 스키마
-- ==============================================================================

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
