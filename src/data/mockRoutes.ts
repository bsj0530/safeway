import type { RouteItem } from "../types/route";

export const mockRoutes: RouteItem[] = [
  {
    id: 1,
    type: "fast",
    title: "빠른 경로",
    time: 12,
    distance: "850m",
    safetyScore: 58,
    riskCount: 3,
    risks: ["조도 낮음", "보도 폭 좁음", "공사 구간 인접"],
    color: "#ef4444",
    guideLabel: "가장 빠른 이동 경로",
    relativePath: [
      { lat: 0, lng: 0 },
      { lat: 0.0005, lng: 0.0012 },
      { lat: 0.001, lng: 0.0022 },
      { lat: 0, lng: 0 },
    ],
    dangerPoints: [
      {
        lat: 0.0006,
        lng: 0.0011,
        message: "전방 조도 낮음 구간입니다.",
      },
      {
        lat: 0.001,
        lng: 0.0021,
        message: "보도 폭이 좁은 구간입니다.",
      },
    ],
  },
  {
    id: 2,
    type: "balanced",
    title: "균형 경로",
    time: 14,
    distance: "1.0km",
    safetyScore: 76,
    riskCount: 2,
    risks: ["횡단보도 대기 시간 김", "일부 경사 구간"],
    color: "#f59e0b",
    guideLabel: "시간과 안전을 함께 고려한 경로",
    relativePath: [
      { lat: 0, lng: 0 },
      { lat: 0.0008, lng: 0.0006 },
      { lat: 0.0014, lng: 0.0014 },
      { lat: 0.0005, lng: 0.0025 },
      { lat: 0, lng: 0 },
    ],
    dangerPoints: [
      {
        lat: 0.0013,
        lng: 0.0013,
        message: "완만한 경사 구간입니다.",
      },
    ],
  },
  {
    id: 3,
    type: "safe",
    title: "안전 경로",
    time: 17,
    distance: "1.2km",
    safetyScore: 91,
    riskCount: 1,
    risks: ["야간 주의 구간 1곳"],
    color: "#16a34a",
    guideLabel: "위험 구간을 최소화한 추천 경로",
    relativePath: [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.0002 },
      { lat: 0.0018, lng: 0.0008 },
      { lat: 0.0012, lng: 0.0022 },
      { lat: 0.0003, lng: 0.003 },
      { lat: 0, lng: 0 },
    ],
    dangerPoints: [
      {
        lat: 0.0012,
        lng: 0.0021,
        message: "야간에는 주변 시야를 확인해 주세요.",
      },
    ],
  },
];
