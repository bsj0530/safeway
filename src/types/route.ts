export type RouteType = "fast" | "balanced" | "safe";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RiskPoint {
  lat: number;
  lng: number;
  message: string;
}

export interface RouteItem {
  id: number;
  type: RouteType;
  title: string;
  time: number;
  distance: string;
  safetyScore: number;
  riskCount: number;
  risks: string[];
  color: string;
  relativePath: RoutePoint[];
  guideLabel: string;
  dangerPoints: RiskPoint[];
}
