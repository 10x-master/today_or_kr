import { NextRequest, NextResponse } from "next/server";
import type { UserPersona, PolicyFundItem } from "@/types/persona";

// 중기부·소진공·지자체 정책자금 및 지원사업 6대 페르소나별 공공데이터
const POLICY_FUNDS_DATA: Record<UserPersona, PolicyFundItem[]> = {
  RESTAURANT: [
    {
      id: "gov-rest-1",
      persona: "RESTAURANT",
      title: "2026 스마트상점 기술보급사업 (키오스크/서빙로봇)",
      agency: "소상공인시장진흥공단 · 중소벤처기업부",
      amountText: "국비 최대 700만원 (공급가액의 70% 지원)",
      applyPeriod: "2026.10.12 ~ 예산 소진 시까지",
      status: "접수중",
      dDay: 3,
      linkUrl: "https://www.sbiz.or.kr/smst/index.do",
      description: "외식업 및 매장 사장님 인건비 절감과 테이블 회전율 극대화를 위한 키오스크, 테이블오더, 서빙로봇 국비 집중 보조.",
      highlights: [
        "키오스크 / 테이블오더 도입비 70% 국비 환급",
        "서빙로봇 최대 700만원 국비 보조",
        "소진공 공인 스마트기술 공급기업 직매칭",
      ],
      badgeLabel: "국비 70% 환급",
      ctaLabel: "스마트상점 신청 바로가기",
    },
    {
      id: "gov-rest-2",
      persona: "RESTAURANT",
      title: "2026년 4분기 소상공인 정책자금 대리대출 (일반경영안정)",
      agency: "소상공인시장진흥공단 (ols.semas.or.kr)",
      amountText: "업체당 최대 7,000만원 (변동/고정 저금리)",
      applyPeriod: "2026.10.06 ~ 자금 소진 시",
      status: "접수중",
      linkUrl: "https://ols.semas.or.kr",
      description: "물가 상승 및 매출 정체 외식업 소상공인을 위한 4분기 지역신보 보증서부 대리대출 확인서 발급.",
      highlights: [
        "1금융권 신용대출 대비 2~3%p 저렴한 정책금리",
        "거치기간 2년 포함 최대 5년 분할상환",
        "온라인 즉시 정책자금 지원대상 확인서 발급",
      ],
      badgeLabel: "소진공 대리대출",
      ctaLabel: "소진공 정책자금 신청",
    },
  ],

  MANUFACTURER: [
    {
      id: "gov-mfg-1",
      persona: "MANUFACTURER",
      title: "2026 스마트공방 기술보급사업 (수작업 공정자동화)",
      agency: "중소벤처기업부 · 소진공",
      amountText: "국비 최대 3,600만원 (총 사업비의 70% 전액 지원)",
      applyPeriod: "2026.10.15 ~ 모집 마감 임박",
      status: "D-Day",
      dDay: 5,
      linkUrl: "https://www.bizinfo.go.kr",
      description: "상시근로자 10인 미만 제조업(소공인)의 수작업 공정에 스마트기술(IoT, 센서, 자동화 설비) 도입 국비 무상 지원.",
      highlights: [
        "소공인 맞춤 공정 하드웨어/소프트웨어 3,600만원 국비",
        "생산성 30% 향상 및 불량률 40% 저감 공인 실사",
        "도입 완료 시 스마트공방 공인 인증 현판 제공",
      ],
      badgeLabel: "최대 3,600만원 국비",
      ctaLabel: "스마트공방 공고 확인",
    },
    {
      id: "gov-mfg-2",
      persona: "MANUFACTURER",
      title: "2026 소진공 스마트자금 직접대출",
      agency: "소상공인시장진흥공단 (ols.semas.or.kr)",
      amountText: "시설자금 최대 5억원 / 운전자금 최대 1억원",
      applyPeriod: "2026.10.12 ~ 접수 마감 시",
      status: "접수중",
      linkUrl: "https://ols.semas.or.kr",
      description: "스마트공장·스마트공방 도입 소공인 및 친환경 제조 중소기업 전용 장기 저리 직접대출.",
      highlights: [
        "담보/신용 직접 심사로 신보 보증료 절감",
        "시설자금 최대 8년(거치 3년 포함) 넉넉한 상환",
        "우대금리 최대 0.2%p 자동 차감 혜택",
      ],
      badgeLabel: "소진공 직접대출",
      ctaLabel: "직접대출 접수 시스템",
    },
  ],

  STORE_CLOSING: [
    {
      id: "gov-close-1",
      persona: "STORE_CLOSING",
      title: "소상공인24 희망리턴패키지 점포철거비 지원사업",
      agency: "중소벤처기업부 · 소진공 (sbiz.or.kr)",
      amountText: "평당 20만원 (최대 600만원 전액 국비 지원)",
      applyPeriod: "상시 접수 (예산 소진 시 마감)",
      status: "상시접수",
      linkUrl: "https://www.sbiz.or.kr/nhrp/main.do",
      description: "폐업 예정 또는 기폐업 소상공인의 임대차 점포 원상복구 및 시설 철거 비용 실비 전액 무상 지원.",
      highlights: [
        "평당 20만원 한도 내 최대 600만원(부가세 제외) 실비 환급",
        "철거 공사 전 사전 신청 필수 (현장 감정평가 무료)",
        "철거 전문 공인 시공사 연계 및 세무 자문 제공",
      ],
      badgeLabel: "철거비 최대 600만원",
      ctaLabel: "소상공인24 원상복구비 신청",
    },
    {
      id: "gov-close-2",
      persona: "STORE_CLOSING",
      title: "희망리턴패키지 전직장려수당 & 채무조정 특화상담",
      agency: "소상공인시장진흥공단",
      amountText: "취업 교육 수료 시 최대 100만원 지원",
      applyPeriod: "상시 접수",
      status: "접수중",
      linkUrl: "https://www.sbiz.or.kr/nhrp/main.do",
      description: "폐업 소상공인의 신속한 재기 지원을 위한 폐업 세무/법률 무료 상담 및 재취업 전직장려금 패키지.",
      highlights: [
        "새출발기금 원금 감면 및 장기 분할상환 연계",
        "폐업신고 및 부가세/종소세 신고 무료 세무사 지원",
        "취업 성공 시 전직장려수당 최대 100만원 분할 지급",
      ],
      badgeLabel: "재창업·전직 장려",
      ctaLabel: "재기지원 패키지 상담",
    },
  ],

  APT_MANAGER: [
    {
      id: "gov-apt-1",
      persona: "APT_MANAGER",
      title: "2026 서울시·지자체 공동주택 공용시설물 보수 매칭 보조금",
      agency: "지자체 주택과 (구청 매칭 지원)",
      amountText: "단지당 최대 5,000만원 (공사비 50% 구청 매칭)",
      applyPeriod: "2026.10 ~ 구청 공고 일정별 상이",
      status: "접수중",
      linkUrl: "https://k-apt.go.kr",
      description: "노후 아파트 단지 승강기 보수, 옥상 방수, 보안등 LED 교체 등 공용시설 보수 공사비 지자체 예산 직접 지원.",
      highlights: [
        "준공 15년 이상 단지 가점 부여 (상계주공 우대)",
        "공동주택관리 조례에 따른 최대 50% 무상 매칭",
        "CERA 공인 적정가 입찰 의견서 첨부 시 심사 가점",
      ],
      badgeLabel: "지자체 보조금 50%",
      ctaLabel: "공동주택 보조금 상담",
    },
    {
      id: "gov-apt-2",
      persona: "APT_MANAGER",
      title: "CERA Engine 아파트 장기수선계획 3년 법정 정기조정 검토",
      agency: "Today. 공인 컨설팅 센터",
      amountText: "지자체 과태료 1,000만원 사전 차단 (단지 맞춤 견적)",
      applyPeriod: "상시 접수",
      status: "상시접수",
      linkUrl: "https://k-apt.go.kr",
      description: "공동주택관리법 제29조에 따른 3년 주기 장기수선계획 정기조정 및 장충금 현실화 법적 소명 패키지.",
      highlights: [
        "공인 건축·설비 기술사 합동 현장 부품 수명 실사",
        "수선항목 누락 방지 및 주민 동의 80% 설득 1장 리포트",
        "지자체 정기 감사 지적 0건 법적 보증 의견서",
      ],
      badgeLabel: "법정 과태료 방어",
      ctaLabel: "장기수선계획 맞춤 견적",
    },
  ],

  AMBASSADOR: [
    {
      id: "gov-amb-1",
      persona: "AMBASSADOR",
      title: "투데이 엠버서더 1-Click 쇼츠 스크립트 & 리퍼럴 배포 킷",
      agency: "Today. 파트너스 커머스",
      amountText: "판매 건당 10~15% 리퍼럴 중개 수당 (매주 정산)",
      applyPeriod: "연중 상시",
      status: "상시접수",
      linkUrl: "/partners",
      description: "소싱 룸 등록 제조사 정품을 15초 AI 쇼츠 대본과 숏링크로 단지 및 SNS에 배포하고 중개 수수료를 획득하는 무자본 비즈니스.",
      highlights: [
        "15초 바이럴 구어체 대본 자동 생성 (후킹-비교-CTA)",
        "TopView / Runway 최적화 9:16 영문 영상 프롬프트",
        "linkpick.co.kr 전용 숏링크 1초 복사 & 매주 수요일 입금",
      ],
      badgeLabel: "수수료 15% 정산",
      ctaLabel: "소싱 룸 엠버서더 킷 열기",
    },
    {
      id: "gov-amb-2",
      persona: "AMBASSADOR",
      title: "2026 청년·신중년 1인 미디어 콘텐츠 창작자 육성 바우처",
      agency: "한국콘텐츠진흥원 · 중기부",
      amountText: "창작 지원금 최대 500만원 + 장비 스튜디오 대여",
      applyPeriod: "2026.10.20 ~ 선착순 접수",
      status: "접수중",
      linkUrl: "https://www.kocca.kr",
      description: "로컬 커머스 및 숏폼 영상 제작 엠버서더 대상 미디어 장비(마이크, 조명, 짐벌) 및 영상 편집 툴 구독료 바우처 지원.",
      highlights: [
        "숏폼 미디어 장비 및 AI 툴 구독료 100% 국비 지원",
        "로컬 상권 홍보 크리에이터 우수자 후속 바우처 배정",
        "전문 PD 1:1 쇼츠 연출 멘토링 프로그램",
      ],
      badgeLabel: "콘텐츠 바우처",
      ctaLabel: "창작자 지원사업 신청",
    },
  ],

  RESIDENT: [
    {
      id: "gov-res-1",
      persona: "RESIDENT",
      title: "상계주공 단지 주민 10인 공구 직거래 특판 (초음파 싱크볼/달력)",
      agency: "Today. 단지 입주민 자치 공구",
      amountText: "제조사 본사 직거래 최대 35% 할인 + 무료 배관 시공",
      applyPeriod: "10명 모이면 공구 즉시 확정",
      status: "접수중",
      dDay: 2,
      linkUrl: "#group-buy",
      description: "입주민들이 자발적으로 10명 이상 모이면 관리사무소 승인을 거쳐 단체 특판가 및 무료 시공이 제공되는 착한 공구.",
      highlights: [
        "중간 유통 마진 제거로 시중가 대비 35% 할인",
        "관리사무소 단체 시공 협의 완료 시 설치비 면제",
        "1인 신청으로도 공구 게이지 카운트 즉시 누적",
      ],
      badgeLabel: "단지 공구 35% OFF",
      ctaLabel: "우리 아파트 공구 투표하기",
    },
    {
      id: "gov-res-2",
      persona: "RESIDENT",
      title: "2026 탄소중립포인트 에너지 (아파트 관리비 환급)",
      agency: "환경부 · 한국환경공단",
      amountText: "세대당 연간 최대 10만원 현금 환급 (관리비 차감)",
      applyPeriod: "상시 가입 가능",
      status: "상시접수",
      linkUrl: "https://cpoint.or.kr",
      description: "가정 내 전기, 상수도, 도시가스 사용량을 과거 2년 대비 5% 이상 절감 시 현금 또는 아파트 관리비 포인트 캐시백.",
      highlights: [
        "전기·수도 절감량에 따라 상·하반기 연 2회 현금 지급",
        "아파트아이 또는 지자체 관리비 고지서 연동 환급",
        "별도 방문 없이 인터넷 1분 간편 가입 완료",
      ],
      badgeLabel: "관리비 캐시백",
      ctaLabel: "탄소중립포인트 가입",
    },
  ],
};

/**
 * GET /api/gov/policy-funds?persona=RESTAURANT
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const personaParam = searchParams.get("persona") as UserPersona | null;

  if (personaParam && POLICY_FUNDS_DATA[personaParam]) {
    return NextResponse.json({
      persona: personaParam,
      items: POLICY_FUNDS_DATA[personaParam],
      source: "data.go.kr / BizInfo Fallback Engine",
      totalCount: POLICY_FUNDS_DATA[personaParam].length,
    });
  }

  // 페르소나 미지정 시 전체 목록 병합 반환
  const allItems = Object.values(POLICY_FUNDS_DATA).flat();
  return NextResponse.json({
    persona: "ALL",
    items: allItems,
    source: "data.go.kr / BizInfo Fallback Engine",
    totalCount: allItems.length,
  });
}
