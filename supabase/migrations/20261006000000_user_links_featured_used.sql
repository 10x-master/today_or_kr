-- 추천상품(is_featured)과 사용 완료(is_used) 표시 컬럼. 둘 다 기본값 false라 기존 행은 그대로 동작한다.
-- 20261005300000_user_links_category.sql 실행 후에 실행한다. 여러 번 실행해도 안전하다.

alter table public.user_links add column if not exists is_featured boolean not null default false;
alter table public.user_links add column if not exists is_used boolean not null default false;

-- 공개 조회 함수에 카테고리와 추천 여부를 추가한다. 조건·정렬은 기존과 같다.
-- is_used는 회원만 보는 작업 표시라서 공개 결과에 넣지 않는다.
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
            'price', l.price,
            'category', l.category,
            'is_featured', l.is_featured
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
