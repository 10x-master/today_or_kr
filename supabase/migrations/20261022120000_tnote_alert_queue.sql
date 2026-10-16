-- ==============================================================================
-- T.노트 스마트 알림 큐 (중요도 D-7 선제 알림 + 당일 실시간 알람) + 앱 아이콘 v4
-- ==============================================================================

-- 1. today_notes 알림 큐 컬럼
ALTER TABLE public.today_notes
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_alert_date TIMESTAMPTZ;

-- 2. diary_events 알림 큐 컬럼
ALTER TABLE public.diary_events
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_alert_date TIMESTAMPTZ;

-- 3. 앱 아이콘 v4 (대문자 'T' 볼드 심볼) 캐시 버전 갱신
UPDATE public.app_pwa_settings
SET
  icon_192_url = '/icons/today-192.png?v=4',
  icon_512_url = '/icons/today-512.png?v=4',
  updated_at = NOW()
WHERE app_target = 'TODAY_MAIN';

-- 4. 8대 핵심 시드: 당일 일정 / D-7 중요 행사 데모
INSERT INTO public.diary_events (diary_id, title, description, event_date, is_public, send_alimtalk, media_type, target_roles, target_grades, is_important, reminder_days_before, target_alert_date)
SELECT d.id, v.title, v.description, v.event_date::DATE, v.is_public, v.send_alimtalk, 'NONE', ARRAY['ALL'], ARRAY['ALL'], v.is_important, v.reminder_days_before, v.target_alert_date::TIMESTAMPTZ
FROM (
  VALUES
    ('linkpick', '링크픽 신규 파트너 온보딩 미팅', '오늘 오후 신규 추천샵 파트너 온보딩 및 수수료 정책 안내', '2026-10-16', true, false, false, 7, NULL),
    ('aptlink', '아파트링크 전국 단지 품질 점검 보고회', '전국 가입 단지 대상 분기별 품질 점검 결과 보고회', '2026-10-23', true, true, true, 7, '2026-10-23T10:00:00.000Z'),
    ('procurement-infra', '조달 입찰 서류 당일 마감 안내', '오늘 18시까지 입찰 참가 서류 제출 마감', '2026-10-16', false, true, false, 7, NULL),
    ('sme-transform', '사업전환지원단 4분기 심사위원회', '4분기 사업전환계획 승인 심사위원회 개최', '2026-10-23', true, true, true, 7, '2026-10-23T09:00:00.000Z'),
    ('well-global', '웰글로벌 신제품 입고 당일 안내', '오늘 신제품 입고 완료, 금일 주문건 우선 배송', '2026-10-16', true, false, false, 7, NULL),
    ('ai-interior-assoc', '한국AI인테리어공간협회 정기총회', '2026년도 정기총회 및 라이선스 갱신 안내', '2026-10-23', true, true, true, 7, '2026-10-23T13:00:00.000Z'),
    ('art-high-school-music', '영광고 관악과 정기 레슨 당일 알림', '오늘 방과후 정기 레슨 시간 변경 안내 (17시 → 17시 30분)', '2026-10-16', false, true, false, 7, NULL),
    ('nowon-youth-center', '노원청년센터 지원사업 접수 마감 D-7', '청년 일자리 지원사업 서류 접수 마감이 일주일 앞으로 다가왔습니다', '2026-10-23', true, true, true, 7, '2026-10-23T18:00:00.000Z')
) AS v(brand_slug, title, description, event_date, is_public, send_alimtalk, is_important, reminder_days_before, target_alert_date)
JOIN public.diaries d ON d.brand_slug = v.brand_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.diary_events e WHERE e.diary_id = d.id AND e.title = v.title
);
