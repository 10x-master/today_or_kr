-- ==============================================================================
-- 공식 행정 고시 및 로컬 인프라/재개발 팩트 피드 테이블 마이그레이션
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.local_official_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_code VARCHAR(10) NOT NULL, -- 법정동 코드 (예: 상계동 1135010500)
    category VARCHAR(30) NOT NULL,      -- 'REDEVELOP'(재개발), 'INFRA'(국토부/도로), 'COUNCIL'(의회), 'FESTIVAL'(축제), 'SUBSIDY'(지원금)
    notice_no VARCHAR(100),             -- 공식 고시/공고 번호 (예: 서울특별시 고시 제2026-102호)
    issuing_agency VARCHAR(100) NOT NULL,-- 발행 기관 (국토교통부, 서울특별시, 노원구청, 노원구의회 등)
    title VARCHAR(255) NOT NULL,        -- 공고 제목
    impact_zone VARCHAR(100),           -- 영향 구역/단지명 (예: 상계역 일대, 상계주공 5단지 등)
    summary_1 TEXT NOT NULL,            -- 팩트 요약 1: 핵심 안건/결정 사항
    summary_2 TEXT NOT NULL,            -- 팩트 요약 2: 사업 일정 / 예산 / D-Day
    summary_3 TEXT NOT NULL,            -- 팩트 요약 3: 주민/입주민 영향 및 확인 사항
    official_link TEXT NOT NULL,        -- 지자체/국토부 공식 원문 링크
    publish_date DATE NOT NULL,         -- 고시/공고 일자
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 및 정렬 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_local_official_notices_district ON public.local_official_notices (district_code);
CREATE INDEX IF NOT EXISTS idx_local_official_notices_category ON public.local_official_notices (category);
CREATE INDEX IF NOT EXISTS idx_local_official_notices_publish_date ON public.local_official_notices (publish_date DESC);

-- RLS (Row Level Security) 활성화: 모든 사용자가 읽기 가능
ALTER TABLE public.local_official_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_official_notices" ON public.local_official_notices;
CREATE POLICY "allow_public_select_official_notices" 
    ON public.local_official_notices 
    FOR SELECT 
    USING (true);

-- 노원구 상계동 기준 검증용 시범 팩트 데이터 적재 (초기 렌더링 확인용)
INSERT INTO public.local_official_notices (
    district_code, 
    category, 
    notice_no, 
    issuing_agency, 
    title, 
    impact_zone, 
    summary_1, 
    summary_2, 
    summary_3, 
    official_link, 
    publish_date
)
SELECT 
  '1135010500', 
  'REDEVELOP', 
  '서울시 노원구 고시 제2026-89호', 
  '노원구청 주거정비과', 
  '상계2구역 주택재개발정비사업 사업시행계획인가 고시', 
  '상계2구역 일대 (상계동 111-206 일원)', 
  '상계2구역 주택재개발 정비계획에 따른 사업시행계획 인가 고시 확정.', 
  '지하 3층~지상 25층, 총 2,200세대 규모 및 기반시설 조성 계획 포함.', 
  '조합원 분양 신청 및 관리처분 총회 준비 단계 돌입.', 
  'https://www.nowon.kr', 
  '2026-10-08'
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_official_notices WHERE notice_no = '서울시 노원구 고시 제2026-89호'
);

INSERT INTO public.local_official_notices (
    district_code, 
    category, 
    notice_no, 
    issuing_agency, 
    title, 
    impact_zone, 
    summary_1, 
    summary_2, 
    summary_3, 
    official_link, 
    publish_date
)
SELECT 
  '1135010500', 
  'INFRA', 
  '국토교통부 고시 제2026-412호', 
  '국토교통부 광역교통정책과', 
  '동북선 경전철 환승 체계 연계 도로망 정비 공사 실시계획 승인', 
  '상계역 ~ 은행사거리 일대', 
  '동북선 경전철 완공 대비 상계역 주변 지상 연계 버스베이 및 보행로 확장.', 
  '2026년 11월 본공사 착공, 주간 차선 축소에 따른 우회로 운영.', 
  '출퇴근 시간대 상계로 일대 임시 버스전용차로 정비 완료.', 
  'https://www.molit.go.kr', 
  '2026-10-05'
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_official_notices WHERE notice_no = '국토교통부 고시 제2026-412호'
);

INSERT INTO public.local_official_notices (
    district_code, 
    category, 
    notice_no, 
    issuing_agency, 
    title, 
    impact_zone, 
    summary_1, 
    summary_2, 
    summary_3, 
    official_link, 
    publish_date
)
SELECT 
  '1135010500', 
  'COUNCIL', 
  '노원구의회 공고 제2026-34호', 
  '노원구의회', 
  '노원구 공동주택 관리 및 노후 승강기 안전지원 조례 일부개정안 발의', 
  '노원구 관내 20년 이상 노후 아파트', 
  '노후 아파트 승강기 교체 보조금 지원 한도 상향 조정 발의.', 
  '구의회 복지건설위원회 심사 통과 및 본회의 의결 대기.', 
  '단지별 입주자대표회의 보조금 신청 자격 기준 완화 검토.', 
  'https://council.nowon.kr', 
  '2026-10-02'
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_official_notices WHERE notice_no = '노원구의회 공고 제2026-34호'
);
