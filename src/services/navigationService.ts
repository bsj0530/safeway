import type { PlaceItem } from "../types/place";
import type { RouteItem, RoutePoint, RouteType } from "../types/route";
import type { RouteOptions } from "../pages/HomePage";

export interface GetRoutesParams {
  startPlace: PlaceItem;
  endPlace: PlaceItem;
  options?: RouteOptions;
}

export interface GetRoutesResponse {
  routes: RouteItem[];
}

export interface StartNavigationResponse {
  ok: boolean;
  route: RouteItem;
}

/**
 * 옵션 기반 점수 보정
 */
function applyOptionsToRoute(
  route: RouteItem,
  options?: RouteOptions,
): RouteItem {
  if (!options) return route;

  let bonus = 0;

  if (options.avoidDarkRoad && route.lightingRiskLevel === "high") {
    bonus += 8;
  }

  if (options.avoidCrowdedArea && route.crowdLevel === "high") {
    bonus += 6;
  }

  if (options.avoidStairs && route.slopeRiskLevel === "high") {
    bonus += 6;
  }

  if (options.preferMainRoad && route.type === "safe") {
    bonus += 5;
  }

  if (options.wheelchairMode && route.slopeRiskLevel !== "low") {
    bonus += 10;
  }

  if (options.nightTravel && route.lightingRiskLevel === "low") {
    bonus += 5;
  }

  const newScore = Math.min(100, route.finalSafetyScore + bonus);

  return {
    ...route,
    finalSafetyScore: newScore,
    realtimeSummary:
      route.realtimeSummary +
      (bonus > 0 ? " (선택한 안전 옵션이 반영되었습니다)" : ""),
  };
}

function createRoutePointsByType(
  type: RouteType,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): RoutePoint[] {
  const latGap = endLat - startLat;
  const lngGap = endLng - startLng;

  if (type === "fast") {
    return [
      { lat: startLat, lng: startLng },
      { lat: startLat + latGap * 0.35, lng: startLng + lngGap * 0.35 },
      { lat: startLat + latGap * 0.7, lng: startLng + lngGap * 0.7 },
      { lat: endLat, lng: endLng },
    ];
  }

  if (type === "balanced") {
    return [
      { lat: startLat, lng: startLng },
      { lat: startLat + latGap * 0.2, lng: startLng + lngGap * 0.2 },
      { lat: startLat + latGap * 0.5, lng: startLng + lngGap * 0.5 },
      { lat: startLat + latGap * 0.75, lng: startLng + lngGap * 0.75 },
      { lat: endLat, lng: endLng },
    ];
  }

  return [
    { lat: startLat, lng: startLng },
    { lat: startLat + latGap * 0.2, lng: startLng + lngGap * 0.2 },
    { lat: startLat + latGap * 0.4, lng: startLng + lngGap * 0.4 },
    { lat: startLat + latGap * 0.7, lng: startLng + lngGap * 0.7 },
    { lat: endLat, lng: endLng },
  ];
}

function estimateDistanceLabel(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  multiplier: number,
) {
  const latMeters = Math.abs(endLat - startLat) * 111000;
  const lngMeters = Math.abs(endLng - startLng) * 88000;
  const rough = Math.sqrt(latMeters ** 2 + lngMeters ** 2) * multiplier;

  if (rough >= 1000) {
    return `${(rough / 1000).toFixed(1)}km`;
  }

  return `${Math.round(rough)}m`;
}

function buildRoutesFromPlaces(
  startPlace: PlaceItem,
  endPlace: PlaceItem,
  options?: RouteOptions,
): RouteItem[] {
  const startLat = Number(startPlace.y);
  const startLng = Number(startPlace.x);
  const endLat = Number(endPlace.y);
  const endLng = Number(endPlace.x);

  const baseRoutes: RouteItem[] = [
    {
      id: 1,
      type: "fast",
      title: "빠른 경로",
      time: 12,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.0),

      baseSafetyScore: 60,
      realtimeRiskScore: 50,
      finalSafetyScore: 55,
      careTargetFitScore: 60,

      riskCount: 3,
      risks: ["조도 낮음", "혼잡"],
      color: "#ef4444",
      guideLabel: "가장 빠른 이동 경로",

      crowdLevel: "high",
      incidentCount: 4,
      hasEvent: true,

      weatherRiskLevel: "medium",
      lightingRiskLevel: "high",
      slopeRiskLevel: "low",

      realtimeBadges: ["혼잡", "주의"],
      realtimeSummary: "빠르지만 위험 요소가 존재합니다.",

      relativePath: createRoutePointsByType(
        "fast",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [],
    },
    {
      id: 2,
      type: "balanced",
      title: "균형 경로",
      time: 15,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.1),

      baseSafetyScore: 75,
      realtimeRiskScore: 30,
      finalSafetyScore: 75,
      careTargetFitScore: 75,

      riskCount: 2,
      risks: ["경사"],
      color: "#f59e0b",
      guideLabel: "균형 잡힌 경로",

      crowdLevel: "medium",
      incidentCount: 2,
      hasEvent: false,

      weatherRiskLevel: "low",
      lightingRiskLevel: "medium",
      slopeRiskLevel: "medium",

      realtimeBadges: ["균형"],
      realtimeSummary: "적당한 선택입니다.",

      relativePath: createRoutePointsByType(
        "balanced",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [],
    },
    {
      id: 3,
      type: "safe",
      title: "안전 경로",
      time: 18,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.2),

      baseSafetyScore: 90,
      realtimeRiskScore: 15,
      finalSafetyScore: 90,
      careTargetFitScore: 95,

      riskCount: 1,
      risks: ["야간 주의"],
      color: "#16a34a",
      guideLabel: "가장 안전한 경로",

      crowdLevel: "low",
      incidentCount: 1,
      hasEvent: false,

      weatherRiskLevel: "low",
      lightingRiskLevel: "medium",
      slopeRiskLevel: "low",

      realtimeBadges: ["추천"],
      realtimeSummary: "가장 안전한 경로입니다.",

      relativePath: createRoutePointsByType(
        "safe",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [],
    },
  ];

  // 🔥 옵션 반영
  return baseRoutes.map((route) => applyOptionsToRoute(route, options));
}

export async function getRoutes({
  startPlace,
  endPlace,
  options,
}: GetRoutesParams): Promise<GetRoutesResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        routes: buildRoutesFromPlaces(startPlace, endPlace, options),
      });
    }, 300);
  });
}

export async function startNavigation(
  route: RouteItem,
): Promise<StartNavigationResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        route,
      });
    }, 200);
  });
}
