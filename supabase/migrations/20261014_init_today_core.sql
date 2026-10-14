-- ============================================================================
-- Today Core Database Migration (Step 1)
-- Migration: 20261014_init_today_core.sql
-- Modules: Multi-tenant Master, M-FAD GIS, t.note Cards, LinkPick Hub,
--          t.homepage ATS & Jobs, t.check Geofencing, t.sign e-Contracts
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- 1.1 Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.fn_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1.2 Automatic Geocoding Trigger Function (lat, lng -> PostGIS Point geometry)
CREATE OR REPLACE FUNCTION public.fn_sync_lat_lng_to_geom()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. TENANTS (Multi-tenant business master: stores, clinics, factories, distributors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  business_type VARCHAR(50) NOT NULL DEFAULT 'STORE' 
    CHECK (business_type IN ('STORE', 'CLINIC', 'FACTORY', 'DISTRIBUTOR', 'APARTMENT', 'RESTAURANT', 'CAFE', 'SERVICE')),
  biz_reg_number VARCHAR(30),
  representative_name VARCHAR(100),
  tel VARCHAR(50),
  road_address TEXT,
  detail_address TEXT,
  dong VARCHAR(50),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom geometry(Point, 4326),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED', 'CLOSED')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geocoding trigger on tenants
DROP TRIGGER IF EXISTS trg_tenants_geom ON public.tenants;
CREATE TRIGGER trg_tenants_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_lat_lng_to_geom();

-- Updated_at trigger on tenants
DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON public.tenants (business_type);
CREATE INDEX IF NOT EXISTS idx_tenants_dong ON public.tenants (dong);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON public.tenants (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_geom ON public.tenants USING GIST (geom);

-- RLS for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_public_select" ON public.tenants;
CREATE POLICY "tenants_public_select" ON public.tenants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tenants_authenticated_insert" ON public.tenants;
CREATE POLICY "tenants_authenticated_insert" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR owner_user_id IS NULL);

DROP POLICY IF EXISTS "tenants_owner_update" ON public.tenants;
CREATE POLICY "tenants_owner_update" ON public.tenants
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "tenants_owner_delete" ON public.tenants;
CREATE POLICY "tenants_owner_delete" ON public.tenants
  FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());


