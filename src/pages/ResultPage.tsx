import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import RouteCard from "../components/route/routeCard";
import { getRoutes } from "../services/navigationService";
import type { PlaceItem } from "../types/place";
import type { RiskLevel, RouteItem } from "../types/route";
import type { RouteOptions } from "./HomePage";

interface ResultState {
  startPlace?: PlaceItem;
  endPlace?: PlaceItem;
  options?: RouteOptions;
}

function getRiskLevelText(level: RiskLevel) {
  if (level === "low") return "낮음";
  if (level === "medium") return "보통";
  return "높음";
}

function getScoreBadgeTone(score: number) {
  if (score >= 85) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (score >= 70) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { startPlace, endPlace, options } = (location.state ||
    {}) as ResultState;

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!startPlace || !endPlace) {
      setLoading(false);
      setErrorMessage("출발지 또는 도착지 정보가 없습니다.");
      return;
    }

    const fetchRoutes = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getRoutes({
          startPlace,
          endPlace,
          options,
        });
        const nextRoutes = response?.routes ?? [];

        setRoutes(nextRoutes);

        if (nextRoutes.length === 0) {
          setSelectedRouteId(null);
          setErrorMessage("조회된 경로가 없습니다.");
          return;
        }

        const defaultRoute =
          nextRoutes.find((route) => route.type === "safe") ?? nextRoutes[0];

        setSelectedRouteId(defaultRoute?.id ?? null);
      } catch (error) {
        console.error(error);
        setRoutes([]);
        setSelectedRouteId(null);
        setErrorMessage(
          "경로를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [startPlace, endPlace, options]);

  const selectedRoute = useMemo(() => {
    if (routes.length === 0) return null;
    return routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  }, [routes, selectedRouteId]);

  const handleStartNavigation = () => {
    if (!startPlace || !endPlace || !selectedRoute) return;

    navigate("/navigate", {
      state: {
        startPlace,
        endPlace,
        selectedRoute,
      },
    });
  };

  const handleRetry = async () => {
    if (!startPlace || !endPlace) {
      setErrorMessage("출발지 또는 도착지 정보가 없습니다.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getRoutes({
        startPlace,
        endPlace,
        options,
      });
      const nextRoutes = response?.routes ?? [];

      setRoutes(nextRoutes);

      if (nextRoutes.length === 0) {
        setSelectedRouteId(null);
        setErrorMessage("조회된 경로가 없습니다.");
        return;
      }

      const defaultRoute =
        nextRoutes.find((route) => route.type === "safe") ?? nextRoutes[0];

      setSelectedRouteId(defaultRoute?.id ?? null);
    } catch (error) {
      console.error(error);
      setRoutes([]);
      setSelectedRouteId(null);
      setErrorMessage("경로를 다시 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const activeOptions = useMemo(() => {
    if (!options) return [];

    const labels: Record<keyof RouteOptions, string> = {
      nightTravel: "야간 이동",
      avoidStairs: "계단 회피",
      avoidDarkRoad: "어두운 길 회피",
      avoidCrowdedArea: "혼잡 회피",
      preferMainRoad: "큰길 우선",
      wheelchairMode: "휠체어 모드",
    };

    return (Object.keys(options) as Array<keyof RouteOptions>)
      .filter((key) => options[key])
      .map((key) => labels[key]);
  }, [options]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b bg-white p-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-slate-600"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-slate-800">경로 결과</h1>
        <div className="w-10" />
      </div>

      <div className="border-b bg-white px-4 py-3 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">출발</span>{" "}
          {startPlace?.placeName || "미선택"}
        </p>
        <p className="mt-1">
          <span className="font-medium text-slate-800">도착</span>{" "}
          {endPlace?.placeName || "미선택"}
        </p>

        {activeOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeOptions.map((label) => (
              <span
                key={label}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="h-72 bg-slate-200">
          {!loading && !errorMessage && selectedRouteId !== null && (
            <MapView
              startPlace={startPlace}
              endPlace={endPlace}
              routes={routes}
              selectedRouteId={selectedRouteId}
            />
          )}

          {!loading && (errorMessage || routes.length === 0) && (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {errorMessage || "표시할 경로가 없습니다."}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  다시 불러오기
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              경로를 불러오는 중...
            </div>
          ) : selectedRoute ? (
            <>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">선택한 경로</p>
                    <p className="mt-1 text-lg font-semibold text-slate-800">
                      {selectedRoute.title}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreBadgeTone(
                      selectedRoute.finalSafetyScore,
                    )}`}
                  >
                    최종 안전 {selectedRoute.finalSafetyScore}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">예상 시간</p>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {selectedRoute.time}분
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">거리</p>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {selectedRoute.distance}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">실시간 위험도</p>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {selectedRoute.realtimeRiskScore}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">케어 적합도</p>
                    <p className="mt-1 text-base font-bold text-slate-800">
                      {selectedRoute.careTargetFitScore}
                    </p>
                  </div>
                </div>

                {selectedRoute.guideLabel && (
                  <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    {selectedRoute.guideLabel}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    혼잡도{" "}
                    {selectedRoute.crowdLevel === "low"
                      ? "여유"
                      : selectedRoute.crowdLevel === "medium"
                        ? "보통"
                        : "혼잡"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    사건 {selectedRoute.incidentCount}건
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    날씨 {getRiskLevelText(selectedRoute.weatherRiskLevel)}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    조도 {getRiskLevelText(selectedRoute.lightingRiskLevel)}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    경사 {getRiskLevelText(selectedRoute.slopeRiskLevel)}
                  </span>

                  {selectedRoute.hasEvent && (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
                      행사 영향 있음
                    </span>
                  )}
                </div>

                {selectedRoute.realtimeBadges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRoute.realtimeBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">실시간 요약</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedRoute.realtimeSummary}
                  </p>
                </div>
              </div>

              {routes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  selected={route.id === selectedRouteId}
                  onClick={() => setSelectedRouteId(route.id)}
                />
              ))}
            </>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              표시할 경로가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <button
          type="button"
          onClick={handleStartNavigation}
          disabled={!selectedRoute || loading}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:bg-slate-300"
        >
          이 경로로 안내 시작
        </button>
      </div>
    </div>
  );
}
