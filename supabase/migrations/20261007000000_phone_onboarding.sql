-- 전화번호 기반 계정 통합(온보딩).
-- 구글·카카오처럼 로그인 수단이 다르면 auth 사용자가 달라서 프로필도 갈라진다.
-- 알림톡 인증으로 확인한 전화번호가 같으면, 새 로그인을 기존 프로필에 연결해 한 계정처럼 쓰게 한다.
-- Supabase 대시보드 SQL Editor에서 한 번 실행한다. 여러 번 실행해도 안전하다 (idempotent).

-- 1. 전화번호 정규화: 숫자만 남긴다 (010-1234-5678 → 01012345678). 빈 값은 NULL로 바꾼다.
update public.profiles
set phone = nullif(regexp_replace(phone, '\D', '', 'g'), ''),
    updated_at = now()
where phone is distinct from nullif(regexp_replace(phone, '\D', '', 'g'), '');

-- 2. 같은 번호가 두 프로필에 있으면 자동으로 지우지 않고 멈춘다. 직접 확인해서 정리한 뒤 다시 실행한다.
do $$
begin
  if exists (
    select 1 from public.profiles
    where phone is not null
    group by phone
    having count(*) > 1
  ) then
    raise exception '같은 전화번호를 쓰는 프로필이 여러 개 있습니다. 중복을 정리한 뒤 다시 실행해 주세요.';
  end if;
end $$;

-- 전화번호는 프로필 한 개에만 묶인다. NULL은 여러 개여도 된다.
create unique index if not exists profiles_phone_uidx on public.profiles (phone);

-- 3. 로그인 사용자 → 프로필 연결표. 두 번째 로그인(예: 카카오)이 기존 프로필을 가리킨다.
create table if not exists public.account_links (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  linked_at timestamptz not null default now()
);

alter table public.account_links enable row level security;

drop policy if exists "account_links_select_own" on public.account_links;
create policy "account_links_select_own" on public.account_links
  for select to authenticated
  using ((select auth.uid()) = auth_user_id);
-- 쓰기 정책은 없다. 연결은 merge_or_create_profile 함수만 만든다.

-- 현재 로그인이 바라보는 프로필 id. 연결된 로그인이면 기존 프로필, 아니면 자기 자신이다.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select l.profile_id from public.account_links l where l.auth_user_id = auth.uid()),
    auth.uid()
  );
$$;

-- 4. 프로필 RLS: 연결된 로그인도 기존 프로필 행을 읽고 고칠 수 있게 한다.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select public.current_profile_id()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select public.current_profile_id()))
  with check (id = (select public.current_profile_id()));

-- 클라이언트는 프로필을 직접 만들거나 전화번호를 고칠 수 없다. 전화번호는 인증을 거친 함수로만 들어간다.
-- 테이블 단위 권한이 있으면 열 단위 취소가 먹히지 않으므로 먼저 걷어내고 필요한 열만 다시 준다.
revoke insert on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (name, display_name, updated_at) on public.profiles to authenticated;

