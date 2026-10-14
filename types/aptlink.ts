/**
 * 아파트링크(AptLink) 공정 입찰 진단 및 장기수선 실무스쿨 데이터 규격
 */

export type ResidentAuthMethod = "RECEIPT" | "APTI_SCREEN" | "ENTRANCE_PHOTO";

export interface AptBidComparisonItem {
  id: string;
  projectTitle: string; // 공사명 (예: "옥상 우레탄 도막 방수 공사")
  bidAmount: number; // 단지 집행액 (원)
  standardAmount: number; // 국토부 CERA-PMS 표준 공사비 (원)
  deviationPercent: number; // 편차율 (%) - 양수면 초과
  executionDate: string;
  bidMethod: string; // "제한경쟁 (적격심사)" 등
  status: "NORMAL" | "OVERPRICED" | "CRITICAL";
  memo: string;
}

export interface AptComplexAuditData {
  complexName: string;
  roadAddress: string;
  dong: string;
  totalUnits: number;
  builtYear: number;
  elapsedYears: number;
  ceraScore: number; // 100점 만점 공정입찰 지수
  rating: "SAFE" | "ATTENTION" | "CRITICAL_LEAK";
  overallDeviationPercent: number; // 전체 표준 대비 편차율 (예: +34.8%)
  estimatedLeakAmount: number; // 추정 누수 금액 (원)
  reserveFundCurrentBalance: number; // 현재 장충금 적립 잔고 (원)
  reserveFundRecommendedRate: number; // ㎡당 권장 적립액
  reserveFundCurrentRate: number; // ㎡당 실제 적립액
  recentBids: AptBidComparisonItem[];
  keyRisks: string[];
  recommendations: string[];
}

export interface KaptGuidelineQaItem {
  id: string;
  category: "항목선정" | "수선주기" | "적립산식" | "입찰방식" | "과태료방어";
  question: string;
  keywords: string[];
  summaryAnswer: string;
  detailedGuideline: string;
  legalBasis: string;
}

