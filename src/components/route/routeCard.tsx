import type { RouteItem } from "../../types/route";

interface RouteCardProps {
  route: RouteItem;
}

export default function RouteCard({ route }: RouteCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{route.title}</p>
          <h3 className="text-lg font-bold text-slate-800">
            안전 점수 {route.safetyScore}
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          위험 {route.riskCount}곳
        </span>
      </div>

      <div className="mb-3 flex gap-4 text-sm text-slate-600">
        <span>⏱ {route.time}분</span>
        <span>📍 {route.distance}</span>
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
    </div>
  );
}
