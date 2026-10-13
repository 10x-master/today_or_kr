/**
 * 6대 역할별 다이내믹 페르소나 및 중기부·소진공 정책자금 데이터 모델 정의
 */

export type UserPersona =
  | "RESTAURANT"     // 🍽️ 요식업·매장 사장님
  | "MANUFACTURER"   // ⚙️ 소공인·제조사
  | "STORE_CLOSING"  // 🏚️ 폐업·철거 고민
  | "APT_MANAGER"    // 🏢 아파트 관리소장/입대의
  | "AMBASSADOR"     // 👑 엠버서더·영업/N잡
  | "RESIDENT";      // 🏠 일반 주민

export interface PersonaMeta {
  id: UserPersona;
  label: string;
  icon: string;
  tagline: string;
  badge: string;
}

export const PERSONA_OPTIONS: PersonaMeta[] = [
  {
    id: "RESTAURANT",
    label: "요식업·매장 사장님",
    icon: "🍽️",
    tagline: "키오스크/서빙로봇 최대 700만원 지원 & 소진공 대리대출",
    badge: "스마트상점 70% 국비",
  },
  {
    id: "MANUFACTURER",
    label: "소공인·제조사",
    icon: "⚙️",
    tagline: "수작업 공정자동화 국비 3,600만원 & 스마트자금 직접대출",
    badge: "스마트공방 국비지원",
  },
  {
    id: "STORE_CLOSING",
    label: "폐업·철거 고민",
    icon: "🏚️",
    tagline: "점포 철거·원상복구비 평당 20만원(최대 600만원) 전액 지원",
    badge: "희망리턴패키지 100%",
  },
  {
    id: "APT_MANAGER",
    label: "아파트 관리소장/입대의",
    icon: "🏢",
    tagline: "공용시설 보수 지자체 매칭 지원금 & CERA 장기수선계획 견적",
    badge: "지자체 보조금 연계",
  },
  {
    id: "AMBASSADOR",
    label: "엠버서더·영업/N잡",
    icon: "👑",
    tagline: "소싱 룸 15초 쇼츠 대본 & 건당 15% 리퍼럴 수수료 적립",
    badge: "무자본 리퍼럴 수익",
  },
  {
    id: "RESIDENT",
    label: "일반 주민",
    icon: "🏠",
    tagline: "단지 10인 공구 35% 할인 & 우리동네 실시간 팩트 피드",
    badge: "단지 직거래 특판",
  },
];

export interface PolicyFundItem {
  id: string;
  persona: UserPersona;
  title: string;
  agency: string; // 소상공인시장진흥공단, 중소벤처기업부, 서울시 등
  amountText: string; // 예: "국비 최대 700만원", "최대 3,600만원", "평당 20만원(최대 600만원)"
  applyPeriod: string; // "2026.10.12 ~ 예산 소진 시"
  status: "접수중" | "D-Day" | "상시접수" | "마감임박";
  dDay?: number | null;
  linkUrl: string; // ols.semas.or.kr, sbiz.or.kr 등
  description: string;
  highlights: string[];
  ctaLabel?: string;
  badgeLabel?: string;
}
