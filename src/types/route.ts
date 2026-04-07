export type RouteType = "fast" | "balanced" | "safe";

export interface RouteItem {
  id: number;
  type: RouteType;
  title: string;
  time: number;
  distance: string;
  safetyScore: number;
  riskCount: number;
  risks: string[];
}
