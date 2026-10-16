/**
 * t.노트 스마트 알림 큐 — 공통 정렬 알고리즘.
 * ① 중요도(is_important) 항목: target_alert_date 기준 D-7부터 최상단 (가까운 순)
 * ② 당일(Today) 항목: 최근 작성/업데이트 순 (Latest First)
 * today_notes/diary_events 등 서로 다른 출처를 공통 모양으로 정규화해 함께 정렬한다.
 */

export interface AlertSourceItem {
  id: string;
  title: string;
  /** 기준 날짜 ("YYYY-MM-DD") — due_date 또는 event_date */
  dateStr: string | null;
  isImportant: boolean;
  reminderDaysBefore: number;
  targetAlertDate: string | null;
  /** 정렬용 최근 작성/수정 시각 (ISO) */
  sortTimestamp: string | null;
  href: string;
  sourceLabel: string;
}

export interface ImportantAlertItem extends AlertSourceItem {
  daysLeft: number;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function classifyAlertQueue(items: AlertSourceItem[], now: Date = new Date()) {
  const todayStr = toDateStr(now);
  const important: ImportantAlertItem[] = [];
  const today: AlertSourceItem[] = [];
  const importantIds = new Set<string>();

  for (const item of items) {
    if (item.isImportant) {
      const alertBase = item.targetAlertDate || item.dateStr;
      if (alertBase) {
        const alertDate = new Date(alertBase);
        const daysLeft = Math.ceil((alertDate.getTime() - now.getTime()) / 86400000);
        const windowDays = item.reminderDaysBefore ?? 7;
        if (daysLeft >= 0 && daysLeft <= windowDays) {
          important.push({ ...item, daysLeft });
          importantIds.add(item.id);
        }
      }
    }
  }

  for (const item of items) {
    if (importantIds.has(item.id)) continue; // 중요 알림으로 이미 노출된 항목은 당일 큐에서 중복 제외
    if (item.dateStr === todayStr) {
      today.push(item);
    }
  }

  important.sort((a, b) => a.daysLeft - b.daysLeft);
  today.sort((a, b) => (b.sortTimestamp || "").localeCompare(a.sortTimestamp || ""));

  return { important, today };
}
