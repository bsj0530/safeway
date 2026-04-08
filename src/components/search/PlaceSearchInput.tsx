import { useEffect, useMemo, useRef, useState } from "react";
import type { FavoritePlace, PlaceItem } from "../../types/place";

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
  currentLocation?: {
    lat: number;
    lng: number;
  } | null;
}

interface SwipeRevealItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
}

const RECENT_PLACES_KEY = "safeway-recent-places";
const FAVORITE_PLACES_KEY = "safeway-favorite-places";
const MAX_RECENT_PLACES = 5;
const MAX_FAVORITE_PLACES = 10;

const SWIPE_OPEN_X = -72;
const SWIPE_THRESHOLD = -40;
const SWIPE_DELETE_THRESHOLD = -120;
const DELETE_ANIMATION_MS = 220;

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

function safeParseArray(value: string | null): unknown[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isObject(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null;
}

function isValidPlace(item: unknown): item is PlaceItem {
  if (!isObject(item)) return false;

  return (
    typeof item.id === "string" &&
    typeof item.placeName === "string" &&
    typeof item.addressName === "string" &&
    typeof item.roadAddressName === "string" &&
    typeof item.x === "string" &&
    typeof item.y === "string"
  );
}

function isValidFavoritePlace(item: unknown): item is FavoritePlace {
  if (!isObject(item)) return false;
  if (!isValidPlace(item)) return false;

  const nickname = (item as { nickname?: unknown }).nickname;
  return typeof nickname === "undefined" || typeof nickname === "string";
}

function SwipeRevealItem({
  children,
  onDelete,
  deleteLabel = "삭제",
}: SwipeRevealItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [height, setHeight] = useState<number | "auto">("auto");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const deletingRef = useRef(false);

  const triggerDelete = () => {
    if (deletingRef.current) return;
    deletingRef.current = true;

    const measuredHeight = containerRef.current?.offsetHeight ?? 0;
    setHeight(measuredHeight);
    setIsDeleting(true);
    setTranslateX(-140);

    window.setTimeout(() => {
      onDelete();
    }, DELETE_ANIMATION_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDeleting) return;
    startXRef.current = e.clientX;
    startTranslateRef.current = translateX;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || isDeleting) return;

    const deltaX = e.clientX - startXRef.current;
    const nextX = Math.min(
      0,
      Math.max(-140, startTranslateRef.current + deltaX),
    );
    setTranslateX(nextX);
  };

  const handlePointerEnd = () => {
    if (!dragging || isDeleting) return;
    setDragging(false);

    if (translateX <= SWIPE_DELETE_THRESHOLD) {
      triggerDelete();
      return;
    }

    if (translateX <= SWIPE_THRESHOLD) {
      setTranslateX(SWIPE_OPEN_X);
    } else {
      setTranslateX(0);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    triggerDelete();
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        height: height === "auto" ? "auto" : `${height}px`,
        opacity: isDeleting ? 0 : 1,
        transition: isDeleting
          ? `height ${DELETE_ANIMATION_MS}ms ease, opacity ${DELETE_ANIMATION_MS}ms ease`
          : "none",
      }}
    >
      <div className="relative overflow-hidden rounded-lg" ref={containerRef}>
        <div className="absolute inset-y-0 right-0 flex w-[72px] items-stretch justify-end">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="flex w-[72px] items-center justify-center bg-red-500 text-xs font-medium text-white transition hover:bg-red-600"
          >
            {deleteLabel}
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          className={`relative bg-white ${
            dragging || isDeleting ? "" : "transition-transform duration-200"
          } ${isDeleting ? "pointer-events-none" : ""}`}
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDeleting
              ? `transform ${DELETE_ANIMATION_MS}ms ease, opacity ${DELETE_ANIMATION_MS}ms ease`
              : undefined,
            opacity: isDeleting ? 0 : 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PlaceSearchInput({
  label,
  placeholder,
  value,
  onChangeValue,
  selectedPlace,
  onSelectPlace,
  currentLocation,
}: PlaceSearchInputProps) {
  const [results, setResults] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [recentPlaces, setRecentPlaces] = useState<PlaceItem[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>([]);

  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    const savedRecent = safeParseArray(
      localStorage.getItem(RECENT_PLACES_KEY),
    ).filter(isValidPlace);

    const savedFavorite = safeParseArray(
      localStorage.getItem(FAVORITE_PLACES_KEY),
    ).filter(isValidFavoritePlace);

    setRecentPlaces(savedRecent);
    setFavoritePlaces(savedFavorite);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    if (selectedPlace && value.trim() === selectedPlace.placeName.trim()) {
      setLoading(false);
      setHasSearched(false);
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
      setHasSearched(true);

      const places = new window.kakao.maps.services.Places();
      const options: Record<string, unknown> = {
        size: 5,
      };

      if (currentLocation) {
        options.location = new window.kakao.maps.LatLng(
          currentLocation.lat,
          currentLocation.lng,
        );
        options.radius = 3000;
        options.sort = window.kakao.maps.services.SortBy.DISTANCE;
      }

      places.keywordSearch(
        value,
        (data: any[], status: string) => {
          setLoading(false);
          setIsOpen(true);

          if (
            status !== window.kakao.maps.services.Status.OK ||
            !data?.length
          ) {
            setResults([]);
            return;
          }

          const parsed: PlaceItem[] = data.slice(0, 5).map((item) => ({
            id: String(item.id),
            placeName: String(item.place_name ?? ""),
            addressName: String(item.address_name ?? ""),
            roadAddressName: String(item.road_address_name ?? ""),
            x: String(item.x ?? ""),
            y: String(item.y ?? ""),
          }));

          setResults(parsed);
        },
        options,
      );
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [value, currentLocation, selectedPlace]);

  const saveRecentPlaces = (nextPlaces: PlaceItem[]) => {
    setRecentPlaces(nextPlaces);
    localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(nextPlaces));
  };

  const saveFavoritePlaces = (nextPlaces: FavoritePlace[]) => {
    setFavoritePlaces(nextPlaces);
    localStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(nextPlaces));
  };

  const addRecentPlace = (place: PlaceItem) => {
    const updated = [
      place,
      ...recentPlaces.filter((item) => item.id !== place.id),
    ].slice(0, MAX_RECENT_PLACES);

    saveRecentPlaces(updated);
  };

  const removeRecentPlace = (placeId: string) => {
    saveRecentPlaces(recentPlaces.filter((item) => item.id !== placeId));
  };

  const clearRecentPlaces = () => {
    saveRecentPlaces([]);
  };

  const isFavorite = (placeId: string) => {
    return favoritePlaces.some((item) => item.id === placeId);
  };

  const getFavoriteById = (placeId: string) => {
    return favoritePlaces.find((item) => item.id === placeId);
  };

  const askFavoriteNickname = (defaultValue = "") => {
    const input = window.prompt(
      "즐겨찾기 이름을 입력하세요. 예: 집, 학교, 회사",
      defaultValue,
    );

    if (input === null) return null;
    return input.trim();
  };

  const addFavoritePlace = (place: PlaceItem) => {
    const nickname = askFavoriteNickname("");
    if (nickname === null) return;

    const nextPlace: FavoritePlace = {
      ...place,
      nickname,
    };

    const updated = [
      nextPlace,
      ...favoritePlaces.filter((item) => item.id !== place.id),
    ].slice(0, MAX_FAVORITE_PLACES);

    saveFavoritePlaces(updated);
  };

  const removeFavoritePlace = (placeId: string) => {
    saveFavoritePlaces(favoritePlaces.filter((item) => item.id !== placeId));
  };

  const toggleFavoritePlace = (place: PlaceItem) => {
    if (isFavorite(place.id)) {
      removeFavoritePlace(place.id);
      return;
    }

    addFavoritePlace(place);
  };

  const editFavoriteNickname = (placeId: string) => {
    const target = getFavoriteById(placeId);
    if (!target) return;

    const nextNickname = askFavoriteNickname(target.nickname ?? "");
    if (nextNickname === null) return;

    const updated = favoritePlaces.map((item) =>
      item.id === placeId ? { ...item, nickname: nextNickname } : item,
    );

    saveFavoritePlaces(updated);
  };

  const handleSelect = (place: PlaceItem) => {
    addRecentPlace(place);
    skipNextSearchRef.current = true;
    onSelectPlace(place);
    onChangeValue(place.placeName);
    setResults([]);
    setHasSearched(false);
    setIsOpen(false);
  };

  const getDistanceLabel = (place: PlaceItem) => {
    if (!currentLocation) return null;

    const distance = getDistanceMeters(
      currentLocation.lat,
      currentLocation.lng,
      Number(place.y),
      Number(place.x),
    );

    return formatDistance(distance);
  };

  const showRecentAndFavorites = useMemo(() => {
    return !value.trim() && isOpen;
  }, [value, isOpen]);

  const showEmptyMessage = useMemo(() => {
    return (
      isOpen &&
      !loading &&
      !!value.trim() &&
      hasSearched &&
      results.length === 0
    );
  }, [isOpen, loading, value, hasSearched, results.length]);

  return (
    <div ref={wrapperRef} className="relative">
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
          setIsOpen(true);
        }}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500"
        placeholder={placeholder}
      />

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="p-3 text-sm text-slate-500">검색 중...</div>
          )}

          {!loading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((place) => {
                const favorite = isFavorite(place.id);
                const distanceLabel = getDistanceLabel(place);

                return (
                  <li
                    key={place.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => handleSelect(place)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {place.placeName}
                          </p>
                          {distanceLabel && (
                            <span className="shrink-0 text-xs text-emerald-600">
                              {distanceLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {place.roadAddressName || place.addressName}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavoritePlace(place)}
                        className="shrink-0 rounded-lg px-2 py-1 text-sm text-amber-500 hover:bg-amber-50"
                        aria-label={
                          favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"
                        }
                      >
                        {favorite ? "★" : "☆"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {showEmptyMessage && (
            <div className="p-4 text-sm text-slate-500">
              <p className="font-medium text-slate-700">검색 결과가 없어요</p>
              <p className="mt-1 text-xs text-slate-500">
                다른 키워드나 장소명을 입력해 보세요.
              </p>
            </div>
          )}

          {showRecentAndFavorites && (
            <div className="max-h-80 overflow-y-auto">
              {favoritePlaces.length > 0 && (
                <div className="border-b border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400">
                      자주 가는 장소
                    </p>
                  </div>

                  <div className="space-y-1">
                    {favoritePlaces.map((place) => {
                      const distanceLabel = getDistanceLabel(place);

                      return (
                        <SwipeRevealItem
                          key={place.id}
                          onDelete={() => removeFavoritePlace(place.id)}
                        >
                          <div className="rounded-lg px-2 py-2 hover:bg-slate-50">
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelect(place)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    ★ {place.nickname || place.placeName}
                                  </p>
                                  {distanceLabel && (
                                    <span className="shrink-0 text-xs text-emerald-600">
                                      {distanceLabel}
                                    </span>
                                  )}
                                </div>

                                {place.nickname && (
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {place.placeName}
                                  </p>
                                )}

                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {place.roadAddressName || place.addressName}
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => editFavoriteNickname(place.id)}
                                className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100"
                              >
                                이름
                              </button>
                            </div>
                          </div>
                        </SwipeRevealItem>
                      );
                    })}
                  </div>
                </div>
              )}

              {recentPlaces.length > 0 && (
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400">
                      최근 검색어
                    </p>
                    <button
                      type="button"
                      onClick={clearRecentPlaces}
                      className="rounded-lg px-2 py-1 text-xs text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      전체 삭제
                    </button>
                  </div>

                  <div className="space-y-1">
                    {recentPlaces.map((place) => {
                      const distanceLabel = getDistanceLabel(place);

                      return (
                        <SwipeRevealItem
                          key={place.id}
                          onDelete={() => removeRecentPlace(place.id)}
                        >
                          <div className="rounded-lg px-2 py-2 hover:bg-slate-50">
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelect(place)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    {place.placeName}
                                  </p>
                                  {distanceLabel && (
                                    <span className="shrink-0 text-xs text-emerald-600">
                                      {distanceLabel}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {place.roadAddressName || place.addressName}
                                </p>
                              </button>
                            </div>
                          </div>
                        </SwipeRevealItem>
                      );
                    })}
                  </div>
                </div>
              )}

              {favoritePlaces.length === 0 && recentPlaces.length === 0 && (
                <div className="p-4 text-sm text-slate-500">
                  최근 검색이나 저장된 장소가 아직 없어요.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
