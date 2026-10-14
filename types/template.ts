/**
 * t.홈페이지 샵인샵(Shop-in-Shop) 템플릿 엔진 타입 규격
 * (아파트링크 B2B 공정입찰, 제조사 B2B 특판, 동네 로컬 매장, 프로 세일즈 파트너 4대 표준 모델)
 */

export type TemplatePresetId =
  | "APTLINK_B2B"
  | "MANUFACTURER_B2B"
  | "LOCAL_STORE"
  | "PRO_SALES";

export type TemplateModuleKey =
  | "VOICE_QA" // 무료 Web Speech 기반 음성 질의응답
  | "TSIGN_CONTRACT" // t.sign 모바일 전자계약/약정
  | "CATALOG" // 제품/공사 실적 갤러리
  | "CALENDAR" // 구글 캘린더/일정 예약
  | "PWA_BANNER" // 홈화면 바로가기 PWA
  | "REFUND_RADAR" // 카드수수료 환급 진단
  | "GROUP_BUY"; // 10인 공구 청원

export interface TemplateModuleMeta {
  key: TemplateModuleKey;
  label: string;
  description: string;
  icon: string;
  badge?: string;
  defaultEnabled: boolean;
}

export interface TemplatePreset {
  id: TemplatePresetId;
  name: string;
  badge: string;
  category: string;
  heroTagline: string;
  description: string;
  icon: string;
  accentColor: string;
  recommendedFor: string;
  defaultModules: Record<TemplateModuleKey, boolean>;
  highlights: string[];
}

