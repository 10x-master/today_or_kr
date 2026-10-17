-- ==============================================================================
-- t.세일즈(tsales_leads / tsales_activity_logs) — 지도 기반 TM·CRM 신규 테이블
-- 선행 스키마가 없는 완전 신규 기능이라, t.싸인/t.체크에서처럼 뒤늦게 nullable로 풀어줄
-- 필요 없이 처음부터 tenant 가입 여부와 무관하게 혼자서도 쓸 수 있는 구조로 설계한다.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tsales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNCONTACTED'
    CHECK (status IN ('UNCONTACTED', 'IN_PROGRESS', 'CONTRACTED', 'REJECTED')),
  memo TEXT,
  estimated_deal_value_krw BIGINT,
  proposal_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  tsign_contract_id UUID REFERENCES public.tsign_contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tsales_leads_user ON public.tsales_leads (created_by_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsales_leads_status ON public.tsales_leads (status);

ALTER TABLE public.tsales_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tsales_leads_select" ON public.tsales_leads;
CREATE POLICY "tsales_leads_select" ON public.tsales_leads
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsales_leads.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tsales_leads_manage" ON public.tsales_leads;
CREATE POLICY "tsales_leads_manage" ON public.tsales_leads
  FOR ALL TO authenticated
  USING (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsales_leads.tenant_id AND t.owner_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsales_leads.tenant_id AND t.owner_user_id = auth.uid())
  );

-- 영업 활동 로그 (전화/방문/메모/상태변경/제안서발송/전자계약요청)
CREATE TABLE IF NOT EXISTS public.tsales_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.tsales_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type VARCHAR(20) NOT NULL
    CHECK (activity_type IN ('CALL', 'VISIT', 'NOTE', 'STATUS_CHANGE', 'PROPOSAL_SENT', 'SIGN_REQUESTED')),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tsales_activity_logs_lead ON public.tsales_activity_logs (lead_id, created_at DESC);

ALTER TABLE public.tsales_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tsales_activity_logs_select" ON public.tsales_activity_logs;
CREATE POLICY "tsales_activity_logs_select" ON public.tsales_activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tsales_leads l
      WHERE l.id = tsales_activity_logs.lead_id AND (
        l.created_by_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = l.tenant_id AND t.owner_user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "tsales_activity_logs_insert" ON public.tsales_activity_logs;
CREATE POLICY "tsales_activity_logs_insert" ON public.tsales_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tsales_leads l
      WHERE l.id = tsales_activity_logs.lead_id AND (
        l.created_by_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = l.tenant_id AND t.owner_user_id = auth.uid())
      )
    )
  );
