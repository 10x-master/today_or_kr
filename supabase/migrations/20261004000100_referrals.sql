-- 추천 관계 함수. profiles는 본인 행만 읽을 수 있으므로(RLS),
-- 다른 회원의 존재 여부 확인과 직속 파트너 조회는 security definer 함수로만 허용한다.
-- profiles 테이블 생성 SQL(20261004000000_profiles.sql) 실행 후에 실행한다.

-- 추천 코드를 등록한다. 존재하지 않는 코드·본인 코드는 거절하고,
-- 이미 추천인이 정해진 회원은 바꾸지 않는다.
create or replace function public.claim_referrer(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
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
  if v_target = v_uid then
    raise exception 'self_referral';
  end if;

  update public.profiles
  set referred_by = p_code, updated_at = now()
  where id = v_uid and referred_by is null;

  return p_code;
end;
$$;

-- 내 추천 코드로 가입한 직속 파트너 목록. 연락처 등 개인정보는 내보내지 않는다.
create or replace function public.my_partners()
returns table (name text, joined_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select p.name, p.created_at
  from public.profiles p
  where p.referred_by = (
    select me.referral_code from public.profiles me where me.id = auth.uid()
  )
  order by p.created_at desc;
$$;

revoke all on function public.claim_referrer(text) from public, anon;
revoke all on function public.my_partners() from public, anon;
grant execute on function public.claim_referrer(text) to authenticated;
grant execute on function public.my_partners() to authenticated;
