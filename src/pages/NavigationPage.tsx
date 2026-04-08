import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import useVoiceGuide from "../hooks/useVoiceGuide";
import type { PlaceItem } from "../types/place";
import type { RouteItem } from "../types/route";
import {
  getDistanceMeters,
  getNearestPathIndex,
  getRemainingDistance,
  isArrived,
  isOffRoute,
} from "../utils/navigation";

interface NavigationState {
  startPlace?: PlaceItem;
  endPlace?: PlaceItem;
  selectedRoute?: RouteItem;
}

export default function NavigationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { startPlace, endPlace, selectedRoute } = (location.state ||
    {}) as NavigationState;

  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [dangerMessage, setDangerMessage] = useState("");
  const [watchError, setWatchError] = useState("");
  const [guideMessage, setGuideMessage] = useState("안내를 준비하고 있어요.");
  const [offRoute, setOffRoute] = useState(false);
  const [arrived, setArrived] = useState(false);

  const { speak, resetLastMessage, voiceEnabled, toggleVoice } =
    useVoiceGuide();

  const absolutePath = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.relativePath;
  }, [selectedRoute]);

  const absoluteDangerPoints = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.dangerPoints;
  }, [selectedRoute]);

  // 위치 추적
  useEffect(() => {
    if (!navigator.geolocation) {
      setWatchError("이 브라우저에서는 위치를 사용할 수 없어요.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setWatchError("");
      },
      () => {
        setWatchError("위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // 위험 구간 감지
  useEffect(() => {
    if (!currentPosition || absoluteDangerPoints.length === 0) {
      setDangerMessage("");
      return;
    }

    const nearDanger = absoluteDangerPoints.find(
      (point) =>
        getDistanceMeters(
          currentPosition.lat,
          currentPosition.lng,
          point.lat,
          point.lng,
        ) < 80,
    );

    if (nearDanger) {
      setDangerMessage(nearDanger.message);
      speak(nearDanger.message);
    } else {
      setDangerMessage("");
    }
  }, [currentPosition, absoluteDangerPoints, speak]);

  // 경로 안내
  useEffect(() => {
    if (!currentPosition || absolutePath.length === 0) return;

    const destination = absolutePath[absolutePath.length - 1];

    if (isArrived(currentPosition.lat, currentPosition.lng, destination)) {
      if (!arrived) {
        setArrived(true);
        const msg = "도착했어요!";
        setGuideMessage(msg);
        speak(msg);
      }
      return;
    }

    if (arrived) {
      setArrived(false);
      resetLastMessage();
    }

    const off = isOffRoute(
      currentPosition.lat,
      currentPosition.lng,
      absolutePath,
      45,
    );
    setOffRoute(off);

    if (off) {
      const msg = "길을 벗어났어요. 천천히 돌아와 주세요.";
      setGuideMessage(msg);
      speak(msg);
      return;
    }

    const currentIndex = getNearestPathIndex(
      currentPosition.lat,
      currentPosition.lng,
      absolutePath,
    );
    const nextPoint =
      absolutePath[Math.min(currentIndex + 1, absolutePath.length - 1)];
    const nextDistance = getDistanceMeters(
      currentPosition.lat,
      currentPosition.lng,
      nextPoint.lat,
      nextPoint.lng,
    );

    let msg = "";
    if (nextDistance < 30) {
      msg = "계속 앞으로 가세요.";
    } else if (nextDistance < 80) {
      msg = `${Math.round(nextDistance)}m 앞까지 그대로 가세요.`;
    } else {
      msg = `${Math.round(nextDistance)}m 앞으로 이동하세요.`;
    }

    setGuideMessage(msg);
    speak(msg);
  }, [currentPosition, absolutePath, arrived, speak, resetLastMessage]);

  // 정보 없음
  if (!startPlace || !endPlace || !selectedRoute) {
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
            다시 경로 찾기
          </button>
        </div>
      </div>
    );
  }

  const currentIndex = currentPosition
    ? getNearestPathIndex(
        currentPosition.lat,
        currentPosition.lng,
        absolutePath,
      )
    : 0;

  const nextPoint =
    absolutePath[Math.min(currentIndex + 1, absolutePath.length - 1)];

  const remainingDistance = currentPosition
    ? getRemainingDistance(
        currentPosition.lat,
        currentPosition.lng,
        absolutePath,
        currentIndex,
      )
    : 0;

  const nextDistance =
    currentPosition && nextPoint
      ? getDistanceMeters(
          currentPosition.lat,
          currentPosition.lng,
          nextPoint.lat,
          nextPoint.lng,
        )
      : 0;

  const estimatedMinutes = Math.max(1, Math.round(remainingDistance / 67));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col">
        {/* 헤더 */}
        <div className="border-b bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl bg-slate-100 px-5 py-3 text-xl font-bold text-slate-700"
            >
              ← 뒤로
            </button>
            <h1 className="text-2xl font-bold text-slate-800">안내 중</h1>
            <button
              type="button"
              onClick={toggleVoice}
              className={`rounded-2xl px-4 py-3 text-lg font-bold ${
                voiceEnabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {voiceEnabled ? "🔊 켜짐" : "🔇 꺼짐"}
            </button>
          </div>

          <div className="mt-3 rounded-3xl bg-slate-50 p-4">
            <p className="text-lg text-slate-500">
              {startPlace.placeName} → {endPlace.placeName}
            </p>
          </div>
        </div>

        {/* 위험 알림 */}
        {dangerMessage && (
          <div className="bg-red-100 px-5 py-5 text-2xl leading-9 font-bold text-red-700">
            ⚠ 위험 구간이에요!
            <br />
            {dangerMessage}
          </div>
        )}

        {offRoute && !arrived && (
          <div className="bg-amber-100 px-5 py-5 text-2xl leading-9 font-bold text-amber-700">
            길을 벗어났어요.
            <br />
            천천히 돌아와 주세요.
          </div>
        )}

        {watchError && (
          <div className="bg-amber-50 px-5 py-4 text-xl font-semibold text-amber-700">
            {watchError}
          </div>
        )}

        {/* 지도 */}
        <div className="h-72 bg-slate-200">
          <MapView
            startPlace={startPlace}
            endPlace={endPlace}
            navigationPath={absolutePath}
            currentPosition={currentPosition}
          />
        </div>

        {/* 핵심 안내 — 크고 명확하게 */}
        <div className="flex-1 space-y-4 p-4">
          {/* 다음 안내 */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">다음 안내</p>
            <p className="mt-3 text-4xl leading-snug font-bold text-slate-800">
              {guideMessage}
            </p>
          </div>

          {/* 남은 거리 / 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <p className="text-lg text-slate-500">남은 거리</p>
              <p className="mt-2 text-4xl font-bold text-slate-800">
                {Math.round(remainingDistance)}m
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <p className="text-lg text-slate-500">남은 시간</p>
              <p className="mt-2 text-4xl font-bold text-slate-800">
                {estimatedMinutes}분
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