-- ============================================================================
-- 2. MFAD_GEO_TARGETS (M-FAD GIS targets for field supporters: hospitals, restaurants, gyms, new stores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mfad_geo_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  target_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'RESTAURANT'
    CHECK (category IN ('HOSPITAL', 'RESTAURANT', 'GYM', 'NEW_STORE', 'CAFE', 'BEAUTY', 'RETAIL', 'OTHER')),
  road_address TEXT,
  dong VARCHAR(50),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geom geometry(Point, 4326),
  contact_number VARCHAR(50),
  representative_name VARCHAR(100),
  visit_status VARCHAR(50) NOT NULL DEFAULT 'UNVISITED'
    CHECK (visit_status IN ('UNVISITED', 'ASSIGNED', 'VISITED', 'CONTRACTED', 'REJECTED')),
  assigned_supporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_visited_at TIMESTAMPTZ,
  visit_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geocoding trigger on mfad_geo_targets
DROP TRIGGER IF EXISTS trg_mfad_geo_targets_geom ON public.mfad_geo_targets;
CREATE TRIGGER trg_mfad_geo_targets_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON public.mfad_geo_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_lat_lng_to_geom();

-- Updated_at trigger on mfad_geo_targets
DROP TRIGGER IF EXISTS trg_mfad_geo_targets_updated_at ON public.mfad_geo_targets;
CREATE TRIGGER trg_mfad_geo_targets_updated_at
  BEFORE UPDATE ON public.mfad_geo_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for mfad_geo_targets
CREATE INDEX IF NOT EXISTS idx_mfad_geo_targets_geom ON public.mfad_geo_targets USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_mfad_geo_targets_category ON public.mfad_geo_targets (category);
CREATE INDEX IF NOT EXISTS idx_mfad_geo_targets_visit_status ON public.mfad_geo_targets (visit_status);
CREATE INDEX IF NOT EXISTS idx_mfad_geo_targets_assigned_supporter ON public.mfad_geo_targets (assigned_supporter_id);
CREATE INDEX IF NOT EXISTS idx_mfad_geo_targets_dong ON public.mfad_geo_targets (dong);

-- RLS for mfad_geo_targets
ALTER TABLE public.mfad_geo_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mfad_public_read" ON public.mfad_geo_targets;
CREATE POLICY "mfad_public_read" ON public.mfad_geo_targets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "mfad_authenticated_write" ON public.mfad_geo_targets;
CREATE POLICY "mfad_authenticated_write" ON public.mfad_geo_targets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 3. TNOTE_CARDS (Google Keep-style minimal modular card deck: VOICE, LOCATION, TODO, NOTE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tnote_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type VARCHAR(30) NOT NULL DEFAULT 'NOTE'
    CHECK (card_type IN ('VOICE', 'LOCATION', 'TODO', 'NOTE')),
  title VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  voice_audio_url TEXT,
  voice_duration_sec INTEGER,
  location_address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  todo_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on tnote_cards
DROP TRIGGER IF EXISTS trg_tnote_cards_updated_at ON public.tnote_cards;
CREATE TRIGGER trg_tnote_cards_updated_at
  BEFORE UPDATE ON public.tnote_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for tnote_cards
CREATE INDEX IF NOT EXISTS idx_tnote_cards_tenant_pinned ON public.tnote_cards (tenant_id, is_pinned, order_index);
CREATE INDEX IF NOT EXISTS idx_tnote_cards_user ON public.tnote_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_tnote_cards_type ON public.tnote_cards (card_type);

-- RLS for tnote_cards
ALTER TABLE public.tnote_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tnote_cards_select" ON public.tnote_cards;
CREATE POLICY "tnote_cards_select" ON public.tnote_cards
  FOR SELECT USING (
    auth.uid() = user_id OR
    user_id IS NULL OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tnote_cards.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tnote_cards_insert" ON public.tnote_cards;
CREATE POLICY "tnote_cards_insert" ON public.tnote_cards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "tnote_cards_update" ON public.tnote_cards;
CREATE POLICY "tnote_cards_update" ON public.tnote_cards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tnote_cards.tenant_id AND t.owner_user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tnote_cards.tenant_id AND t.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "tnote_cards_delete" ON public.tnote_cards;
CREATE POLICY "tnote_cards_delete" ON public.tnote_cards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tnote_cards.tenant_id AND t.owner_user_id = auth.uid()));


-- ============================================================================
-- 4. LINKPICK_ITEMS (LinkPick monetization & bio-link hub: Coupang Partners, direct products)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.linkpick_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  item_type VARCHAR(50) NOT NULL DEFAULT 'COUPANG'
    CHECK (item_type IN ('COUPANG', 'DIRECT_PRODUCT', 'AFFILIATE', 'CUSTOM_LINK')),
  original_url TEXT NOT NULL,
  affiliate_url TEXT,
  coupang_sub_id VARCHAR(100),
  product_id VARCHAR(100),
  thumbnail_url TEXT,
  display_price NUMERIC(12, 2),
  price_mode VARCHAR(30) NOT NULL DEFAULT 'SHOW_PRICE'
    CHECK (price_mode IN ('SHOW_PRICE', 'LOWEST_PRICE_BTN', 'SPECIAL_DEAL_BTN')),
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  total_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on linkpick_items
DROP TRIGGER IF EXISTS trg_linkpick_items_updated_at ON public.linkpick_items;
CREATE TRIGGER trg_linkpick_items_updated_at
  BEFORE UPDATE ON public.linkpick_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for linkpick_items
CREATE INDEX IF NOT EXISTS idx_linkpick_items_tenant_active ON public.linkpick_items (tenant_id, is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_linkpick_items_user ON public.linkpick_items (user_id);
CREATE INDEX IF NOT EXISTS idx_linkpick_items_sub_id ON public.linkpick_items (coupang_sub_id);

-- RLS for linkpick_items
ALTER TABLE public.linkpick_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "linkpick_items_public_select" ON public.linkpick_items;
CREATE POLICY "linkpick_items_public_select" ON public.linkpick_items
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "linkpick_items_authenticated_insert" ON public.linkpick_items;
CREATE POLICY "linkpick_items_authenticated_insert" ON public.linkpick_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "linkpick_items_authenticated_update" ON public.linkpick_items;
CREATE POLICY "linkpick_items_authenticated_update" ON public.linkpick_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = linkpick_items.tenant_id AND t.owner_user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = linkpick_items.tenant_id AND t.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "linkpick_items_authenticated_delete" ON public.linkpick_items;
CREATE POLICY "linkpick_items_authenticated_delete" ON public.linkpick_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = linkpick_items.tenant_id AND t.owner_user_id = auth.uid()));


