import type { NoteCategory, ParsedNoteData } from "@/types/note";

/**
 * 한국어 자연어 문장 분석 및 구조화 파서
 * 예: "내일 오후 3시 상계주공 14단지 관리소 미팅 10분 전 알람"
 */
export function parseKoreanNaturalLanguage(rawText: string): ParsedNoteData {
  const text = rawText.trim();
  let cleanTitle = text;
  let targetYear: number | null = null;
  let targetMonth: number | null = null;
  let targetDay: number | null = null;
  let targetHour: number | null = null;
  let targetMinute: number | null = null;

  const now = new Date();

  // ==========================================================================
  // 1. 날짜 추출 ("오늘", "내일", "모레", "글피", "X월 Y일", "N일 뒤", 요일)
  // ==========================================================================
  if (/오늘/.test(text)) {
    targetYear = now.getFullYear();
    targetMonth = now.getMonth();
    targetDay = now.getDate();
    cleanTitle = cleanTitle.replace(/오늘\s*/g, "");
  } else if (/내일/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
    targetDay = d.getDate();
    cleanTitle = cleanTitle.replace(/내일\s*/g, "");
  } else if (/모레/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
    targetDay = d.getDate();
    cleanTitle = cleanTitle.replace(/모레\s*/g, "");
  } else if (/글피/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
    targetDay = d.getDate();
    cleanTitle = cleanTitle.replace(/글피\s*/g, "");
  } else {
    // "N일 뒤" / "N일 후"
    const daysAfterMatch = text.match(/(\d+)\s*일\s*(?:뒤|후)/);
    if (daysAfterMatch) {
      const addDays = parseInt(daysAfterMatch[1], 10);
      const d = new Date(now);
      d.setDate(d.getDate() + addDays);
      targetYear = d.getFullYear();
      targetMonth = d.getMonth();
      targetDay = d.getDate();
      cleanTitle = cleanTitle.replace(/\d+\s*일\s*(?:뒤|후)\s*/g, "");
    }

    // "YYYY년 M월 D일" 또는 "M월 D일"
    const fullDateMatch = text.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
    if (fullDateMatch) {
      targetYear = fullDateMatch[1] ? parseInt(fullDateMatch[1], 10) : now.getFullYear();
      targetMonth = parseInt(fullDateMatch[2], 10) - 1;
      targetDay = parseInt(fullDateMatch[3], 10);
      cleanTitle = cleanTitle.replace(/(?:\d{4}년\s*)?\d{1,2}월\s*\d{1,2}일\s*/g, "");
    }

    // 요일 파싱 (이번주/다음주 수요일 등)
    const dayOfWeekMatch = text.match(/(이번주|다음주)?\s*([월화수목금토일])(?:요일)?/);
    if (dayOfWeekMatch && targetDay === null) {
      const isNextWeek = dayOfWeekMatch[1] === "다음주";
      const daysMap: Record<string, number> = {
        일: 0,
        월: 1,
        화: 2,
        수: 3,
        목: 4,
        금: 5,
        토: 6,
      };
      const targetDayOfWeek = daysMap[dayOfWeekMatch[2]];
      const currentDayOfWeek = now.getDay();
      let diff = targetDayOfWeek - currentDayOfWeek;
      if (diff <= 0) diff += 7;
      if (isNextWeek) diff += 7;

      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      targetYear = d.getFullYear();
      targetMonth = d.getMonth();
      targetDay = d.getDate();
      cleanTitle = cleanTitle.replace(/(?:이번주|다음주)?\s*[월화수목금토일](?:요일)?\s*/g, "");
    }
  }

  // ==========================================================================
  // 2. 시간 추출 ("오후 3시", "오전 9시 30분", "15시", "점심", "저녁")
  // ==========================================================================
  const pmMatch = text.match(/오후\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  const amMatch = text.match(/오전\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  const generalTimeMatch = text.match(/(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  const lunchMatch = /점심(?:시간)?/.test(text);
  const dinnerMatch = /저녁(?:시간)?/.test(text);

  if (pmMatch) {
    let hour = parseInt(pmMatch[1], 10);
    if (hour < 12) hour += 12;
    targetHour = hour;
    targetMinute = pmMatch[2] ? parseInt(pmMatch[2], 10) : 0;
    cleanTitle = cleanTitle.replace(/오후\s*\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  } else if (amMatch) {
    let hour = parseInt(amMatch[1], 10);
    if (hour === 12) hour = 0;
    targetHour = hour;
    targetMinute = amMatch[2] ? parseInt(amMatch[2], 10) : 0;
    cleanTitle = cleanTitle.replace(/오전\s*\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  } else if (lunchMatch) {
    targetHour = 12;
    targetMinute = 30;
    cleanTitle = cleanTitle.replace(/점심(?:시간)?\s*/g, "");
  } else if (dinnerMatch) {
    targetHour = 18;
    targetMinute = 30;
    cleanTitle = cleanTitle.replace(/저녁(?:시간)?\s*/g, "");
  } else if (generalTimeMatch) {
    let hour = parseInt(generalTimeMatch[1], 10);
    // 1시~6시 단독 입력 시 오후로 추정
    if (hour >= 1 && hour <= 6 && !/오전/.test(text)) {
      hour += 12;
    }
    targetHour = hour;
    targetMinute = generalTimeMatch[2] ? parseInt(generalTimeMatch[2], 10) : 0;
    cleanTitle = cleanTitle.replace(/\d{1,2}시(?:\s*\d{1,2}분)?\s*/g, "");
  }

  // ISO 문자열 조립
  let scheduled_at: string | null = null;
  if (targetYear !== null && targetMonth !== null && targetDay !== null) {
    const finalHour = targetHour !== null ? targetHour : 10;
    const finalMinute = targetMinute !== null ? targetMinute : 0;
    const schedDate = new Date(targetYear, targetMonth, targetDay, finalHour, finalMinute, 0, 0);
    scheduled_at = schedDate.toISOString();
  } else if (targetHour !== null) {
    // 날짜 언급 없이 시간만 언급된 경우 (예: "오후 3시 미팅") -> 오늘 또는 내일로 설정
    const d = new Date(now);
    if (d.getHours() > targetHour) {
      d.setDate(d.getDate() + 1); // 이미 지난 시간이면 내일
    }
    d.setHours(targetHour, targetMinute || 0, 0, 0);
    scheduled_at = d.toISOString();
  }

  // ==========================================================================
  // 3. 장소(Location) 추출
  // ==========================================================================
  let location: string | null = null;

  // 장소 조사 '에서', '앞에서' 직전 명사 추출
  const locationParticleMatch = text.match(/([가-힣0-9\s]+?)(?:에서|앞에서)/);
  if (locationParticleMatch) {
    const candidate = locationParticleMatch[1]
      .replace(/오늘|내일|모레|글피|오후|오전|\d+시|\d+분/g, "")
      .trim();
    if (candidate.length >= 2) {
      location = candidate;
    }
  }

  if (!location) {
    // 복합 로컬 시설 패턴 ("상계주공 14단지 관리소", "노원구청", "스타벅스 상계점" 등)
    const facilityRegex =
      /([가-힣0-9]+(?:\s+[가-힣0-9]+)*?\s*(?:\d+단지|\d+호|\d+층|\d+동)?\s*(?:관리사무소|관리소|주민센터|구청|시청|역|초등학교|중학교|고등학교|아파트|빌딩|센터|타운|라운지|회의실|사무실|현장|카페|점))/;
    const facilityMatch = cleanTitle.match(facilityRegex);
    if (facilityMatch) {
      location = facilityMatch[1].trim();
    }
  }

  // ==========================================================================
  // 4. 카테고리(Category) 분류: 'PLACE' | 'PERSON' | 'WORK' | 'TRAVEL' (기본: 'WORK')
  // ==========================================================================
  let category: NoteCategory = "WORK";

  if (/(출장|KTX|SRT|공항|비행기|터미널|이동|여행|호텔|드라이브|기차)/.test(text)) {
    category = "TRAVEL";
  } else if (
    /(동대표|소장님|주민|입주민|인터뷰|상담|약속|모임|친구|부모님|티타임|회식|가족|지인)/.test(
      text
    )
  ) {
    category = "PERSON";
  } else if (
    /(카페|베이커리|식당|맛집|상가|모델하우스|임장|현장방문|투어|공원|도서관|피트니스|헬스장|병원)/.test(
      text
    )
  ) {
    category = "PLACE";
  } else {
    // 미팅, 회의, 업무, 점검, 공사, 계약, 결재, 기본값 WORK
    category = "WORK";
  }

  // ==========================================================================
  // 5. 할 일(is_todo) 판단
  // ==========================================================================
  const is_todo =
    /(미팅|회의|방문|참석|점검|하기|할것|제출|확인|작성|완료|결재|보내기|처리|송금|등록|예약|신청|연락|전화|구매|수리|조사)/.test(
      text
    ) || scheduled_at !== null;

  // ==========================================================================
  // 6. 알림 문구 정리 및 제목(Title) 추출
  // ==========================================================================
  cleanTitle = cleanTitle
    .replace(/\d+분\s*전\s*(?:알람|알림)?/g, "")
    .replace(/(?:알람|알림)\s*(?:해줘|설정|등록|켜줘)?/g, "")
    .replace(/(?:에서|앞에서)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // 제목 정제: 아무것도 안 남았으면 원본 텍스트 사용
  const finalTitle = cleanTitle || text;

  return {
    title: finalTitle,
    scheduled_at,
    location,
    category,
    is_todo,
    raw_text: text,
    reminder_minutes: 10, // 기본 10분 전 알림
  };
}
