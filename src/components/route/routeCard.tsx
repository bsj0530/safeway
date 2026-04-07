import type { RouteItem } from "../../types/route";

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
          <h3 className="text-lg font-bold text-slate-800">
            안전 점수 {route.safetyScore}
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

      <div className="mb-3 flex gap-4 text-sm text-slate-600">
        <span>⏱ {route.time}분</span>
        <span>📍 {route.distance}</span>
      </div>

      <div className="mb-3">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${route.safetyScore}%`,
              backgroundColor: route.color,
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {route.risks.map((risk) => (
          <span
            key={risk}
            className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
          >
            {risk}
          </span>
        ))}
      </div>
    </button>
  );
}
