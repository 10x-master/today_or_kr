-- 표시명(display_name) 추가, referral_code 고유 인덱스 확인, 기존 회원 기본값 채우기.
-- Supabase 대시보드 SQL Editor에서 profiles 테이블 생성 SQL 이후에 한 번 실행한다.
-- 여러 번 실행해도 안전하다 (idempotent).

-- 1. 표시명: 추천 링크·랜딩페이지에 노출되는 한글 이름/브랜드명/직함.
alter table public.profiles
  add column if not exists display_name text not null default '';

-- 2. referral_code 고유 인덱스. 20261004000000_profiles.sql의 UNIQUE 제약으로 이미 있으면 건너뛴다.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_attribute a
      on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.profiles'::regclass
      and i.indisunique
      and i.indnatts = 1
      and a.attname = 'referral_code'
  ) then
    create unique index profiles_referral_code_uidx on public.profiles (referral_code);
  end if;
end $$;

-- 3-1. referral_code가 빈 회원에게 8자리 난수 코드를 준다.
-- gen_random_uuid()는 암호학적으로 안전한 난수라서 확장(pgcrypto) 없이 쓸 수 있다.
-- 헷갈리는 0·O·1·I를 뺀 32자 알파벳을 쓰므로 바이트 % 32로 치우침 없이 뽑힌다.
do $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  r record;
  bytes bytea;
  code text;
begin
  for r in select id from public.profiles where referral_code = '' loop
    loop
      bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
      code := '';
      for i in 0..7 loop
        code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
      end loop;
      -- 드물게 겹치면 다시 뽑는다.
      exit when not exists (select 1 from public.profiles where referral_code = code);
    end loop;

    update public.profiles
    set referral_code = code, updated_at = now()
    where id = r.id;
  end loop;
end $$;

-- 3-2. display_name이 빈 회원은 닉네임(name)을 쓰고, 닉네임도 없으면 '파트너'로 채운다.
update public.profiles
set display_name = coalesce(nullif(btrim(name), ''), '파트너'),
    updated_at = now()
where btrim(display_name) = '';
