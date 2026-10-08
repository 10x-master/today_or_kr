import type { ReactNode } from "react";
import { Landmark, MapPinned, Fish, CalendarDays, BadgeCheck, ExternalLink } from "lucide-react";
import type { TodayPickRegion } from "@/components/TodayPickFilterBar";

type CurationCard = {
  title: string;
  place: string;
  schedule: string;
  description: string;
  badge: string;
};

const FESTIVALS: CurationCard[] = [
  {
    title: "2026 우리 동네 가을 단풍 축제",
    place: "동네 중앙공원 일대",
    schedule: "2026.10.17 ~ 10.19",
    description: "지자체 주관 가족 나들이 축제 · 농특산물 장터, 어린이 체험 부스 운영",
    badge: "지자체 공식 인증",
  },
  {
    title: "소상공인 착한가게 야시장",
    place: "동네 전통시장 먹자골목",
    schedule: "매주 금~일 18:00~22:00",
    description: "지역 소상공인 상생 캠페인과 연계된 상설 야시장",
    badge: "지자체 공식 인증",
  },
];

const SPOTS: CurationCard[] = [
  {
    title: "힐링 둘레길 트레킹 코스",
    place: "동네 뒷산 둘레길",
    schedule: "상시 개방",
    description: "가볍게 걷기 좋은 1.5km 둘레길, 전망대에서 동네 전경 감상 가능",
    badge: "힐링 명소",
  },
  {
    title: "가족 체험형 목공예 공방",
    place: "동네 문화센터 1층",
    schedule: "매주 화~토, 사전 예약 필수",
    description: "자녀와 함께하는 목공예 체험, 지자체 교육비 일부 지원",
    badge: "체험 명소",
  },
];

const SPECIALTIES: CurationCard[] = [
  {
    title: "지역 인증 반건조 생선 세트",
    place: "산지 직송 · 당일 포장",
    schedule: "주 3회 산지 출고",
    description: "지역 수협 인증 산지 직송 반건조 생선, 명절 선물세트로도 인기",
    badge: "지역 인증 특산물",
  },
  {
    title: "친환경 인증 쌀 10kg",
    place: "산지 직송 · 당일 도정",
    schedule: "주문 후 1~2일 발송",
    description: "지자체 친환경 인증 농가에서 직송하는 신선 쌀",
    badge: "지역 인증 특산물",
  },
];

function mapSearchUrl(query: string) {
  return `https://map.kakao.com/?q=${encodeURIComponent(query)}`;
}

function CurationCardItem({ card, icon }: { card: CurationCard; icon: ReactNode }) {
  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
          {icon}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <BadgeCheck className="h-3.5 w-3.5" />
          {card.badge}
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold leading-6 text-zinc-900">{card.title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{card.place}</p>

      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
        <CalendarDays className="h-4 w-4 text-zinc-400" />
        <span>{card.schedule}</span>
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-600">{card.description}</p>

      <a
        href={mapSearchUrl(card.place)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
      >
        <MapPinned className="h-4 w-4" />
        지도 보기
        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
      </a>
    </article>
  );
}

export default function LocalCultureSection({ region }: { region?: TodayPickRegion }) {
  const regionLabel = region ? `${region.gugun} ${region.dong}` : "우리 동네";

  return (
    <section id="local-culture" className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-amber-500">지자체 공익 큐레이션</p>
        <h2 className="mt-1 text-xl font-bold text-zinc-900">
          {regionLabel}의 축제·명소·특산물 픽
        </h2>
      </div>

      <CurationGroup
        title="지자체 공식 축제"
        icon={<Landmark className="h-4.5 w-4.5 text-emerald-600" />}
        cards={FESTIVALS}
      />
      <CurationGroup
        title="힐링 명소/체험"
        icon={<MapPinned className="h-4.5 w-4.5 text-emerald-600" />}
        cards={SPOTS}
      />
      <CurationGroup
        title="지역 인증 특산물"
        icon={<Fish className="h-4.5 w-4.5 text-emerald-600" />}
        cards={SPECIALTIES}
      />
    </section>
  );
}

function CurationGroup({
  title,
  icon,
  cards,
}: {
  title: string;
  icon: ReactNode;
  cards: CurationCard[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
        {icon}
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <CurationCardItem key={card.title} card={card} icon={icon} />
        ))}
      </div>
    </div>
  );
}
