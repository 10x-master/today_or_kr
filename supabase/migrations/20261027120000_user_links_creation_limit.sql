-- 링크픽 어뷰징 방지: 일반 회원 기준 쿠팡 제휴 상품 카드 최대 30개, 그 외 외부 링크 최대 50개.
-- user_links는 클라이언트가 PostgREST(Supabase REST API)로 직접 insert하므로, 이 경계에서
-- 트리거로 막아야 실제 API 레벨 강제가 된다 (프론트엔드 검증은 lib/linkpick/links.ts 참고, 우회 가능).
-- Supabase 대시보드 SQL Editor에서 한 번 실행한다. 여러 번 실행해도 안전하다.

create or replace function public.enforce_user_links_creation_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_count integer;
begin
  if new.platform_type = 'coupang' then
    select count(*) into existing_count
      from public.user_links
      where profile_id = new.profile_id and platform_type = 'coupang';
    if existing_count >= 30 then
      raise exception '쿠팡 제휴 상품 카드는 최대 30개까지 등록할 수 있습니다.' using errcode = 'P0001';
    end if;
  else
    select count(*) into existing_count
      from public.user_links
      where profile_id = new.profile_id and platform_type <> 'coupang';
    if existing_count >= 50 then
      raise exception '외부 링크는 최대 50개까지 등록할 수 있습니다.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists user_links_creation_limit on public.user_links;
create trigger user_links_creation_limit
  before insert on public.user_links
  for each row
  execute function public.enforce_user_links_creation_limit();
