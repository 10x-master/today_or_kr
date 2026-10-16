-- ==============================================================================
-- t.다이어리 제공자 등록 신청 폼 + 관리자 심사 대시보드 지원 컬럼/상태 확장
-- ==============================================================================

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
