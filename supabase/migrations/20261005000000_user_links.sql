-- 파트너 멀티링크 테이블(user_links)과 공개 파트너 페이지 조회 함수.
-- profiles.id는 uuid(auth.users.id와 동일)이므로 profile_id도 uuid로 맞춘다.
-- Supabase 대시보드 SQL Editor에서 한 번 실행한다. 여러 번 실행해도 안전하다.

create table if not exists public.user_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  platform_type text not null default 'coupang'
    check (platform_type in ('coupang', 'tiktok', 'smartstore', 'deal', 'custom')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_links_profile_sort_idx
  on public.user_links (profile_id, sort_order);

alter table public.user_links enable row level security;

-- 공개: 활성화된 링크는 비로그인 포함 누구나 읽을 수 있다.
drop policy if exists "user_links_select_active" on public.user_links;
create policy "user_links_select_active" on public.user_links
  for select to anon, authenticated
  using (is_active = true);

-- 본인: 비활성 링크 포함 내 링크를 전부 읽는다 (관리 화면용).
drop policy if exists "user_links_select_own" on public.user_links;
create policy "user_links_select_own" on public.user_links
  for select to authenticated
  using ((select auth.uid()) = profile_id);

-- 본인 링크만 추가, 수정, 삭제할 수 있다.
drop policy if exists "user_links_insert_own" on public.user_links;
create policy "user_links_insert_own" on public.user_links
  for insert to authenticated
  with check ((select auth.uid()) = profile_id);

drop policy if exists "user_links_update_own" on public.user_links;
create policy "user_links_update_own" on public.user_links
  for update to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

drop policy if exists "user_links_delete_own" on public.user_links;
create policy "user_links_delete_own" on public.user_links
  for delete to authenticated
  using ((select auth.uid()) = profile_id);

-- 추천 코드로 파트너 공개 페이지 데이터를 가져온다.
-- 연락처 등 개인정보는 내보내지 않고, 표시명과 활성 링크만 돌려준다. 코드가 없으면 null.
create or replace function public.partner_page(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(p.name), '')),
    'links', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'title', l.title,
            'url', l.url,
            'description', l.description,
            'platform_type', l.platform_type
          )
          order by l.sort_order, l.created_at
        )
        from public.user_links l
        where l.profile_id = p.id and l.is_active = true
      ),
      '[]'::jsonb
    )
  )
  from public.profiles p
  where p.referral_code = p_code
  limit 1;
$$;

revoke all on function public.partner_page(text) from public;
grant execute on function public.partner_page(text) to anon, authenticated;
