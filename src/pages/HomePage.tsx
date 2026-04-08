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
  if (distance < 1000) return `${Math.round(distance)}m`;
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

// 노인 사용자에게 보여줄 핵심 옵션만
const VISIBLE_OPTIONS: Array<{ key: keyof RouteOptions; label: string }> = [
  { key: "avoidStairs", label: "계단 피하기" },
  { key: "avoidDarkRoad", label: "어두운 길 피하기" },
  { key: "wheelchairMode", label: "휠체어 모드" },
];

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
      setLocationError("위치 정보를 지원하지 않는 브라우저입니다.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPlace({
          id: "current-location",
          placeName: "현재 위치",
          addressName: "현재 위치 기반 출발",
          roadAddressName: "",
          x: String(position.coords.longitude),
          y: String(position.coords.latitude),
        });
        setLocationError("");
        setIsGettingLocation(false);
      },
      () => {
        setLocationError("위치 권한을 확인해 주세요.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
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

    setDistanceWarning(
      distance > MAX_WALKING_DISTANCE_METERS
        ? `약 ${formatDistance(distance)} 떨어져 있어서 걸어가기 먼 거리예요.`
        : "",
    );
  }, [currentPlace, endPlace]);

  const toggleOption = (key: keyof RouteOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
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
      alert("걸어가기엔 먼 거리예요. 더 가까운 곳을 선택해 주세요.");
      return;
    }

    navigate("/result", {
      state: { startPlace: currentPlace, endPlace, options },
    });
  };

  const isSubmitDisabled =
    !currentPlace || !endPlace || !!locationError || isGettingLocation;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto w-full max-w-xl rounded-[28px] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">SafeWay</h1>
            <p className="mt-3 text-xl leading-8 text-slate-600">
              안전한 길을 찾아드려요
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-700"
          >
            로그아웃
          </button>
        </div>

        {!kakaoLoaded ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-xl text-slate-600">
            준비 중입니다...
          </div>
        ) : (
          <div className="space-y-5">
            {/* 출발지 */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xl font-bold text-slate-800">출발지</p>
              {isGettingLocation ? (
                <p className="mt-3 text-xl text-slate-600">
                  현재 위치를 찾고 있어요...
                </p>
              ) : locationError ? (
                <p className="mt-3 text-xl font-semibold text-red-600">
                  {locationError}
                </p>
              ) : (
                <p className="mt-3 text-2xl font-bold text-slate-800">
                  현재 위치
                </p>
              )}
            </div>

            {/* 도착지 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="mb-3 text-xl font-bold text-slate-800">
                어디로 가시나요?
              </p>
              <PlaceSearchInput
                label=""
                placeholder="목적지를 입력하세요"
                value={endKeyword}
                onChangeValue={(v) => {
                  setEndKeyword(v);
                  if (endPlace && v.trim() !== endPlace.placeName.trim()) {
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
            </div>

            {/* 선택한 목적지 */}
            {endPlace && (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5">
                <p className="text-xl font-bold text-emerald-800">
                  선택한 목적지
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {endPlace.placeName}
                </p>
                <p className="mt-2 text-lg text-slate-600">
                  {endPlace.roadAddressName || endPlace.addressName}
                </p>
              </div>
            )}

            {distanceWarning && (
              <div className="rounded-3xl bg-amber-50 px-5 py-4 text-xl leading-8 font-semibold text-amber-700">
                {distanceWarning}
              </div>
            )}

            {/* 안전 옵션 — 핵심 3개만 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xl font-bold text-slate-800">안전 옵션</p>
              <p className="mt-2 text-lg text-slate-600">
                필요한 것을 눌러주세요
              </p>

              <div className="mt-4 space-y-3">
                {VISIBLE_OPTIONS.map((item) => {
                  const active = options[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleOption(item.key)}
                      className={`w-full rounded-2xl border px-5 py-5 text-xl font-bold transition ${
                        active
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full rounded-3xl bg-emerald-600 px-6 py-6 text-3xl font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              안전한 길 찾기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
