import type { CrowdLevel, RiskLevel, RouteItem } from "../../types/route";

interface RouteCardProps {
  route: RouteItem;
  selected?: boolean;
  onClick?: () => void;
}

function getRouteDescription(type: RouteItem["type"]) {
  if (type === "fast") return "이동 시간 최소";
  if (type === "balanced") return "시간과 안전의 균형";
  return "위험 구간 최소";
}

function getRiskLevelText(level: RiskLevel) {
  if (level === "low") return "낮음";
  if (level === "medium") return "보통";
  return "높음";
}

function getCrowdLevelText(level: CrowdLevel) {
  if (level === "low") return "여유";
  if (level === "medium") return "보통";
  return "혼잡";
}

function getScoreTone(score: number) {
  if (score >= 85) return "text-emerald-700 bg-emerald-50";
  if (score >= 70) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function RouteCard({
  route,
  selected = false,
  onClick,
}: RouteCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{route.title}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-800">
            최종 안전 점수 {route.finalSafetyScore}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {getRouteDescription(route.type)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {route.type === "safe" && (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              추천
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            위험 {route.riskCount}곳
          </span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-sm text-slate-600">
        <span>⏱ {route.time}분</span>
        <span>📍 {route.distance}</span>
        <span>👥 {getCrowdLevelText(route.crowdLevel)}</span>
        <span>🚨 사건 {route.incidentCount}건</span>
      </div>

      <div className="mb-3">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(route.finalSafetyScore, 100))}%`,
              backgroundColor: route.color,
            }}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">기본 안전 점수</p>
          <p className="mt-1 font-semibold text-slate-800">
            {route.baseSafetyScore}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">케어 대상 적합도</p>
          <p className="mt-1 font-semibold text-slate-800">
            {route.careTargetFitScore}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">실시간 위험도</p>
          <p className="mt-1 font-semibold text-slate-800">
            {route.realtimeRiskScore}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">행사/혼잡 영향</p>
          <p className="mt-1 font-semibold text-slate-800">
            {route.hasEvent ? "있음" : "없음"}
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${getScoreTone(
            route.finalSafetyScore,
          )}`}
        >
          최종 점수 {route.finalSafetyScore}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
          날씨 {getRiskLevelText(route.weatherRiskLevel)}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
          조도 {getRiskLevelText(route.lightingRiskLevel)}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
          경사 {getRiskLevelText(route.slopeRiskLevel)}
        </span>
      </div>

      {route.realtimeBadges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {route.realtimeBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {route.risks.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {route.risks.map((risk) => (
            <span
              key={risk}
              className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
            >
              {risk}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">실시간 요약</p>
        <p className="mt-1 text-sm text-slate-700">{route.realtimeSummary}</p>
      </div>
    </button>
  );
}
