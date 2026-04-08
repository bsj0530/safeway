export type RouteType = "fast" | "balanced" | "safe";
export type RiskLevel = "low" | "medium" | "high";
export type CrowdLevel = "low" | "medium" | "high";

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

  baseSafetyScore: number;
  realtimeRiskScore: number;
  finalSafetyScore: number;
  careTargetFitScore: number;

  riskCount: number;
  risks: string[];
  color: string;
  guideLabel: string;

  crowdLevel: CrowdLevel;
  incidentCount: number;
  hasEvent: boolean;

  weatherRiskLevel: RiskLevel;
  lightingRiskLevel: RiskLevel;
  slopeRiskLevel: RiskLevel;

  realtimeBadges: string[];
  realtimeSummary: string;

  relativePath: RoutePoint[];
  dangerPoints: RiskPoint[];
}
