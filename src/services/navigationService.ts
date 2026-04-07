import type { PlaceItem } from "../types/place";
import type { RouteItem, RoutePoint, RouteType } from "../types/route";

export interface GetRoutesParams {
  startPlace: PlaceItem;
  endPlace: PlaceItem;
}

export interface GetRoutesResponse {
  routes: RouteItem[];
}

export interface StartNavigationResponse {
  ok: boolean;
  route: RouteItem;
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
      {
        lat: startLat + latGap * 0.35 + 0.0002,
        lng: startLng + lngGap * 0.35 + 0.0004,
      },
      {
        lat: startLat + latGap * 0.7 + 0.0001,
        lng: startLng + lngGap * 0.7 + 0.0002,
      },
      { lat: endLat, lng: endLng },
    ];
  }

  if (type === "balanced") {
    return [
      { lat: startLat, lng: startLng },
      {
        lat: startLat + latGap * 0.2 + 0.0006,
        lng: startLng + lngGap * 0.2 + 0.0003,
      },
      {
        lat: startLat + latGap * 0.5 + 0.0009,
        lng: startLng + lngGap * 0.5 + 0.0008,
      },
      {
        lat: startLat + latGap * 0.75 + 0.0005,
        lng: startLng + lngGap * 0.75 + 0.001,
      },
      { lat: endLat, lng: endLng },
    ];
  }

  return [
    { lat: startLat, lng: startLng },
    {
      lat: startLat + latGap * 0.15 + 0.001,
      lng: startLng + lngGap * 0.15 + 0.0002,
    },
    {
      lat: startLat + latGap * 0.35 + 0.0013,
      lng: startLng + lngGap * 0.35 + 0.0005,
    },
    {
      lat: startLat + latGap * 0.6 + 0.001,
      lng: startLng + lngGap * 0.6 + 0.0012,
    },
    {
      lat: startLat + latGap * 0.82 + 0.0003,
      lng: startLng + lngGap * 0.82 + 0.0014,
    },
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
): RouteItem[] {
  const startLat = Number(startPlace.y);
  const startLng = Number(startPlace.x);
  const endLat = Number(endPlace.y);
  const endLng = Number(endPlace.x);

  return [
    {
      id: 1,
      type: "fast",
      title: "빠른 경로",
      time: 12,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.02),
      safetyScore: 58,
      riskCount: 3,
      risks: ["조도 낮음", "보도 폭 좁음", "공사 구간 인접"],
      color: "#ef4444",
      guideLabel: "가장 빠른 이동 경로",
      relativePath: createRoutePointsByType(
        "fast",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [
        {
          lat: startLat + (endLat - startLat) * 0.45,
          lng: startLng + (endLng - startLng) * 0.45,
          message: "전방 조도 낮음 구간입니다.",
        },
      ],
    },
    {
      id: 2,
      type: "balanced",
      title: "균형 경로",
      time: 15,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.12),
      safetyScore: 76,
      riskCount: 2,
      risks: ["일부 경사 구간", "횡단보도 대기 예상"],
      color: "#f59e0b",
      guideLabel: "시간과 안전을 함께 고려한 경로",
      relativePath: createRoutePointsByType(
        "balanced",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [
        {
          lat: startLat + (endLat - startLat) * 0.55,
          lng: startLng + (endLng - startLng) * 0.55,
          message: "완만한 경사 구간입니다.",
        },
      ],
    },
    {
      id: 3,
      type: "safe",
      title: "안전 경로",
      time: 18,
      distance: estimateDistanceLabel(startLat, startLng, endLat, endLng, 1.25),
      safetyScore: 91,
      riskCount: 1,
      risks: ["야간 주의 구간 1곳"],
      color: "#16a34a",
      guideLabel: "위험 구간을 최소화한 추천 경로",
      relativePath: createRoutePointsByType(
        "safe",
        startLat,
        startLng,
        endLat,
        endLng,
      ),
      dangerPoints: [
        {
          lat: startLat + (endLat - startLat) * 0.7,
          lng: startLng + (endLng - startLng) * 0.7,
          message: "야간에는 주변 시야를 확인해 주세요.",
        },
      ],
    },
  ];
}

export async function getRoutes({
  startPlace,
  endPlace,
}: GetRoutesParams): Promise<GetRoutesResponse> {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          routes: buildRoutesFromPlaces(startPlace, endPlace),
        });
      }, 300);
    });
  } catch (error) {
    console.error("getRoutes error:", error);
    throw new Error("경로를 불러오지 못했습니다.");
  }
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
