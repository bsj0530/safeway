import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PlaceSearchInput from "../components/search/PlaceSearchInput";
import useKakaoLoader from "../hooks/useKakaoLoader";
import type { PlaceItem } from "../types/place";

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distance: number) {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${(distance / 1000).toFixed(1)}km`;
}

const MAX_WALKING_DISTANCE_METERS = 3000;

export interface RouteOptions {
  nightTravel: boolean;
  avoidStairs: boolean;
  avoidDarkRoad: boolean;
  avoidCrowdedArea: boolean;
  preferMainRoad: boolean;
  wheelchairMode: boolean;
}

const DEFAULT_ROUTE_OPTIONS: RouteOptions = {
  nightTravel: false,
  avoidStairs: false,
  avoidDarkRoad: false,
  avoidCrowdedArea: false,
  preferMainRoad: false,
  wheelchairMode: false,
};

export default function HomePage() {
  const navigate = useNavigate();
  const kakaoLoaded = useKakaoLoader();

  const [endKeyword, setEndKeyword] = useState("");
  const [endPlace, setEndPlace] = useState<PlaceItem | null>(null);

  const [currentPlace, setCurrentPlace] = useState<PlaceItem | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  const [distanceWarning, setDistanceWarning] = useState("");
  const [options, setOptions] = useState<RouteOptions>(DEFAULT_ROUTE_OPTIONS);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("현재 브라우저에서는 위치 정보를 지원하지 않습니다.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentPlace({
          id: "current-location",
          placeName: "현재 위치",
          addressName: "현재 위치 기반 출발",
          roadAddressName: "",
          x: String(lng),
          y: String(lat),
        });

        setLocationError("");
        setIsGettingLocation(false);
      },
      () => {
        setLocationError(
          "현재 위치를 불러올 수 없습니다. 위치 권한을 확인해 주세요.",
        );
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      },
    );
  }, []);

  useEffect(() => {
    if (!currentPlace || !endPlace) {
      setDistanceWarning("");
      return;
    }

    const distance = getDistanceMeters(
      Number(currentPlace.y),
      Number(currentPlace.x),
      Number(endPlace.y),
      Number(endPlace.x),
    );

    if (distance > MAX_WALKING_DISTANCE_METERS) {
      setDistanceWarning(
        `도보 기준으로 다소 먼 거리예요. 현재 위치에서 약 ${formatDistance(
          distance,
        )} 떨어져 있어요.`,
      );
    } else {
      setDistanceWarning("");
    }
  }, [currentPlace, endPlace]);

  const toggleOption = (key: keyof RouteOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("safeway-user");
    navigate("/");
  };

  const handleSubmit = () => {
    if (!currentPlace || !endPlace) return;

    const distance = getDistanceMeters(
      Number(currentPlace.y),
      Number(currentPlace.x),
      Number(endPlace.y),
      Number(endPlace.x),
    );

    if (distance > MAX_WALKING_DISTANCE_METERS) {
      alert(
        "도보 안내 기준 거리(3km)를 초과했습니다. 더 가까운 목적지를 선택해 주세요.",
      );
      return;
    }

    navigate("/result", {
      state: {
        startPlace: currentPlace,
        endPlace,
        options,
      },
    });
  };

  const isSubmitDisabled =
    !currentPlace || !endPlace || !!locationError || isGettingLocation;

  const endDistance =
    currentPlace && endPlace
      ? getDistanceMeters(
          Number(currentPlace.y),
          Number(currentPlace.x),
          Number(endPlace.y),
          Number(endPlace.x),
        )
      : null;

  const optionItems: Array<{ key: keyof RouteOptions; label: string }> = [
    { key: "nightTravel", label: "야간 이동" },
    { key: "avoidStairs", label: "계단 회피" },
    { key: "avoidDarkRoad", label: "어두운 길 회피" },
    { key: "avoidCrowdedArea", label: "혼잡 회피" },
    { key: "preferMainRoad", label: "큰길 우선" },
    { key: "wheelchairMode", label: "휠체어 모드" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">SafeWay</h1>
            <p className="mt-2 text-sm text-slate-500">
              빠른 길보다 안전한 길을 안내합니다
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            로그아웃
          </button>
        </div>

        {!kakaoLoaded ? (
          <div className="text-sm text-slate-500">지도 검색 준비 중...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">출발지</p>

              {isGettingLocation ? (
                <p className="mt-1 text-sm text-slate-500">
                  현재 위치를 불러오는 중...
                </p>
              ) : locationError ? (
                <p className="mt-1 text-sm text-red-600">{locationError}</p>
              ) : (
                <>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    현재 위치
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    내 위치를 출발지로 사용합니다
                  </p>
                </>
              )}
            </div>

            <PlaceSearchInput
              label="도착지"
              placeholder="목적지를 입력하세요"
              value={endKeyword}
              onChangeValue={(nextValue) => {
                setEndKeyword(nextValue);

                if (
                  endPlace &&
                  nextValue.trim() !== endPlace.placeName.trim()
                ) {
                  setEndPlace(null);
                }
              }}
              selectedPlace={endPlace}
              onSelectPlace={(place) => {
                setEndPlace(place);
                setEndKeyword(place.placeName);
              }}
              currentLocation={
                currentPlace
                  ? {
                      lat: Number(currentPlace.y),
                      lng: Number(currentPlace.x),
                    }
                  : null
              }
            />

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                안전 옵션
              </p>

              <div className="grid grid-cols-2 gap-3">
                {optionItems.map((item) => {
                  const active = options[item.key];

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleOption(item.key)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {endPlace && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-emerald-800">
                    선택한 목적지
                  </p>
                  {endDistance !== null && (
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-emerald-700">
                      {formatDistance(endDistance)}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {endPlace.placeName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {endPlace.roadAddressName || endPlace.addressName}
                </p>
              </div>
            )}

            {distanceWarning && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {distanceWarning}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              안전 경로 찾기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
