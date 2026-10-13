-- 1. 취급제품 및 메인 롤링 제품 마스터 테이블
CREATE TABLE IF NOT EXISTS public.platform_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,              -- 제품명 (예: '초음파 세척 싱크볼', '스마트 레이더 센서')
    subtitle VARCHAR(255),                    -- 서브 카피
    category VARCHAR(50) NOT NULL,            -- 'INTERIOR', 'ELECTRONICS', 'COMMERCE', 'LIVING'
    main_image_url TEXT NOT NULL,             -- 제품 대표 이미지 URL
    is_hero_rolling BOOLEAN DEFAULT TRUE,     -- 메인 최상단 롤링 배너 노출 여부
    rolling_order INTEGER DEFAULT 0,          -- 롤링 순서
    
    -- [최고관리자 권한 제어 필터: 처음에는 모두 공개 기본값]
    is_public BOOLEAN DEFAULT TRUE NOT NULL,  -- 공개 / 비공개 여부 (기본: TRUE)
    allowed_categories TEXT[] DEFAULT ARRAY['ALL']::TEXT[], -- 허용 업체 카테고리 (기본: 'ALL')
    min_partner_grade VARCHAR(20) DEFAULT 'ALL',            -- 'ALL', 'NORMAL', 'VIP', 'EXCLUSIVE' (기본: 'ALL')
    
    price_info VARCHAR(100),                  -- 가격 또는 공급가 정책
    spec_summary TEXT,                        -- 주요 사양 및 취급 설명
    contact_phone VARCHAR(50),                -- 공급 상담 직통 번호
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.platform_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_products' AND policyname = 'Allow public read platform_products') THEN
        CREATE POLICY "Allow public read platform_products" ON public.platform_products FOR SELECT USING (is_public = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_products' AND policyname = 'Allow public insert platform_products') THEN
        CREATE POLICY "Allow public insert platform_products" ON public.platform_products FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 2. 초기 취급제품 검증용 데이터 적재 (전체 공개 기본값)
INSERT INTO public.platform_products (
  title, subtitle, category, main_image_url, is_hero_rolling, rolling_order, is_public, allowed_categories, min_partner_grade, price_info, spec_summary
)
VALUES
(
  '탑소닉 하이엔드 초음파 세척 싱크볼',
  '공동주택 및 프리미엄 인테리어 맞춤형 주방 혁신 설비',
  'INTERIOR',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80',
  TRUE,
  1,
  TRUE,
  ARRAY['ALL'],
  'ALL',
  '대리점·협력사 B2B 특판가 공급',
  '특허 듀얼 진동자 탑재, 잔류농약 99.9% 세척, 세대 씽크대 원데이 빌트인 시공'
),
(
  'McKare VSR-20 비접촉 레이더 생체감지 센서',
  '독거노인 고독사 예방 및 시니어 스마트케어 레이더 솔루션',
  'ELECTRONICS',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  TRUE,
  2,
  TRUE,
  ARRAY['ALL'],
  'ALL',
  '지자체 지원금 및 단지 B2G 특판',
  '카메라 프라이버시 침해 없는 60GHz 밀리미터파 레이더, 호흡/심박/낙상 실시간 감지'
)
ON CONFLICT DO NOTHING;

-- 3. 노원구 상계동 기준 '노원청소년일삶센터' 공식 프로그램 팩트 데이터 적재
INSERT INTO public.local_official_notices (
  district_code, category, notice_no, issuing_agency, title, impact_zone, 
  summary_1, summary_2, summary_3, details_body, contact_info, official_link, publish_date, view_count, related_tags, target_roles
)
VALUES
(
  '1135010500', 
  'EDU', 
  '노원청년일삶센터 공고 제2026-10호', 
  '노원청소년일삶센터 (일삶13센터)', 
  '[노원구 상계] 2026 청년·청소년 맞춤형 일경험 노원찬스 및 10월 역량강화 프로그램', 
  '노원구 관내 청년 및 청소년 (상계동 일원)', 
  '노원구 청년지원 거점 일삶센터 주관 맞춤형 일경험 및 취업 역량강화 과정.', 
  '월 44시간 일경험 기회 및 최대 88만원 일경험비 지원, 1:1 진로테라피 운영.', 
  '10월 강점 Unboxing 및 자기탐색 심리검사 선착순 접수 중.', 
  '노원청소년일삶센터(일삶13센터)에서 노원구 청년 및 청소년들의 일과 삶을 잇는 일경험 및 역량강화 프로그램을 운영합니다. 자세한 참여 신청은 센터 홈페이지를 참조해 주세요.', 
  '노원청소년일삶센터 02-972-1312', 
  'https://www.13center.kr', 
  '2026-10-12',
  1420,
  ARRAY['노원청소년일삶센터', '일경험', '상계동', '청년지원'],
  ARRAY['ALL', 'RESIDENT', 'CITIZEN']
)
ON CONFLICT DO NOTHING;
