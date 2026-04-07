import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import useVoiceGuide from "../hooks/useVoiceGuide";
import type { PlaceItem } from "../types/place";
import type { RouteItem } from "../types/route";
import {
  buildAbsoluteDangerPoints,
  buildAbsolutePath,
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
  const [guideMessage, setGuideMessage] = useState("안내를 준비 중입니다.");
  const [offRoute, setOffRoute] = useState(false);
  const [arrived, setArrived] = useState(false);

  const { speak, resetLastMessage, voiceEnabled, toggleVoice } =
    useVoiceGuide();

  const absolutePath = useMemo(() => {
    if (!startPlace || !endPlace || !selectedRoute) return [];

    return buildAbsolutePath(
      Number(startPlace.y),
      Number(startPlace.x),
      Number(endPlace.y),
      Number(endPlace.x),
      selectedRoute,
    );
  }, [startPlace, endPlace, selectedRoute]);

  const absoluteDangerPoints = useMemo(() => {
    if (!startPlace || !endPlace || !selectedRoute) return [];

    return buildAbsoluteDangerPoints(
      Number(startPlace.y),
      Number(startPlace.x),
      Number(endPlace.y),
      Number(endPlace.x),
      selectedRoute,
    );
  }, [startPlace, endPlace, selectedRoute]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWatchError("현재 브라우저에서는 위치 추적을 지원하지 않습니다.");
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
        setWatchError("위치 권한이 없어서 현재 위치를 불러올 수 없습니다.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!currentPosition || absoluteDangerPoints.length === 0) {
      setDangerMessage("");
      return;
    }

    const nearDanger = absoluteDangerPoints.find((point) => {
      const distance = getDistanceMeters(
        currentPosition.lat,
        currentPosition.lng,
        point.lat,
        point.lng,
      );

      return distance < 80;
    });

    if (nearDanger) {
      setDangerMessage(nearDanger.message);
      speak(nearDanger.message);
    } else {
      setDangerMessage("");
    }
  }, [currentPosition, absoluteDangerPoints, speak]);

  useEffect(() => {
    if (!currentPosition || absolutePath.length === 0) return;

    const destination = absolutePath[absolutePath.length - 1];

    if (isArrived(currentPosition.lat, currentPosition.lng, destination)) {
      if (!arrived) {
        setArrived(true);
        setGuideMessage("목적지에 도착했습니다.");
        speak("목적지에 도착했습니다.");
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
      const message = "경로를 이탈했습니다. 안전한 경로로 다시 이동해 주세요.";
      setGuideMessage(message);
      speak(message);
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

    let message = "";

    if (nextDistance < 30) {
      message = "다음 지점을 지나고 있습니다. 계속 직진해 주세요.";
    } else if (nextDistance < 80) {
      message = `${Math.round(nextDistance)}미터 앞까지 현재 경로를 따라 이동해 주세요.`;
    } else {
      message = `${Math.round(nextDistance)}미터 앞의 다음 지점까지 안내합니다.`;
    }

    setGuideMessage(message);
    speak(message);
  }, [currentPosition, absolutePath, arrived, speak, resetLastMessage]);

  if (!startPlace || !endPlace || !selectedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-slate-700">안내할 경로 정보가 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-white"
          >
            홈으로 이동
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
    <div className="flex h-screen flex-col bg-slate-50">
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-slate-800">안내 중</h1>
          <div className="w-10" />
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{selectedRoute.title}</p>
            <p className="text-base font-semibold text-slate-800">
              {selectedRoute.guideLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              현재 음성 안내: {voiceEnabled ? "켜짐" : "꺼짐"}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleVoice}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              voiceEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {voiceEnabled ? "음성 안내 ON" : "음성 안내 OFF"}
          </button>
        </div>
      </div>

      {dangerMessage && (
        <div className="bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ⚠ {dangerMessage}
        </div>
      )}

      {offRoute && !arrived && (
        <div className="bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          경로 이탈 감지됨
        </div>
      )}

      {watchError && (
        <div className="bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {watchError}
        </div>
      )}

      <div className="h-80 bg-slate-200">
        <MapView
          startPlace={startPlace}
          endPlace={endPlace}
          navigationPath={absolutePath}
          currentPosition={currentPosition}
        />
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">다음 안내</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {guideMessage}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            다음 목표 지점까지 {Math.round(nextDistance)}m
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">남은 거리</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {Math.round(remainingDistance)}m
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">예상 시간</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {estimatedMinutes}분
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">이동 정보</p>
          <p className="mt-1 text-sm text-slate-700">
            출발: {startPlace.placeName}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            도착: {endPlace.placeName}
          </p>
        </div>
      </div>
    </div>
  );
}
