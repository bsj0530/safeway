import { useState } from "react";
import { useNavigate } from "react-router";
import PlaceSearchInput from "../components/search/PlaceSearchInput";
import useKakaoLoader from "../hooks/useKakaoLoader";
import type { PlaceItem } from "../types/place";

export default function HomePage() {
  const navigate = useNavigate();
  const kakaoLoaded = useKakaoLoader();

  const [startKeyword, setStartKeyword] = useState("");
  const [endKeyword, setEndKeyword] = useState("");
  const [startPlace, setStartPlace] = useState<PlaceItem | null>(null);
  const [endPlace, setEndPlace] = useState<PlaceItem | null>(null);

  const handleSubmit = () => {
    if (!startPlace || !endPlace) return;

    navigate("/result", {
      state: {
        startPlace,
        endPlace,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">SafeWay</h1>
          <p className="mt-2 text-sm text-slate-500">
            빠른 길보다 안전한 길을 안내합니다
          </p>
        </div>

        {!kakaoLoaded ? (
          <div className="text-sm text-slate-500">지도 검색 준비 중...</div>
        ) : (
          <div className="space-y-4">
            <PlaceSearchInput
              label="출발지"
              placeholder="장소명을 입력하세요"
              value={startKeyword}
              onChangeValue={setStartKeyword}
              selectedPlace={startPlace}
              onSelectPlace={setStartPlace}
            />

            <PlaceSearchInput
              label="도착지"
              placeholder="장소명을 입력하세요"
              value={endKeyword}
              onChangeValue={setEndKeyword}
              selectedPlace={endPlace}
              onSelectPlace={setEndPlace}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!startPlace || !endPlace}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white disabled:bg-slate-300"
            >
              안전 경로 찾기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
