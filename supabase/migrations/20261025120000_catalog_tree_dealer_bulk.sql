-- ==============================================================================
-- T.홈페이지 B2B 카탈로그 — 3단 계층형 카테고리(catalog_categories), 딜러 맞춤 카탈로그,
-- 엑셀/CSV 대량 등록, 고객 화면 '200%/원가' 문구 제거를 위한 사용자 화면-내부 데이터 분리
-- ==============================================================================

-- 1. catalog_categories — 대분류(depth=1) -> 중분류(depth=2) -> 소분류(depth=3)
CREATE TABLE IF NOT EXISTS public.catalog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
    depth SMALLINT NOT NULL CHECK (depth IN (1, 2, 3)),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_catalog_categories" ON public.catalog_categories;
CREATE POLICY "allow_public_select_catalog_categories" ON public.catalog_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_insert_catalog_categories" ON public.catalog_categories;
CREATE POLICY "allow_public_insert_catalog_categories" ON public.catalog_categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "allow_public_update_catalog_categories" ON public.catalog_categories;
CREATE POLICY "allow_public_update_catalog_categories" ON public.catalog_categories FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_diary_id ON public.catalog_categories(diary_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_parent_id ON public.catalog_categories(parent_id);

-- 2. 중소기업사업전환지원단 / 조달인프라사업단 기본 트리 시드: [인쇄물] -> [다이어리] -> [양장/스프링/시스템/한정특가 32절]
DO $$
DECLARE
  rec RECORD;
  l1_id UUID;
  l2_id UUID;
BEGIN
  FOR rec IN SELECT id FROM public.diaries WHERE brand_slug IN ('sme-transform', 'procurement-infra') LOOP
    SELECT id INTO l1_id FROM public.catalog_categories WHERE diary_id = rec.id AND parent_id IS NULL AND name = '인쇄물';
    IF l1_id IS NULL THEN
      INSERT INTO public.catalog_categories (diary_id, parent_id, depth, name, slug, sort_order)
      VALUES (rec.id, NULL, 1, '인쇄물', 'print', 1) RETURNING id INTO l1_id;
    END IF;

    SELECT id INTO l2_id FROM public.catalog_categories WHERE diary_id = rec.id AND parent_id = l1_id AND name = '다이어리';
    IF l2_id IS NULL THEN
      INSERT INTO public.catalog_categories (diary_id, parent_id, depth, name, slug, sort_order)
      VALUES (rec.id, l1_id, 2, '다이어리', 'diary', 1) RETURNING id INTO l2_id;
    END IF;

    INSERT INTO public.catalog_categories (diary_id, parent_id, depth, name, slug, sort_order)
    SELECT rec.id, l2_id, 3, v.name, v.slug, v.sort_order
    FROM (VALUES ('양장 32절', 'hardcover-32', 1), ('스프링 32절', 'spring-32', 2), ('시스템 32절', 'system-32', 3), ('한정특가 32절', 'special-32', 4))
      AS v(name, slug, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.catalog_categories c WHERE c.diary_id = rec.id AND c.parent_id = l2_id AND c.name = v.name
    );
  END LOOP;
END $$;

-- 3. diary_products — category_id(FK)로 전환. 기존 category(TEXT)/price_tiers(JSONB)는 더 이상 사용하지 않음
ALTER TABLE public.diary_products
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.catalog_categories(id);

-- 기존 6개 품목(중소기업사업전환지원단)을 품목코드 기준으로 올바른 소분류에 연결
UPDATE public.diary_products p
SET category_id = c.id
FROM public.catalog_categories c
JOIN public.diaries d ON d.id = c.diary_id
WHERE p.diary_id = d.id
  AND d.brand_slug = 'sme-transform'
  AND c.depth = 3
  AND (
    (p.product_code IN ('MO-07', 'MO-73') AND c.name = '양장 32절') OR
    (p.product_code IN ('MI-03', 'MU-21') AND c.name = '스프링 32절') OR
    (p.product_code = 'MJ-11' AND c.name = '시스템 32절') OR
    (p.product_code = 'MZ-22' AND c.name = '한정특가 32절')
  )
  AND p.category_id IS NULL;

-- 과거 라운드의 임시 컬럼 정리 (고객 화면에 남아있던 원가배율 단가표 체계 완전 제거)
ALTER TABLE public.diary_products DROP COLUMN IF EXISTS category;
ALTER TABLE public.diary_products DROP COLUMN IF EXISTS price_tiers;

CREATE INDEX IF NOT EXISTS idx_diary_products_category_id ON public.diary_products(category_id);

-- 4. diary_categories(구 1단 카테고리 테이블)는 catalog_categories로 완전히 대체되어 더 이상 사용하지 않음
DROP TABLE IF EXISTS public.diary_categories;
