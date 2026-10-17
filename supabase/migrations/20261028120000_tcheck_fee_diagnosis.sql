-- ==============================================================================
-- t.체크(tcheck_logs) 카드 매출 수수료 진단 스키마 보강
-- tcheck_logs는 원래 근태/순찰(GPS·QR·NFC 체크인) 기록용으로 설계되어 tenant_id/
-- workforce_id가 NOT NULL FK였다. "소상공인 카드 수수료 진단"은 테넌트·근태 체계에
-- 가입하지 않은 사장님도 혼자 돌릴 수 있는 독립 기능이므로, t.싸인 때와 동일한 방식으로
-- 두 FK를 nullable로 풀고 작성자 바인딩(created_by_user_id)과 진단 결과 컬럼을 추가한다.
-- ==============================================================================

ALTER TABLE public.tcheck_logs
  ALTER COLUMN tenant_id DROP NOT NULL,
  ALTER COLUMN workforce_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS annual_card_sales_krw BIGINT,
  ADD COLUMN IF NOT EXISTS current_fee_rate_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS legal_fee_rate_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS overcharged_amount_krw BIGINT,
  ADD COLUMN IF NOT EXISTS unnecessary_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS addon_annual_savings_krw BIGINT,
  ADD COLUMN IF NOT EXISTS estimated_refund_krw BIGINT;

-- 기존 체크는 근태/순찰 5종뿐이었음. 카드 수수료 진단 기록도 같은 테이블에 적재하므로 추가한다.
ALTER TABLE public.tcheck_logs DROP CONSTRAINT IF EXISTS tcheck_logs_check_type_check;
ALTER TABLE public.tcheck_logs ADD CONSTRAINT tcheck_logs_check_type_check
  CHECK (check_type IN ('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'PATROL_WAYPOINT', 'CARD_FEE_DIAGNOSIS'));

-- tenant_id/workforce_id가 비어있는 단독 진단 기록도 작성자 본인은 조회/적재할 수 있어야 한다.
DROP POLICY IF EXISTS "tcheck_logs_select" ON public.tcheck_logs;
CREATE POLICY "tcheck_logs_select" ON public.tcheck_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tcheck_logs.workforce_id AND w.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tcheck_logs.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tcheck_logs_insert" ON public.tcheck_logs;
CREATE POLICY "tcheck_logs_insert" ON public.tcheck_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tcheck_logs.workforce_id AND w.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tcheck_logs.tenant_id AND t.owner_user_id = auth.uid())
  );
