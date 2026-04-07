import { useEffect, useRef, useState } from "react";
import type { PlaceItem } from "../../types/place";

declare global {
  interface Window {
    kakao: any;
  }
}

interface PlaceSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (value: string) => void;
  selectedPlace: PlaceItem | null;
  onSelectPlace: (place: PlaceItem) => void;
}

export default function PlaceSearchInput({
  label,
  placeholder,
  value,
  onChangeValue,
  selectedPlace,
  onSelectPlace,
}: PlaceSearchInputProps) {
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      setLoading(true);

      const places = new window.kakao.maps.services.Places();

      places.keywordSearch(value, (data: any[], status: string) => {
        setLoading(false);

        if (status !== window.kakao.maps.services.Status.OK || !data?.length) {
          setResults([]);
          return;
        }

        const parsed: PlaceItem[] = data.slice(0, 5).map((item) => ({
          id: item.id,
          placeName: item.place_name,
          addressName: item.address_name || "",
          roadAddressName: item.road_address_name || "",
          x: item.x,
          y: item.y,
        }));

        setResults(parsed);
        setIsOpen(true);
      });
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelect = (place: PlaceItem) => {
    onSelectPlace(place);
    onChangeValue(place.placeName);
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => {
          onChangeValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500"
        placeholder={placeholder}
      />

      {selectedPlace && (
        <p className="mt-1 text-xs text-slate-500">
          선택됨: {selectedPlace.placeName}
        </p>
      )}

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-3 text-sm text-slate-500">검색 중...</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {place.placeName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {place.roadAddressName || place.addressName}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
