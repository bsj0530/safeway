import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import RouteCard from "../components/route/routeCard";
import { getRoutes } from "../services/navigationService";
import type { PlaceItem } from "../types/place";
import type { RouteItem } from "../types/route";

interface ResultState {
  startPlace?: PlaceItem;
  endPlace?: PlaceItem;
}

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { startPlace, endPlace } = (location.state || {}) as ResultState;

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startPlace || !endPlace) return;

    const fetchRoutes = async () => {
      setLoading(true);

      try {
        const response = await getRoutes({ startPlace, endPlace });
        setRoutes(response.routes);

        const defaultRoute =
          response.routes.find((route) => route.type === "safe") ??
          response.routes[0];

        setSelectedRouteId(defaultRoute?.id ?? null);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [startPlace, endPlace]);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0];

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

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="flex items-center justify-between border-b bg-white p-4">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-slate-600"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-slate-800">경로 결과</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pt-3 text-sm text-slate-600">
        <p>출발: {startPlace?.placeName || "미선택"}</p>
        <p>도착: {endPlace?.placeName || "미선택"}</p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="h-72 bg-slate-200">
          {!loading && selectedRouteId !== null && (
            <MapView
              startPlace={startPlace}
              endPlace={endPlace}
              routes={routes}
              selectedRouteId={selectedRouteId}
            />
          )}
        </div>

        <div className="space-y-3 p-4">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
              경로를 불러오는 중...
            </div>
          ) : (
            routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                selected={route.id === selectedRouteId}
                onClick={() => setSelectedRouteId(route.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <button
          type="button"
          onClick={handleStartNavigation}
          disabled={!selectedRoute}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:bg-slate-300"
        >
          이 경로로 안내 시작
        </button>
      </div>
    </div>
  );
}
