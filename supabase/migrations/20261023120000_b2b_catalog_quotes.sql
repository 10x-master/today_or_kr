-- ==============================================================================
-- T.홈페이지 B2B 카탈로그 → 견적 요청 → 견적서 발송 → T.싸인 전자계약 → 결제/세금계산서
-- ==============================================================================

-- 1. diary_products — 다이어리별 B2B 도매 상품 카탈로그
CREATE TABLE IF NOT EXISTS public.diary_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('양장', '스프링', '시스템', '한정특가')),
    product_code TEXT NOT NULL,
    name TEXT NOT NULL,
    spec TEXT,
    price_tiers JSONB NOT NULL DEFAULT '[]'::JSONB,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_select_diary_products" ON public.diary_products;
CREATE POLICY "allow_public_select_diary_products" ON public.diary_products FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_diary_products_diary_id ON public.diary_products(diary_id);

-- 2. diary_quote_requests — B2B 견적 요청/발송/전자계약/결제 플로우
CREATE TABLE IF NOT EXISTS public.diary_quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    print_options TEXT,
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'QUOTED', 'SIGNED', 'PAID')),
    packaging_fee INTEGER NOT NULL DEFAULT 0,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL DEFAULT 0,
    final_amount INTEGER NOT NULL DEFAULT 0,
    admin_memo TEXT,
    t_sign_doc_id UUID,
    sign_status TEXT NOT NULL DEFAULT 'NONE' CHECK (sign_status IN ('NONE', 'REQUESTED', 'COMPLETED')),
    payment_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_quote_requests" ON public.diary_quote_requests;
CREATE POLICY "allow_public_select_diary_quote_requests" ON public.diary_quote_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_quote_requests" ON public.diary_quote_requests;
CREATE POLICY "allow_public_insert_diary_quote_requests" ON public.diary_quote_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_diary_quote_requests" ON public.diary_quote_requests;
CREATE POLICY "allow_public_update_diary_quote_requests" ON public.diary_quote_requests FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_diary_quote_requests_diary_id ON public.diary_quote_requests(diary_id);

-- 3. 중소기업사업전환지원단 T.홈페이지를 신규 B2B 카탈로그로 연결
UPDATE public.diaries
SET connected_homepage_slug = '/biz/sme-transform/catalog'
WHERE brand_slug = 'sme-transform';

-- 4. 32절 다이어리 카탈로그 시드 (양장/스프링/시스템/한정특가 각 2종, 2배수 수량 단가표)
INSERT INTO public.diary_products (diary_id, category, product_code, name, spec, price_tiers)
SELECT d.id, v.category, v.product_code, v.name, v.spec, v.price_tiers::JSONB
FROM (
  VALUES
    ('양장', 'MO-07', '32절 양장 다이어리 블루', 'PU가죽 표지 · 금박 로고 각인 가능 · 밴드 고정형', '[{"minQty":100,"unitPrice":3200},{"minQty":200,"unitPrice":2800},{"minQty":400,"unitPrice":2500},{"minQty":800,"unitPrice":2200}]'),
    ('양장', 'MO-12', '32절 양장 다이어리 네이비', 'PU가죽 표지 · 금박 로고 각인 가능 · 내지 스케줄형', '[{"minQty":100,"unitPrice":3100},{"minQty":200,"unitPrice":2700},{"minQty":400,"unitPrice":2400},{"minQty":800,"unitPrice":2100}]'),
    ('스프링', 'MU-21', '32절 스프링 다이어리 그레이', '트윈링 제본 · 180도 평펼침 · 무광 표지', '[{"minQty":100,"unitPrice":2400},{"minQty":200,"unitPrice":2100},{"minQty":400,"unitPrice":1850},{"minQty":800,"unitPrice":1600}]'),
    ('스프링', 'MU-25', '32절 스프링 다이어리 베이지', '트윈링 제본 · 180도 평펼침 · 크라프트 표지', '[{"minQty":100,"unitPrice":2300},{"minQty":200,"unitPrice":2000},{"minQty":400,"unitPrice":1750},{"minQty":800,"unitPrice":1500}]'),
    ('시스템', 'SY-03', '32절 시스템 다이어리 (6공 리필형)', '6공 바인더 · 리필 속지 교체 가능 · 가죽 커버', '[{"minQty":100,"unitPrice":4200},{"minQty":200,"unitPrice":3800},{"minQty":400,"unitPrice":3400},{"minQty":800,"unitPrice":3000}]'),
    ('시스템', 'SY-08', '32절 시스템 다이어리 프리미엄', '6공 바인더 · 프리미엄 가죽 커버 · 명함 포켓 내장', '[{"minQty":100,"unitPrice":4800},{"minQty":200,"unitPrice":4300},{"minQty":400,"unitPrice":3900},{"minQty":800,"unitPrice":3400}]'),
    ('한정특가', 'LT-99', '32절 한정특가 다이어리 (재고소진 특가)', '전년도 재고 소진 특가 · 색상 랜덤 출고', '[{"minQty":100,"unitPrice":1800},{"minQty":200,"unitPrice":1500},{"minQty":400,"unitPrice":1300},{"minQty":800,"unitPrice":1100}]'),
    ('한정특가', 'LT-05', '32절 한정특가 캘린더형 다이어리', '월간 캘린더형 내지 · 한정 수량 특가', '[{"minQty":100,"unitPrice":2000},{"minQty":200,"unitPrice":1700},{"minQty":400,"unitPrice":1450},{"minQty":800,"unitPrice":1200}]')
) AS v(category, product_code, name, spec, price_tiers)
JOIN public.diaries d ON d.brand_slug = 'sme-transform'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_products p WHERE p.diary_id = d.id AND p.product_code = v.product_code
);

-- 5. 예시 견적 요청 시드 (관리자 콘솔 데모용)
INSERT INTO public.diary_quote_requests (diary_id, company_name, contact_name, contact_phone, items, print_options, status, subtotal, final_amount)
SELECT d.id, 'A사', '김철수', '010-1234-5678',
  '[{"product_id":null,"product_code":"MO-07","product_name":"32절 양장 다이어리 블루","quantity":300,"unit_price":2500},{"product_id":null,"product_code":"MU-21","product_name":"32절 스프링 다이어리 그레이","quantity":200,"unit_price":2100}]'::JSONB,
  '표지 로고 금박 각인 (A사 로고), 내지 1월 시작',
  'REQUESTED', 300*2500 + 200*2100, 300*2500 + 200*2100
FROM public.diaries d
WHERE d.brand_slug = 'sme-transform'
  AND NOT EXISTS (SELECT 1 FROM public.diary_quote_requests q WHERE q.diary_id = d.id AND q.company_name = 'A사');
