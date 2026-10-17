// t.세일즈 영업 동선 최적화 — 순수 계산 함수. DB 접근은 API 라우트에서 한다.
// 외부 지도 Directions API(유료/키 필요) 없이도 동작하도록, 직선거리(Haversine) 기반
// 최근접 이웃(Nearest Neighbor) 휴리스틱으로 방문 순서를 근사 계산한다.
import type { TsalesLead, TsalesRouteStop } from "@/types/tsales";

const EARTH_RADIUS_METERS = 6_371_000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function optimizeRoute(
  leads: TsalesLead[],
  start?: { lat: number; lng: number }
): TsalesRouteStop[] {
  if (leads.length === 0) return [];

  const remaining = [...leads];
  let current = start ?? { lat: remaining[0].lat, lng: remaining[0].lng };
  const stops: TsalesRouteStop[] = [];
  let cumulative = 0;
  let order = 1;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((lead, idx) => {
      const dist = haversineMeters(current.lat, current.lng, lead.lat, lead.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const [lead] = remaining.splice(nearestIdx, 1);
    cumulative += nearestDist;
    stops.push({
      leadId: lead.id,
      businessName: lead.business_name,
      lat: lead.lat,
      lng: lead.lng,
      order: order++,
      legDistanceMeters: Math.round(nearestDist),
      cumulativeDistanceMeters: Math.round(cumulative),
    });
    current = { lat: lead.lat, lng: lead.lng };
  }

  return stops;
}
