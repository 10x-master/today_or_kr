-- ==============================================================================
-- t.노트(tnote_cards) / t.싸인(tsign_contracts) 실제 API 연동을 위한 스키마 보강
-- 기존 20261014_init_today_core.sql에 선제 설계된 두 테이블은 지금까지 어떤
-- app/api 경로에서도 참조되지 않던 "코드보다 앞서간 스키마" 상태였다. 이번
-- 마이그레이션은 그 간극을 메우기 위해 실제 클라이언트 UI(TodayNoteQuickCapture,
-- TSignContractEngine)가 필요로 하는 컬럼을 추가한다.
-- ==============================================================================

-- 1. TNOTE_CARDS — 공개/비공개/익명 발행 상태 + 사진/숏링크/소싱 연계 컬럼
ALTER TABLE public.tnote_cards
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public_feed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS short_link VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sourcing_item JSONB;

CREATE INDEX IF NOT EXISTS idx_tnote_cards_public_feed
  ON public.tnote_cards (is_public_feed, created_at DESC)
  WHERE is_public_feed = true;

-- 공개 피드로 발행된 카드(is_public_feed = true)는 작성자가 아니어도 조회 가능해야 한다.
DROP POLICY IF EXISTS "tnote_cards_select" ON public.tnote_cards;
CREATE POLICY "tnote_cards_select" ON public.tnote_cards
  FOR SELECT USING (
    is_public_feed = true OR
    auth.uid() = user_id OR
    user_id IS NULL OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tnote_cards.tenant_id AND t.owner_user_id = auth.uid())
  );

-- 2. TSIGN_CONTRACTS — 음성 조판 소스, 카카오/네이버 간편인증, 전자금고 보관 + 작성자 바인딩
ALTER TABLE public.tsign_contracts
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_audio_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_parsed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS identity_verify_provider VARCHAR(20) NOT NULL DEFAULT 'NONE'
    CHECK (identity_verify_provider IN ('KAKAO', 'NAVER', 'NONE')),
  ADD COLUMN IF NOT EXISTS identity_verify_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (identity_verify_status IN ('PENDING', 'VERIFIED', 'FAILED')),
  ADD COLUMN IF NOT EXISTS vault_stored_at TIMESTAMPTZ;

-- 기존 체크는 노동계약 중심 5종뿐이었음. TSignContractEngine의 3대 표준 템플릿(알바·B2B납품·외주)을
-- 전부 수용하도록 B2B_SUPPLY/OUTSOURCING을 추가한다. LABOR_PART_TIME은 "알바 표준근로계약서"에 재사용.
ALTER TABLE public.tsign_contracts DROP CONSTRAINT IF EXISTS tsign_contracts_contract_type_check;
ALTER TABLE public.tsign_contracts ADD CONSTRAINT tsign_contracts_contract_type_check
  CHECK (contract_type IN ('LABOR_STANDARD', 'LABOR_PART_TIME', 'CLINIC_CONSENT', 'SECURITY_PLEDGE', 'NDA', 'B2B_SUPPLY', 'OUTSOURCING'));

-- tenant_id가 비어있는 단독(tenant 미연결) 계약도 작성자 본인은 조회/관리할 수 있어야 한다.
DROP POLICY IF EXISTS "tsign_contracts_select" ON public.tsign_contracts;
CREATE POLICY "tsign_contracts_select" ON public.tsign_contracts
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tsign_contracts.workforce_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tsign_contracts_tenant_manage" ON public.tsign_contracts;
CREATE POLICY "tsign_contracts_tenant_manage" ON public.tsign_contracts
  FOR ALL TO authenticated
  USING (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid())
  );