-- ============================================================================
-- 5. JOB_POSTINGS (Job openings created on t.homepage and syndicated to Today Local)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'DISPATCH')),
  role_category VARCHAR(50) NOT NULL DEFAULT 'HALL'
    CHECK (role_category IN ('HALL', 'KITCHEN', 'PATROL', 'MAINTENANCE', 'BARISTA', 'DESK', 'LOGISTICS', 'OTHER')),
  salary_type VARCHAR(20) NOT NULL DEFAULT 'HOURLY'
    CHECK (salary_type IN ('HOURLY', 'MONTHLY', 'ANNUAL', 'PER_CASE')),
  salary_amount NUMERIC(12, 2) NOT NULL,
  work_schedule TEXT,
  work_address TEXT,
  dong VARCHAR(50),
  description TEXT,
  requirements TEXT,
  is_syndicated_to_local BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'CLOSED', 'PAUSED')),
  deadline_date DATE,
  view_count INTEGER NOT NULL DEFAULT 0,
  applicant_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on job_postings
DROP TRIGGER IF EXISTS trg_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER trg_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for job_postings
CREATE INDEX IF NOT EXISTS idx_job_postings_tenant_status ON public.job_postings (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_job_postings_dong_syndication ON public.job_postings (dong, status, is_syndicated_to_local);
CREATE INDEX IF NOT EXISTS idx_job_postings_author ON public.job_postings (author_user_id);

-- RLS for job_postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_postings_public_select" ON public.job_postings;
CREATE POLICY "job_postings_public_select" ON public.job_postings
  FOR SELECT USING (status = 'OPEN' OR auth.uid() = author_user_id);

DROP POLICY IF EXISTS "job_postings_tenant_manage" ON public.job_postings;
CREATE POLICY "job_postings_tenant_manage" ON public.job_postings
  FOR ALL TO authenticated
  USING (
    auth.uid() = author_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = job_postings.tenant_id AND t.owner_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = author_user_id OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = job_postings.tenant_id AND t.owner_user_id = auth.uid())
  );


-- ============================================================================
-- 6. JOB_APPLICANTS (ATS candidate tracking pipeline: APPLIED, INTERVIEW, HIRED, REJECTED)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(50) NOT NULL,
  applicant_email VARCHAR(100),
  pipeline_stage VARCHAR(30) NOT NULL DEFAULT 'APPLIED'
    CHECK (pipeline_stage IN ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED')),
  resume_url TEXT,
  cover_letter TEXT,
  interview_scheduled_at TIMESTAMPTZ,
  eval_score INTEGER,
  internal_notes TEXT,
  hired_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on job_applicants
DROP TRIGGER IF EXISTS trg_job_applicants_updated_at ON public.job_applicants;
CREATE TRIGGER trg_job_applicants_updated_at
  BEFORE UPDATE ON public.job_applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for job_applicants
CREATE INDEX IF NOT EXISTS idx_job_applicants_posting_stage ON public.job_applicants (job_posting_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_job_applicants_tenant ON public.job_applicants (tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_applicants_user ON public.job_applicants (applicant_user_id);

-- RLS for job_applicants
ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_applicants_applicant_select" ON public.job_applicants;
CREATE POLICY "job_applicants_applicant_select" ON public.job_applicants
  FOR SELECT TO authenticated
  USING (
    applicant_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = job_applicants.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "job_applicants_public_insert" ON public.job_applicants;
CREATE POLICY "job_applicants_public_insert" ON public.job_applicants
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "job_applicants_tenant_manage" ON public.job_applicants;
CREATE POLICY "job_applicants_tenant_manage" ON public.job_applicants
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = job_applicants.tenant_id AND t.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = job_applicants.tenant_id AND t.owner_user_id = auth.uid()));


-- ============================================================================
-- 7. STORE_WORKFORCE (Active employees enrolled in t.check geofencing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.store_workforce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name VARCHAR(100) NOT NULL,
  employee_code VARCHAR(50),
  phone VARCHAR(50) NOT NULL,
  employment_type VARCHAR(50) NOT NULL DEFAULT 'PART_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'DISPATCH', 'CONTRACT')),
  role_title VARCHAR(100) DEFAULT 'Staff',
  hourly_wage NUMERIC(10, 2),
  geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
  allowed_gps_lat DOUBLE PRECISION,
  allowed_gps_lng DOUBLE PRECISION,
  nfc_tag_uid VARCHAR(100),
  qr_beacon_id VARCHAR(100),
  work_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (work_status IN ('ACTIVE', 'ON_LEAVE', 'RESIGNED')),
  hired_date DATE,
  resigned_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on store_workforce
DROP TRIGGER IF EXISTS trg_store_workforce_updated_at ON public.store_workforce;
CREATE TRIGGER trg_store_workforce_updated_at
  BEFORE UPDATE ON public.store_workforce
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for store_workforce
CREATE INDEX IF NOT EXISTS idx_store_workforce_tenant_status ON public.store_workforce (tenant_id, work_status);
CREATE INDEX IF NOT EXISTS idx_store_workforce_user ON public.store_workforce (user_id);
CREATE INDEX IF NOT EXISTS idx_store_workforce_phone ON public.store_workforce (phone);

-- RLS for store_workforce
ALTER TABLE public.store_workforce ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_workforce_select" ON public.store_workforce;
CREATE POLICY "store_workforce_select" ON public.store_workforce
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = store_workforce.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "store_workforce_tenant_manage" ON public.store_workforce;
CREATE POLICY "store_workforce_tenant_manage" ON public.store_workforce
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = store_workforce.tenant_id AND t.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = store_workforce.tenant_id AND t.owner_user_id = auth.uid()));


-- ============================================================================
-- 8. TSIGN_CONTRACTS (Labor and clinic consent e-contracts with SHA-256 seal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tsign_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workforce_id UUID REFERENCES public.store_workforce(id) ON DELETE SET NULL,
  contract_type VARCHAR(50) NOT NULL DEFAULT 'LABOR_STANDARD'
    CHECK (contract_type IN ('LABOR_STANDARD', 'LABOR_PART_TIME', 'CLINIC_CONSENT', 'SECURITY_PLEDGE', 'NDA')),
  title VARCHAR(255) NOT NULL,
  employer_name VARCHAR(100) NOT NULL,
  employer_sign_svg TEXT,
  employer_signed_at TIMESTAMPTZ,
  employee_name VARCHAR(100) NOT NULL,
  employee_phone VARCHAR(50) NOT NULL,
  employee_sign_svg TEXT,
  employee_signed_at TIMESTAMPTZ,
  contract_body JSONB NOT NULL DEFAULT '{}'::jsonb,
  contract_pdf_url TEXT,
  sha256_hash VARCHAR(64) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'REVOKED')),
  effective_start_date DATE NOT NULL,
  effective_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger on tsign_contracts
