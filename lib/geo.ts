import { mockRegions } from "@/lib/db/mockSeed";
import type { Region } from "@/types/local";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 간 거리(km), Haversine 공식 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GPS 좌표(lat, lng)에서 가장 가까운 행정동을 반환하는 목업 역지오코딩 */
export function findNearestRegion(lat: number, lng: number): Region {
  return mockRegions.reduce((closest, region) => {
    const closestDist = haversineDistanceKm(lat, lng, closest.lat, closest.lng);
    const currentDist = haversineDistanceKm(lat, lng, region.lat, region.lng);
    return currentDist < closestDist ? region : closest;
  });
}