export interface ShopInShopConfig {
  id: string; // 고유 슬러그 (예: apt-sanggye14, ultrasonic-cleaner)
  templateId: TemplatePresetId;
  shopName: string;
  category: string;
  tagline: string;
  description: string;
  representativeName: string;
  phone: string;
  email?: string;
  roadAddress: string;
  dong: string;
  logoText: string;
  logoBgColor: string;
  primaryColor: string;
  enabledModules: Record<TemplateModuleKey, boolean>;
  videoUrl?: string;
  videoPoster?: string;
  catalogItems?: Array<{
    id: string;
    title: string;
    priceText: string;
    description: string;
    imageUrl?: string;
    badge?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/** 4대 표준 템플릿 모듈 목록 */
export const TEMPLATE_MODULES: TemplateModuleMeta[] = [
  {
    key: "VOICE_QA",
    label: "음성 AI 질의응답 (무료 STT/TTS)",
    description: "국토부·LH 가이드라인 및 매장/제품 FAQ 음성 인식 낭독",
    icon: "🎙️",
    badge: "비용 0원",
    defaultEnabled: true,
  },
  {
    key: "TSIGN_CONTRACT",
    label: "t.sign 모바일 전자계약",
    description: "공사 입찰 약정, 물품 납품 계약, 서포터즈 위탁 약정 1초 체결",
    icon: "✍️",
    badge: "법적효력",
    defaultEnabled: true,
  },
  {
    key: "CATALOG",
    label: "카탈로그 & 시공 실적 갤러리",
    description: "아파트 공사 시공 전후 사진, 특판 제품 상세 갤러리",
    icon: "📦",
    defaultEnabled: true,
  },
  {
    key: "CALENDAR",
    label: "실시간 현장 방문/상담 예약",
    description: "구글 캘린더 양방향 연동 입주민/소장님 미팅 예약",
    icon: "📅",
    defaultEnabled: true,
  },
  {
    key: "PWA_BANNER",
    label: "모바일 PWA 앱 설치 배너",
    description: "스마트폰 홈 화면 1초 추가 바로가기 지원",
    icon: "📲",
    defaultEnabled: false,
  },
  {
    key: "REFUND_RADAR",
    label: "카드 수수료 누수 환급 진단",
    description: "영세 우대율 미적용 소급 청구 계산기",
    icon: "🛰️",
    defaultEnabled: false,
  },
  {
    key: "GROUP_BUY",
    label: "10인 단지 입주민 공동구매",
    description: "아파트 단지별 10명 청원 도달 시 즉시 특판 개시",
    icon: "🛍️",
    defaultEnabled: false,
  },
];

/** 4대 표준 템플릿 프리셋 정의 */
export const TEMPLATE_PRESETS: Record<TemplatePresetId, TemplatePreset> = {
  APTLINK_B2B: {
    id: "APTLINK_B2B",
    name: "🏢 아파트링크 B2B 공정입찰형",
    badge: "아파트 공식 모델",
    category: "아파트 관리 & 전문 시공",
    heroTagline: "내 아파트 입찰 공사비 적정한가? CERA-PMS 비공개 분석",
    description: "아파트 공사 적정가 진단, 주민 인증 게이트, 장기수선 실무스쿨 음성 Q&A 특화",
    icon: "🏢",
    accentColor: "#2563EB",
    recommendedFor: "관리사무소, 장기수선 컨설팅사, 엘리베이터/도색/방수 전문 시공사",
    defaultModules: {
      VOICE_QA: true,
      TSIGN_CONTRACT: true,
      CATALOG: true,
      CALENDAR: true,
      PWA_BANNER: true,
      REFUND_RADAR: false,
      GROUP_BUY: true,
    },
    highlights: [
      "1초 입주민 인증 락인(관리비 영수증/캡처/현관 사진)",
      "CERA-PMS 입찰 분석 리포트(표준 대비 편차율 산출)",
      "국토부·LH 2025 장기수선 가이드라인 65개 항목 음성 스쿨",
    ],
  },
  MANUFACTURER_B2B: {
    id: "MANUFACTURER_B2B",
    name: "📦 제조사 B2B 특판형",
    badge: "초음파세척기·특판",
    category: "제조 및 산업 솔루션",
    heroTagline: "산업용 초음파세척기 & 친환경 세제 원스톱 직판",
    description: "공장 직판 카탈로그, 대량 납품 t.sign 모바일 전자계약 및 기술 규격서 연동",
    icon: "⚙️",
    accentColor: "#0284C7",
    recommendedFor: "친환경 초음파세척기, 산업 기자재, 식자재 유통, 주방 기기 제조사",
    defaultModules: {
      VOICE_QA: true,
      TSIGN_CONTRACT: true,
      CATALOG: true,
      CALENDAR: true,
      PWA_BANNER: false,
      REFUND_RADAR: false,
      GROUP_BUY: false,
    },
    highlights: [
      "고해상도 제품 실적 및 산업 시험성적서 갤러리",
      "t.sign 1초 비대면 법적 효력 납품/렌탈 약정서 체결",
      "기술 스펙 및 유지보수 음성 AI 질의응답",
    ],
  },
  LOCAL_STORE: {
    id: "LOCAL_STORE",
    name: "🏪 동네 로컬 매장형",
    badge: "소상공인 1-Page",
    category: "요식업 & 동네 상생 매장",
    heroTagline: "단지 주민 10,000명에게 즉시 알리는 공식 스마트 매장",
    description: "모바일 원클릭 PWA 아이콘, 카카오 비즈보드 광고, 10인 단지 공동구매",
    icon: "🏪",
    accentColor: "#D97706",
    recommendedFor: "동네 카페, 베이커리, 피트니스, 병의원, 학원",
    defaultModules: {
      VOICE_QA: false,
      TSIGN_CONTRACT: false,
      CATALOG: true,
      CALENDAR: true,
      PWA_BANNER: true,
      REFUND_RADAR: true,
      GROUP_BUY: true,
    },
    highlights: [
      "스마트폰 홈 화면 1초 PWA 웹앱 자동 설치",
      "카드 수수료 누수 환급 진단기 연동",
      "단지 입주민 10% 상생 할인 쿠폰 발급",
    ],
  },
  PRO_SALES: {
    id: "PRO_SALES",
    name: "💼 프로 세일즈 파트너형",
    badge: "엠버서더 워크OS",
    category: "전문 영업 & TM CRM",
    heroTagline: "AI 일정 비서, 음성 퀵 캡처 & 링크픽 N차 수익 허브",
    description: "t.note 스마트 데스크, 구글 캘린더 양방향 실시간 동기화, 링크픽 15% 수당",
    icon: "💼",
    accentColor: "#4F46E5",
    recommendedFor: "필드 세일즈 매니저, TM 전문 상담원, 제휴 솔루션 엠버서더",
    defaultModules: {
      VOICE_QA: true,
      TSIGN_CONTRACT: true,
      CATALOG: false,
      CALENDAR: true,
      PWA_BANNER: false,
      REFUND_RADAR: true,
      GROUP_BUY: false,
    },
    highlights: [
      "구글 캘린더 오늘 일정 실시간 연동 위젯",
      "2-Tap 음성 퀵 캡처 및 AI 브리핑 노트",
      "링크픽(LinkPick) 모바일 1-Page 제휴 수수료 정산",
    ],
  },
};

/** 기본 아파트링크 B2B 프리셋 샵 설정 */
export const APTLINK_DEFAULT_SHOP_CONFIG: ShopInShopConfig = {
  id: "aptlink-official",
  templateId: "APTLINK_B2B",
  shopName: "아파트링크 (AptLink)",
  category: "공동주택 입찰 진단 & 장기수선 컨설팅",
  tagline: "내 아파트 공사비 적정한가? CERA-PMS 공정 입찰 진단",
  description: "국토부·LH 2025 가이드라인 준수, 1초 입주민 인증 락인 및 장충금 누수 진단 솔루션",
  representativeName: "기술자문단 수석연구원",
  phone: "02-1588-0000",
  email: "support@today.or.kr",
  roadAddress: "서울특별시 노원구 동일로 1414",
  dong: "상계동",
  logoText: "AptLink",
  logoBgColor: "#2563EB",
  primaryColor: "#2563EB",
  enabledModules: {
    VOICE_QA: true,
    TSIGN_CONTRACT: true,
    CATALOG: true,
    CALENDAR: true,
    PWA_BANNER: true,
    REFUND_RADAR: false,
    GROUP_BUY: true,
  },
  catalogItems: [
    {
      id: "cat-1",
      title: "CERA-PMS 입찰 공사비 적정성 종합 리포트",
      priceText: "입주민 인증 시 무료",
      description: "단지별 표준 단가 대비 편차율 분석, 3개년 K-apt 입찰 적법성 평가서",
      badge: "핵심 리포트",
    },
    {
      id: "cat-2",
      title: "국토부 법정 3년 장기수선계획 정기검토 패키지",
      priceText: "공인 기술사 현장 실사",
      description: "65개 법정 수선항목 전수 조사, 장충금 산식 시뮬레이션, 지자체 점검 방어",
      badge: "법적 필수",
    },
    {
      id: "cat-3",
      title: "승강기 전면 교체 & 옥상 방수 공정 입찰 대행",
      priceText: "입주민 공구 특판",
      description: "국토부 고시 전자입찰 적격심사제 표준 가이드 및 담합 리스크 차단",
      badge: "공정 입찰",
    },
  ],
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
};
