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
  },
];
