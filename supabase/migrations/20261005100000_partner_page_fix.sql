-- partner_page 함수 보완: 추천 코드 비교를 대소문자·앞뒤 공백에 둔감하게 바꾼다.
-- 20261005000000_user_links.sql 실행 후에 실행한다. create or replace라서 여러 번 실행해도 안전하다.

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
  where lower(btrim(p.referral_code)) = lower(btrim(p_code))
  limit 1;
$$;

revoke all on function public.partner_page(text) from public;
grant execute on function public.partner_page(text) to anon, authenticated;
