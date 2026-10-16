-- ==============================================================================
-- T.홈페이지 B2B 카탈로그 — 공급가(원가) 대비 200% 판매가 정정, 실사/그래픽 썸네일 매핑용
-- 색상·규격 필드 추가, 관리자 카테고리 CRUD 지원(diary_categories), 제품 상세 스펙 추가
-- ==============================================================================

-- 1. diary_categories — 관리자 콘솔에서 추가/순서변경/노출토글 가능한 동적 카테고리
CREATE TABLE IF NOT EXISTS public.diary_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diary_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_diary_categories" ON public.diary_categories;
CREATE POLICY "allow_public_select_diary_categories" ON public.diary_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_diary_categories" ON public.diary_categories;
CREATE POLICY "allow_public_insert_diary_categories" ON public.diary_categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_diary_categories" ON public.diary_categories;
CREATE POLICY "allow_public_update_diary_categories" ON public.diary_categories FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_diary_categories_diary_id ON public.diary_categories(diary_id);

-- 2. diary_products — 카테고리를 자유 텍스트로 전환(기존 4종 고정 CHECK 제거), 가격/규격 필드 추가
ALTER TABLE public.diary_products DROP CONSTRAINT IF EXISTS diary_products_category_check;

ALTER TABLE public.diary_products
    ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sell_price INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS color_hex TEXT NOT NULL DEFAULT '#1B3A5C',
    ADD COLUMN IF NOT EXISTS cover_size TEXT NOT NULL DEFAULT '커버 124×180mm / 123×185mm',
    ADD COLUMN IF NOT EXISTS page_count INTEGER NOT NULL DEFAULT 256,
    ADD COLUMN IF NOT EXISTS material_info TEXT NOT NULL DEFAULT '이태리 습식 원단';

-- 관리자 상품 등록/수정 허용 (기존엔 SELECT만 공개)
DROP POLICY IF EXISTS "allow_public_insert_diary_products" ON public.diary_products;
CREATE POLICY "allow_public_insert_diary_products" ON public.diary_products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_diary_products" ON public.diary_products;
CREATE POLICY "allow_public_update_diary_products" ON public.diary_products FOR UPDATE USING (true);

-- 3. 카테고리 시드 (양장/스프링/시스템/한정특가)
INSERT INTO public.diary_categories (diary_id, name, sort_order, is_visible)
SELECT d.id, v.name, v.sort_order, TRUE
FROM (VALUES ('양장', 1), ('스프링', 2), ('시스템', 3), ('한정특가', 4)) AS v(name, sort_order)
JOIN public.diaries d ON d.brand_slug = 'sme-transform'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_categories c WHERE c.diary_id = d.id AND c.name = v.name
);

-- 4. 기존 8종 구(舊) 가격 체계 상품 삭제 후 200% 판매가 체계로 재시드
DELETE FROM public.diary_products
WHERE diary_id IN (SELECT id FROM public.diaries WHERE brand_slug = 'sme-transform')
  AND product_code IN ('MO-07', 'MO-12', 'MU-21', 'MU-25', 'SY-03', 'SY-08', 'LT-99', 'LT-05');

INSERT INTO public.diary_products (diary_id, category, product_code, name, spec, cost_price, sell_price, color_hex, cover_size, page_count, material_info)
SELECT d.id, v.category, v.product_code, v.name, v.spec, v.cost_price, v.sell_price, v.color_hex, '커버 124×180mm / 123×185mm', 256, '이태리 습식 원단'
FROM (
  VALUES
    ('양장', 'MO-07', '32절 양장 다이어리 — 피콕그린', 'PU가죽 표지 · 금박/은박 각인 가능 · 밴드 고정형', 6050, 12100, '#0B6E4F'),
    ('양장', 'MO-73', '32절 양장 다이어리 — 모스그린', 'PU가죽 표지 · 금박/은박 각인 가능 · 무광 텍스처 커버', 6200, 12400, '#6B7A43'),
    ('스프링', 'MI-03', '32절 스프링 다이어리 — 3단 투톤 핑크', '트윈링 제본 · 3단 접이식 커버 · 투톤 배색 디자인', 7750, 15500, '#F2A6B9'),
    ('스프링', 'MU-21', '32절 스프링 다이어리 — 매직오션', '트윈링 제본 · 180도 평펼침 · 그라데이션 프리미엄 커버', 9900, 19800, '#0A4F7A'),
    ('시스템', 'MJ-11', '32절 시스템 다이어리 — 라인포켓 마린블루', '6공 시스템 바인더 · 내측 라인 포켓 · 명함/카드 수납', 6900, 13800, '#1B3A5C'),
    ('한정특가', 'MZ-22', '32절 한정특가 다이어리 — 스마트 검정 특가', '무광 블랙 커버 · 미니멀 디자인 · 재고 한정 특가', 5450, 10900, '#18181B')
) AS v(category, product_code, name, spec, cost_price, sell_price, color_hex)
JOIN public.diaries d ON d.brand_slug = 'sme-transform'
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_products p WHERE p.diary_id = d.id AND p.product_code = v.product_code
);

-- 5. 기존 예시 견적 요청(quote-0001 상당)의 품목 스냅샷을 신규 가격 체계로 갱신
UPDATE public.diary_quote_requests q
SET items = '[{"product_id":null,"product_code":"MO-07","product_name":"32절 양장 다이어리 — 피콕그린","quantity":300,"unit_price":12100},{"product_id":null,"product_code":"MU-21","product_name":"32절 스프링 다이어리 — 매직오션","quantity":200,"unit_price":19800}]'::JSONB,
    subtotal = 300 * 12100 + 200 * 19800,
    final_amount = 300 * 12100 + 200 * 19800 + q.packaging_fee + q.shipping_fee,
    updated_at = NOW()
FROM public.diaries d
WHERE q.diary_id = d.id AND d.brand_slug = 'sme-transform' AND q.company_name = 'A사' AND q.status = 'REQUESTED';
