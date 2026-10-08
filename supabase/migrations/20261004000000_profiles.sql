-- 회원 프로필 테이블. Supabase Auth 사용자(auth.users)와 1:1로 연결된다.
-- Supabase 대시보드 SQL Editor에서 한 번 실행한다.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text,
  -- 추천 링크(?ref=코드)에 쓰는 코드. 계정 ID 앞 8자리로 만든다.
  referral_code text not null unique,
  -- 가입 시 받은 추천 코드(추천인). 존재 여부는 앱에서 확인한다.
  referred_by text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 행만 읽고, 쓰고, 고칠 수 있다.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 새 사용자가 생기면 프로필 행을 자동으로 만든다. (Google·Kakao 첫 로그인 시 실행)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    substr(replace(new.id::text, '-', ''), 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
