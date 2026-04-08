import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import RouteCard from "../components/route/routeCard";
import { getRoutes } from "../services/navigationService";
import type { PlaceItem } from "../types/place";
import type { RouteItem } from "../types/route";
import type { RouteOptions } from "./HomePage";

interface ResultState {
  startPlace?: PlaceItem;
  endPlace?: PlaceItem;
  options?: RouteOptions;
}

function getScoreBadgeTone(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "안전해요";
  if (score >= 70) return "보통이에요";
  return "주의가 필요해요";
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
        const response = await getRoutes({ startPlace, endPlace, options });
        const nextRoutes = response?.routes ?? [];
        setRoutes(nextRoutes);

        if (nextRoutes.length === 0) {
          setSelectedRouteId(null);
          setErrorMessage("경로를 찾지 못했어요.");
          return;
        }

        const defaultRoute =
          nextRoutes.find((r) => r.type === "safe") ?? nextRoutes[0];
        setSelectedRouteId(defaultRoute.id);
      } catch {
        setRoutes([]);
        setSelectedRouteId(null);
        setErrorMessage("경로를 불러오지 못했어요. 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [startPlace, endPlace, options]);

  const selectedRoute = useMemo(() => {
    if (routes.length === 0) return null;
    return routes.find((r) => r.id === selectedRouteId) ?? routes[0];
  }, [routes, selectedRouteId]);

  const handleStartNavigation = () => {
    if (!startPlace || !endPlace || !selectedRoute) return;
    navigate("/navigate", {
      state: { startPlace, endPlace, selectedRoute },
    });
  };

  const handleRetry = async () => {
    if (!startPlace || !endPlace) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getRoutes({ startPlace, endPlace, options });
      const nextRoutes = response?.routes ?? [];
      setRoutes(nextRoutes);

      if (nextRoutes.length === 0) {
        setSelectedRouteId(null);
        setErrorMessage("경로를 찾지 못했어요.");
        return;
      }

      const defaultRoute =
        nextRoutes.find((r) => r.type === "safe") ?? nextRoutes[0];
      setSelectedRouteId(defaultRoute.id);
    } catch {
      setRoutes([]);
      setSelectedRouteId(null);
      setErrorMessage("다시 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  if (!startPlace || !endPlace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-800">
            경로 정보가 없어요
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 w-full rounded-3xl bg-emerald-600 px-6 py-6 text-2xl font-bold text-white"
          >
            처음으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col">
        {/* 헤더 */}
        <div className="border-b bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-xl font-bold text-slate-700"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold text-slate-800">경로 결과</h1>
            <div className="w-20" />
          </div>

          <div className="mt-4 rounded-3xl bg-slate-50 p-5">
            <p className="text-lg text-slate-600">출발</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {startPlace.placeName}
            </p>
            <p className="mt-4 text-lg text-slate-600">도착</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {endPlace.placeName}
            </p>
          </div>
        </div>

        {/* 지도 */}
        <div className="h-64 bg-slate-200">
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
                <p className="text-2xl font-bold text-slate-700">
                  {errorMessage || "경로가 없어요."}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-4 rounded-2xl bg-white px-6 py-4 text-xl font-bold text-slate-700 shadow-sm"
                >
                  다시 불러오기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 경로 정보 */}
        <div className="flex-1 space-y-4 p-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-6 text-xl text-slate-600 shadow-sm">
              경로를 찾고 있어요...
            </div>
          ) : selectedRoute ? (
            <>
              {/* 추천 경로 — 핵심 정보만 */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-lg text-slate-500">추천 경로</p>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {selectedRoute.title}
                </p>

                <div className="mt-4">
                  <span
                    className={`inline-block rounded-full px-5 py-3 text-xl font-bold ${getScoreBadgeTone(
                      selectedRoute.finalSafetyScore,
                    )}`}
                  >
                    {getScoreLabel(selectedRoute.finalSafetyScore)} (
                    {selectedRoute.finalSafetyScore}점)
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-lg text-slate-500">걸리는 시간</p>
                    <p className="mt-1 text-3xl font-bold text-slate-800">
                      {selectedRoute.time}분
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-lg text-slate-500">거리</p>
                    <p className="mt-1 text-3xl font-bold text-slate-800">
                      {selectedRoute.distance}
                    </p>
                  </div>
                </div>

                <p className="mt-5 rounded-2xl bg-emerald-50 px-5 py-5 text-xl leading-8 font-bold text-emerald-700">
                  {selectedRoute.guideLabel}
                </p>
              </div>

              {/* 다른 경로 선택 */}
              {routes.length > 1 && (
                <div className="space-y-3">
                  <p className="px-1 text-lg font-bold text-slate-500">
                    다른 경로
                  </p>
                  {routes
                    .filter((r) => r.id !== selectedRouteId)
                    .map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        selected={false}
                        onClick={() => setSelectedRouteId(route.id)}
                      />
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl bg-white p-6 text-xl text-slate-600 shadow-sm">
              경로가 없어요.
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 border-t bg-white p-4">
          <button
            type="button"
            onClick={handleStartNavigation}
            disabled={!selectedRoute || loading}
            className="w-full rounded-3xl bg-emerald-600 px-6 py-6 text-3xl font-bold text-white disabled:bg-slate-300"
          >
            이 길로 출발
          </button>
        </div>
      </div>
    </div>
  );
}