DROP TRIGGER IF EXISTS trg_tsign_contracts_updated_at ON public.tsign_contracts;
CREATE TRIGGER trg_tsign_contracts_updated_at
  BEFORE UPDATE ON public.tsign_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_timestamp();

-- Indices for tsign_contracts
CREATE INDEX IF NOT EXISTS idx_tsign_contracts_tenant_status ON public.tsign_contracts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tsign_contracts_workforce ON public.tsign_contracts (workforce_id);
CREATE INDEX IF NOT EXISTS idx_tsign_contracts_hash ON public.tsign_contracts (sha256_hash);
CREATE INDEX IF NOT EXISTS idx_tsign_contracts_phone ON public.tsign_contracts (employee_phone);

-- RLS for tsign_contracts
ALTER TABLE public.tsign_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tsign_contracts_select" ON public.tsign_contracts;
CREATE POLICY "tsign_contracts_select" ON public.tsign_contracts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tsign_contracts.workforce_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tsign_contracts_tenant_manage" ON public.tsign_contracts;
CREATE POLICY "tsign_contracts_tenant_manage" ON public.tsign_contracts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tsign_contracts.tenant_id AND t.owner_user_id = auth.uid()));


-- ============================================================================
-- 9. TCHECK_LOGS (Attendance and patrol records: GPS, QR, NFC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tcheck_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workforce_id UUID NOT NULL REFERENCES public.store_workforce(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  check_type VARCHAR(30) NOT NULL DEFAULT 'CHECK_IN'
    CHECK (check_type IN ('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'PATROL_WAYPOINT')),
  verification_method VARCHAR(20) NOT NULL DEFAULT 'GPS'
    CHECK (verification_method IN ('GPS', 'QR', 'NFC', 'BLUETOOTH', 'MANUAL')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy_meters DOUBLE PRECISION,
  distance_from_center_meters DOUBLE PRECISION,
  is_geofence_verified BOOLEAN NOT NULL DEFAULT true,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for tcheck_logs
CREATE INDEX IF NOT EXISTS idx_tcheck_logs_tenant_time ON public.tcheck_logs (tenant_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_tcheck_logs_workforce_time ON public.tcheck_logs (workforce_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_tcheck_logs_check_type ON public.tcheck_logs (check_type, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_tcheck_logs_user ON public.tcheck_logs (user_id);

-- RLS for tcheck_logs
ALTER TABLE public.tcheck_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tcheck_logs_select" ON public.tcheck_logs;
CREATE POLICY "tcheck_logs_select" ON public.tcheck_logs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tcheck_logs.workforce_id AND w.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tcheck_logs.tenant_id AND t.owner_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tcheck_logs_insert" ON public.tcheck_logs;
CREATE POLICY "tcheck_logs_insert" ON public.tcheck_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.store_workforce w WHERE w.id = tcheck_logs.workforce_id AND w.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = tcheck_logs.tenant_id AND t.owner_user_id = auth.uid())
  );
