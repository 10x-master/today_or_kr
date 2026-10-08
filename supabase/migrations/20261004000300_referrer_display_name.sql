-- 추천 링크 안내 배너용: 추천 코드로 추천인의 표시명만 조회한다.
-- profiles는 본인 행만 읽을 수 있으므로(RLS), 비로그인 방문자도 쓸 수 있도록
-- 표시명 한 값만 돌려주는 security definer 함수로 연다. 연락처·이메일 등은 내보내지 않는다.
-- Supabase 대시보드 SQL Editor에서 한 번 실행한다. 여러 번 실행해도 안전하다.

create or replace function public.referrer_display_name(p_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(p.name), ''))
  from public.profiles p
  where p.referral_code = p_code
  limit 1;
$$;

revoke all on function public.referrer_display_name(text) from public;
grant execute on function public.referrer_display_name(text) to anon, authenticated;
