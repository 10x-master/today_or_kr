-- 큐레이션 작업대의 카테고리 태그 저장용 컬럼. nullable이라 기존 행과 공개 조회(partner_page)에는 영향이 없다.
-- 20261005200000_user_links_metadata.sql 실행 후에 실행한다. 여러 번 실행해도 안전하다.

alter table public.user_links add column if not exists category text;