-- 5. 추천인 연결과 파트너 목록도 현재 프로필 기준으로 바꾼다.
create or replace function public.claim_referrer(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.current_profile_id();
  v_uid uuid := auth.uid();
  v_target uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id into v_target
  from public.profiles
  where referral_code = p_code;

  if v_target is null then
    raise exception 'invalid_referral';
  end if;
  if v_target = v_me then
    raise exception 'self_referral';
  end if;

  update public.profiles
  set referred_by = p_code, updated_at = now()
  where id = v_me and referred_by is null;

  return p_code;
end;
$$;

create or replace function public.my_partners()
returns table (name text, joined_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select p.name, p.created_at
  from public.profiles p
  where p.referred_by = (
    select me.referral_code from public.profiles me where me.id = public.current_profile_id()
  )
  order by p.created_at desc;
$$;

-- 6. 사용자 링크 RLS: 연결된 로그인도 기존 프로필의 링크를 보고 고칠 수 있게 한다.
drop policy if exists "user_links_select_own" on public.user_links;
create policy "user_links_select_own" on public.user_links
  for select to authenticated
  using (profile_id = (select public.current_profile_id()));

drop policy if exists "user_links_insert_own" on public.user_links;
create policy "user_links_insert_own" on public.user_links
  for insert to authenticated
  with check (profile_id = (select public.current_profile_id()));

drop policy if exists "user_links_update_own" on public.user_links;
create policy "user_links_update_own" on public.user_links
  for update to authenticated
  using (profile_id = (select public.current_profile_id()))
  with check (profile_id = (select public.current_profile_id()));

drop policy if exists "user_links_delete_own" on public.user_links;
create policy "user_links_delete_own" on public.user_links
  for delete to authenticated
  using (profile_id = (select public.current_profile_id()));

-- 7. 인증번호 임시 저장 테이블. 번호와 인증번호의 해시만 둔다. 클라이언트는 직접 읽을 수 없다.
create table if not exists public.phone_verifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists phone_verifications_phone_idx
  on public.phone_verifications (phone, created_at desc);

alter table public.phone_verifications enable row level security;
-- 정책을 만들지 않는다. 아래 함수(security definer)로만 다룬다.

-- 8. 인증번호 발급 기록. 같은 번호는 60초에 한 번만 받을 수 있다. 유효시간은 3분이다.
create or replace function public.request_phone_verification(p_phone text, p_code_hash text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_last timestamptz;
  v_expires timestamptz := now() + interval '3 minutes';
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_phone !~ '^01[016789][0-9]{7,8}$' then
    raise exception 'invalid_phone';
  end if;

  select max(created_at) into v_last
  from public.phone_verifications
  where phone = p_phone;

  if v_last is not null and v_last > now() - interval '60 seconds' then
    raise exception 'too_frequent';
  end if;

  delete from public.phone_verifications where phone = p_phone;

  insert into public.phone_verifications (user_id, phone, code_hash, expires_at)
  values (v_uid, p_phone, p_code_hash, v_expires);

  return v_expires;
end;
$$;

-- 9. 인증번호 확인. 틀리면 시도 횟수를 올린다. 결과는 문자열로 돌려준다.
-- (예외로 던지면 시도 횟수 증가가 함께 취소되므로 예외를 쓰지 않는다.)
-- 결과: ok · mismatch · expired · too_many
create or replace function public.verify_phone_code(p_phone text, p_code_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.phone_verifications;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_row
  from public.phone_verifications
  where phone = p_phone and user_id = v_uid
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'no_request';
  end if;
  if v_row.verified then
    return 'ok';
  end if;
  if v_row.expires_at <= now() then
    return 'expired';
  end if;
  if v_row.attempts >= 5 then
    return 'too_many';
  end if;
  if v_row.code_hash <> p_code_hash then
    update public.phone_verifications set attempts = attempts + 1 where id = v_row.id;
    return 'mismatch';
  end if;

  update public.phone_verifications
  set verified = true, verified_at = now()
  where id = v_row.id;

  return 'ok';
end;
$$;

-- 10. 계정 통합 또는 신규 생성.
-- - 이미 이 로그인에 연결된 프로필에 같은 번호가 있으면 그대로 돌려준다.
-- - 같은 번호의 다른 프로필이 있으면 이 로그인을 그 프로필에 연결하고, 프로필은 새로 만들지 않는다.
-- - 없으면 이 로그인의 프로필에 번호와 이름을 붙인다.
-- 번호 인증(verify_phone_code → ok)을 최근 10분 안에 마쳐야 한다.
create or replace function public.merge_or_create_profile(
  p_phone text,
  p_display_name text,
  p_consent boolean default false
)
returns table (out_profile_id uuid, out_referral_code text, out_merged boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current uuid;
  v_current_phone text;
  v_current_code text;
  v_target_id uuid;
  v_target_code text;
  v_name text := left(btrim(coalesce(p_display_name, '')), 30);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_phone !~ '^01[016789][0-9]{7,8}$' then
    raise exception 'invalid_phone';
  end if;
  if not p_consent then
    raise exception 'consent_required';
  end if;
  if v_name = '' then
    raise exception 'name_required';
  end if;

  -- 1) 이 로그인이 이미 바라보는 프로필
  v_current := coalesce(
    (select l.profile_id from public.account_links l where l.auth_user_id = v_uid),
    v_uid
  );
  select p.phone, p.referral_code into v_current_phone, v_current_code
  from public.profiles p
  where p.id = v_current;

  if v_current_phone is not null then
    if v_current_phone <> p_phone then
      raise exception 'already_registered';
    end if;
    return query select v_current, v_current_code, false;
    return;
  end if;

  -- 2) 번호 인증이 이 로그인으로 최근에 끝났는지 확인한다.
  if not exists (
    select 1
    from public.phone_verifications pv
    where pv.phone = p_phone
      and pv.user_id = v_uid
      and pv.verified
      and pv.verified_at > now() - interval '10 minutes'
  ) then
    raise exception 'phone_not_verified';
  end if;

  -- 3) 같은 번호의 기존 프로필이 있으면 이 로그인을 거기에 연결한다.
  select p.id, p.referral_code into v_target_id, v_target_code
  from public.profiles p
  where p.phone = p_phone
  limit 1;

  if v_target_id is not null then
    insert into public.account_links (auth_user_id, profile_id)
    values (v_uid, v_target_id)
    on conflict (auth_user_id) do update set profile_id = excluded.profile_id, linked_at = now();

    update public.profiles
    set consent_at = coalesce(consent_at, now()), updated_at = now()
    where id = v_target_id;

    delete from public.phone_verifications where phone = p_phone;
    return query select v_target_id, v_target_code, true;
    return;
  end if;

  -- 4) 신규: 이 로그인의 프로필에 번호와 이름을 붙인다. 트리거가 만든 행이 보통 있다.
  update public.profiles
  set phone = p_phone,
      name = v_name,
      display_name = v_name,
      consent_at = now(),
      updated_at = now()
  where id = v_uid
  returning referral_code into v_current_code;

  if not found then
    v_current_code := substr(replace(v_uid::text, '-', ''), 1, 8);
    insert into public.profiles (id, name, display_name, phone, referral_code, consent_at)
    values (v_uid, v_name, v_name, p_phone, v_current_code, now());
  end if;

  delete from public.phone_verifications where phone = p_phone;
  return query select v_uid, v_current_code, false;
end;
$$;

-- 함수 실행 권한: 로그인 사용자만. 익명 사용자는 어떤 함수도 쓸 수 없다.
revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.request_phone_verification(text, text) from public, anon;
revoke all on function public.verify_phone_code(text, text) from public, anon;
revoke all on function public.merge_or_create_profile(text, text, boolean) from public, anon;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.request_phone_verification(text, text) to authenticated;
grant execute on function public.verify_phone_code(text, text) to authenticated;
grant execute on function public.merge_or_create_profile(text, text, boolean) to authenticated;
