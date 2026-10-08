-- 링크 카드 썸네일·가격 지원. 기존 컬럼과 데이터는 그대로 두고 nullable 컬럼 2개만 추가한다.
-- partner_page 함수는 두 값을 함께 돌려주도록 교체한다(조건·정렬은 기존과 동일).
-- 20261005100000_partner_page_fix.sql 실행 후에 실행한다. 여러 번 실행해도 안전하다.

alter table public.user_links add column if not exists image_url text;
alter table public.user_links add column if not exists price text;

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
            'platform_type', l.platform_type,
            'image_url', l.image_url,
            'price', l.price
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