/** 전국 대표 아파트 단지 샘플 데이터셋 */
export const MOCK_APT_AUDIT_DATA: Record<string, AptComplexAuditData> = {
  "상계주공 14단지": {
    complexName: "상계주공 14단지",
    roadAddress: "서울특별시 노원구 동일로 1414",
    dong: "상계동",
    totalUnits: 1540,
    builtYear: 1989,
    elapsedYears: 37,
    ceraScore: 68,
    rating: "ATTENTION",
    overallDeviationPercent: 34.8,
    estimatedLeakAmount: 184500000,
    reserveFundCurrentBalance: 1240000000,
    reserveFundRecommendedRate: 285,
    reserveFundCurrentRate: 142,
    recentBids: [
      {
        id: "bid-14-1",
        projectTitle: "옥상 우레탄 복합 방수 및 외벽 균열 보수",
        bidAmount: 485000000,
        standardAmount: 360000000,
        deviationPercent: 34.7,
        executionDate: "2025-11",
        bidMethod: "제한경쟁 (적격심사)",
        status: "OVERPRICED",
        memo: "인근 13단지 유사 규모 공사 대비 ㎡당 단가 35% 상회 (자재 단가 부풀림 의심)",
      },
      {
        id: "bid-14-2",
        projectTitle: "노후 승강기(18대) 메인 와이어로프 및 시브 전면 교체",
        bidAmount: 210000000,
        standardAmount: 165000000,
        deviationPercent: 27.2,
        executionDate: "2025-06",
        bidMethod: "지명경쟁입찰",
        status: "OVERPRICED",
        memo: "승강기안전공단 표준 노무비율 초과 및 수의계약 정황 감지",
      },
      {
        id: "bid-14-3",
        projectTitle: "단지 내 지하주차장 LED 고효율 조명 전면 교체",
        bidAmount: 68000000,
        standardAmount: 72000000,
        deviationPercent: -5.5,
        executionDate: "2024-09",
        bidMethod: "전자입찰 최저가",
        status: "NORMAL",
        memo: "지자체 탄소중립 보조금 30% 수혜 및 정상 입찰 완료",
      },
    ],
    keyRisks: [
      "최근 3개년 대형 수선공사 중 2건이 CERA 표준가 대비 25% 이상 고가 낙찰",
      "장충금 적립 요율이 국토부 권장(㎡당 285원)의 50% 수준에 불과하여 대수선 공사 시 급격한 부과금 폭탄 우려",
      "공동주택관리법 제29조 기준 3년 정기검토 이력의 수선항목 누락 위험",
    ],
    recommendations: [
      "국토부 전자입찰 시스템(K-apt) 공고 전 '사전 원가계산 검증 리포트' 필수 수령",
      "기술사 입회 하에 노후 시설물 수명 실사 후 장기수선계획 수시조정 의결",
      "입주민 10인 공구 청원을 통한 방수/승강기 전문 기술 감사 진행",
    ],
  },
  "상계주공 5단지": {
    complexName: "상계주공 5단지",
    roadAddress: "서울특별시 노원구 한글비석로 415",
    dong: "상계동",
    totalUnits: 840,
    builtYear: 1987,
    elapsedYears: 39,
    ceraScore: 54,
    rating: "CRITICAL_LEAK",
    overallDeviationPercent: 42.5,
    estimatedLeakAmount: 245000000,
    reserveFundCurrentBalance: 610000000,
    reserveFundRecommendedRate: 310,
    reserveFundCurrentRate: 98,
    recentBids: [
      {
        id: "bid-5-1",
        projectTitle: "급수·난방 배관 녹물 방지 세관 및 밸브 교체 공사",
        bidAmount: 340000000,
        standardAmount: 230000000,
        deviationPercent: 47.8,
        executionDate: "2025-08",
        bidMethod: "제한경쟁 (지역업체)",
        status: "CRITICAL",
        memo: "CERA-PMS 원가 산출 대비 재료비 50% 과다 책정 (특정업체 몰아주기 의혹)",
      },
      {
        id: "bid-5-2",
        projectTitle: "단지 외벽 균열 보수 및 고급 수성 페인트 도색",
        bidAmount: 195000000,
        standardAmount: 142000000,
        deviationPercent: 37.3,
        executionDate: "2024-10",
        bidMethod: "적격심사제",
        status: "OVERPRICED",
        memo: "하도급 불법 전대 의혹 및 입찰 담합 지수 78점 위험 등급",
      },
    ],
    keyRisks: [
      "재건축 추진 단계에서 장충금 고갈 및 시급한 노후 배관 공사비 40% 이상 초과 집행",
      "장충금 적립률이 권장액의 30% 수준으로 관리비 연체 및 비대위 갈등 지속",
    ],
    recommendations: [
      "관리주체 및 입대의 대상 긴급 회계 감사 청구서 발송",
      "CERA 공정입찰 표준 가이드라인 즉시 도입",
    ],
  },
  "노원 롯데캐슬 시그니처": {
    complexName: "노원 롯데캐슬 시그니처",
    roadAddress: "서울특별시 노원구 상계로 118",
    dong: "상계동",
    totalUnits: 1163,
    builtYear: 2023,
    elapsedYears: 3,
    ceraScore: 89,
    rating: "SAFE",
    overallDeviationPercent: 4.2,
    estimatedLeakAmount: 12000000,
    reserveFundCurrentBalance: 2450000000,
    reserveFundRecommendedRate: 210,
    reserveFundCurrentRate: 215,
    recentBids: [
      {
        id: "bid-lotte-1",
        projectTitle: "단지 조경 유지관리 및 고사목 하자 대체 식재",
        bidAmount: 42000000,
        standardAmount: 44000000,
        deviationPercent: -4.5,
        executionDate: "2025-04",
        bidMethod: "전자입찰 일반경쟁",
        status: "NORMAL",
        memo: "시공사 3년 차 하자보수 약정과 연계하여 정상 예산 절감 완료",
      },
    ],
    keyRisks: [
      "신축 3년 차 도래에 따른 법정 장기수선계획 최초 정기검토 기산점 점검 필수",
    ],
    recommendations: [
      "하자담보책임 만료(5년/10년) 전 시공사 대상 공용부 비파괴 정밀 안전점검 병행",
    ],
  },
};

