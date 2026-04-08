import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import MapView from "../components/map/MapView";
import useVoiceGuide from "../hooks/useVoiceGuide";
import type { PlaceItem } from "../types/place";
import type { RiskLevel, RouteItem } from "../types/route";
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

function getRiskLevelText(level: RiskLevel) {
  if (level === "low") return "낮음";
  if (level === "medium") return "보통";
  return "높음";
}

function getCrowdLevelText(level: RouteItem["crowdLevel"]) {
  if (level === "low") return "여유";
  if (level === "medium") return "보통";
  return "혼잡";
}

function getScoreTone(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score >= 70) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
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
    if (!selectedRoute) return [];
    return selectedRoute.relativePath;
  }, [selectedRoute]);

  const absoluteDangerPoints = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.dangerPoints;
  }, [selectedRoute]);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-800">
            경로 정보가 없습니다.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
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

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getScoreTone(
              selectedRoute.finalSafetyScore,
            )}`}
          >
            최종 안전 {selectedRoute.finalSafetyScore}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            혼잡도 {getCrowdLevelText(selectedRoute.crowdLevel)}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            위험 {selectedRoute.riskCount}곳
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            사건 {selectedRoute.incidentCount}건
          </span>

          {selectedRoute.hasEvent && (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
              행사 영향 있음
            </span>
          )}
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

      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">다음 안내</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {guideMessage}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            다음 목표 지점까지 {Math.round(nextDistance)}m
          </p>
        </div>

        {selectedRoute.realtimeBadges.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">실시간 상태</p>
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
            <p className="mt-3 text-sm text-slate-700">
              {selectedRoute.realtimeSummary}
            </p>
          </div>
        )}

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

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">실시간 위험도</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {selectedRoute.realtimeRiskScore}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">케어 적합도</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {selectedRoute.careTargetFitScore}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">세부 위험도</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              날씨 {getRiskLevelText(selectedRoute.weatherRiskLevel)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              조도 {getRiskLevelText(selectedRoute.lightingRiskLevel)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              경사 {getRiskLevelText(selectedRoute.slopeRiskLevel)}
            </span>
          </div>

          {selectedRoute.risks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedRoute.risks.map((risk) => (
                <span
                  key={risk}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
                >
                  {risk}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">이동 정보</p>
          <p className="mt-1 text-sm text-slate-700">
            출발: {startPlace.placeName}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            도착: {endPlace.placeName}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            선택 경로: {selectedRoute.title}
          </p>
        </div>
      </div>
    </div>
  );
}