/** 기본 검색용 단지 fallback 생성 함수 */
export function getOrCreateAptAudit(complexName: string): AptComplexAuditData {
  if (MOCK_APT_AUDIT_DATA[complexName]) {
    return MOCK_APT_AUDIT_DATA[complexName];
  }

  // 동적 단지 계산 (실감 나는 해시 기반 예측 수치)
  let hash = 0;
  for (let i = 0; i < complexName.length; i++) {
    hash = (hash << 5) - hash + complexName.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const units = 500 + (absHash % 1500);
  const builtYear = 1990 + (absHash % 32);
  const elapsedYears = 2026 - builtYear;
  const deviation = +((absHash % 40) + 5.2).toFixed(1);
  const leak = Math.round((units * 85000 * (deviation / 20)) / 10000) * 10000;
  const score = Math.max(45, Math.min(95, 100 - Math.round(deviation * 1.1)));

  return {
    complexName,
    roadAddress: `서울특별시 노원구 ${complexName}`,
    dong: "상계동",
    totalUnits: units,
    builtYear,
    elapsedYears,
    ceraScore: score,
    rating: deviation > 30 ? "CRITICAL_LEAK" : deviation > 15 ? "ATTENTION" : "SAFE",
    overallDeviationPercent: deviation,
    estimatedLeakAmount: leak,
    reserveFundCurrentBalance: units * 1200000,
    reserveFundRecommendedRate: 260,
    reserveFundCurrentRate: 155,
    recentBids: [
      {
        id: `bid-dyn-1`,
        projectTitle: "공용부 고효율 시설 개선 및 정밀 보수 공사",
        bidAmount: Math.round(leak * 1.5),
        standardAmount: Math.round(leak * 1.5 / (1 + deviation / 100)),
        deviationPercent: deviation,
        executionDate: "2025-09",
        bidMethod: "제한경쟁 (적격심사)",
        status: deviation > 25 ? "OVERPRICED" : "NORMAL",
        memo: `K-apt 동일 평형 군 대비 단가 ${deviation}% 상회 분석`,
      },
    ],
    keyRisks: [
      `표준 시공 단가 대비 ${deviation}% 초과 입찰 정황 감지`,
      `준공 ${elapsedYears}년 차 시설 노후화에 따른 장충금 재정비 요망`,
    ],
    recommendations: [
      "국토부 K-apt 적격심사 세부 배점표 기술사 사전 검토",
      "1초 입주민 인증 후 CERA-PMS 정밀 원가 내역서 열람",
    ],
  };
}

/** 국토부·LH 2025 가이드라인 기반 65개 법정 항목 및 핵심 질의응답 지식 DB */
export const KAPT_2025_GUIDELINE_QA: KaptGuidelineQaItem[] = [
  {
    id: "qa-1",
    category: "수선주기",
    question: "승강기 메인 와이어로프와 시브의 법정 전면수선 주기와 부분수선 기준은 무엇인가요?",
    keywords: ["승강기", "와이어로프", "시브", "전면수선", "수선주기", "엘리베이터"],
    summaryAnswer: "와이어로프와 시브의 법정 수선주기는 5년이며, 부분수선은 불인정되고 전면 교체가 원칙입니다.",
    detailedGuideline:
      "공동주택관리법 시행규칙 [별표 1] 제1호(승강기 및 인양기)에 의거, 메인 와이어로프와 도르래(시브)는 수선주기 5년의 전면수선 항목입니다. 마모율 10% 초과 또는 단선 1개 이상 발생 시 3년 조정 절차 또는 긴급공사로 전면 교체하여야 하며, 개별 가닥 땜질식 부분수선은 행정처분(과태료 1천만원) 대상입니다.",
    legalBasis: "공동주택관리법 시행규칙 [별표 1] 제1호, 국토부 2025 장기수선계획 가이드라인 p.42",
  },
  {
    id: "qa-2",
    category: "적립산식",
    question: "장기수선충당금의 법정 월간 적립액 계산 공식과 최소 권장 요율은 어떻게 되나요?",
    keywords: ["장충금", "적립산식", "공식", "계산법", "최소금액", "㎡당", "부과금"],
    summaryAnswer: "월간 장충금 = (장기수선계획 기간 중 총 수선비 / 총 분양면적 × 기간(월)) × 세대 분양면적입니다.",
    detailedGuideline:
      "공동주택관리법 시행령 제31조 제1항에 규정된 표준 산식입니다. 2025년 국토부 권장 기준에 따르면, 준공 20년 이상 노후 아파트의 경우 ㎡당 최소 250원~320원 이상 적립해야 대수선 시 일시금 징수(추가 분담금)를 방지할 수 있습니다. 현재 전국 평균은 ㎡당 약 180원으로 40% 이상 과소 적립 상태입니다.",
    legalBasis: "공동주택관리법 시행령 제31조 제1항 및 제4항, 2025 K-apt 통계 연보",
  },
  {
    id: "qa-3",
    category: "항목선정",
    question: "장기수선계획 65개 법정 항목에 없는 신규 CCTV 증설이나 AI 보안 시스템은 수선유지비로 집행 가능한가요?",
    keywords: ["CCTV", "보안", "항목선정", "수선유지비", "잡지출", "65개"],
    summaryAnswer: "단순 1~2대 카메라 교체는 수선유지비 가능하나, 메인 서버/네트워크 신설은 장기수선계획 수시조정 후 장충금으로만 집행해야 합니다.",
    detailedGuideline:
      "주요 시설의 신설·증설은 장기수선계획에 반영하여야 합니다(법 제29조). 법정 65개 항목에 예시되지 않았더라도 자산가치를 증대시키는 주요 설비는 입대의 회의 및 입주민 과반수 서면동의를 거쳐 장기수선계획에 항목을 신설한 후 장기수선충당금으로 집행해야 합니다. 이를 수선유지비나 잡수입으로 우회 집행 시 용도 외 사용으로 1천만원 이하의 과태료가 부과됩니다.",
    legalBasis: "공동주택관리법 제90조 제3항(용도 외 사용 금지) 및 대법원 2017도15039 판례",
  },
  {
    id: "qa-4",
    category: "입찰방식",
    question: "공사 금액이 3백만원을 초과할 때 수의계약을 맺으면 무조건 불법인가요?",
    keywords: ["수의계약", "3백만원", "입찰", "적격심사", "수의계약한도", "과태료"],
    summaryAnswer: "원칙적으로 3백만원 초과 공사는 전자입찰(일반/제한/지명경쟁)이 필수이며, 2회 유찰 등 법정 예외 사유가 없으면 불법입니다.",
    detailedGuideline:
      "국토교통부 고시 「주택관리업자 및 사업자 선정지침」 [별표 2]에 따르면 300만원(부가가치세 제외) 이하의 공사·용역만 수의계약이 허용됩니다. 300만원을 초과하는 경우 2회 이상 유찰되었거나 긴급 재난 복구의 경우에만 입대의 의결로 수의계약이 가능합니다. 쪼개기 계약(예: 290만원씩 3회 분할 발주)은 지침 위반으로 즉시 적발됩니다.",
    legalBasis: "주택관리업자 및 사업자 선정지침(국토교통부 고시 제2024-892호) 제4조",
  },
  {
    id: "qa-5",
    category: "과태료방어",
    question: "지자체 장기수선계획 실태 점검 시 가장 많이 적발되는 과태료 2,000만원 사례는 무엇인가요?",
    keywords: ["과태료", "2천만원", "행정처분", "점검", "실태조사", "처벌"],
    summaryAnswer: "3년 주기 정기검토 미실시(과태료 500만원) 및 장기수선계획에 없는 공사를 장충금으로 부당 지출한 경우(과태료 1,000만~2,000만원)입니다.",
    detailedGuideline:
      "1위: 장기수선계획상 수선주기가 도래하지 않았는데 사전 수시조정 절차(입주민 과반수 동의) 없이 공사를 조기 강행한 경우.\n2위: 전면수선 항목을 부분수선으로 축소 보고하여 소액 수선유지비로 편법 회계 처리한 경우.\n3위: 장기수선계획 검토 보고서 미작성 및 관리사무소장과 입대의 회장의 확인 서명 누락.",
    legalBasis: "공동주택관리법 제102조 제2항(과태료 부과 기준)",
  },
];
