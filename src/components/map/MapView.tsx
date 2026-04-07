import { useEffect, useRef } from "react";
import type { PlaceItem } from "../../types/place";
import type { RouteItem, RoutePoint } from "../../types/route";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapViewProps {
  startPlace?: PlaceItem;
  endPlace?: PlaceItem;
  routes?: RouteItem[];
  selectedRouteId?: number;
  navigationPath?: RoutePoint[];
  currentPosition?: { lat: number; lng: number } | null;
}

export default function MapView({
  startPlace,
  endPlace,
  routes = [],
  selectedRouteId,
  navigationPath,
  currentPosition,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !containerRef.current) return;
    if (!startPlace || !endPlace) return;

    window.kakao.maps.load(() => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      const startLat = Number(startPlace.y);
      const startLng = Number(startPlace.x);
      const endLat = Number(endPlace.y);
      const endLng = Number(endPlace.x);

      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(startLat, startLng),
        level: 5,
      });

      const startPoint = new window.kakao.maps.LatLng(startLat, startLng);
      const endPoint = new window.kakao.maps.LatLng(endLat, endLng);

      new window.kakao.maps.Marker({ position: startPoint }).setMap(map);
      new window.kakao.maps.Marker({ position: endPoint }).setMap(map);

      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(startPoint);
      bounds.extend(endPoint);

      if (navigationPath && navigationPath.length > 1) {
        const navPath = navigationPath.map(
          (point) => new window.kakao.maps.LatLng(point.lat, point.lng),
        );

        const polyline = new window.kakao.maps.Polyline({
          path: navPath,
          strokeWeight: 6,
          strokeColor: "#16a34a",
          strokeOpacity: 0.95,
          strokeStyle: "solid",
        });

        polyline.setMap(map);
        navPath.forEach((point: any) => bounds.extend(point));

        if (currentPosition) {
          const currentMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              currentPosition.lat,
              currentPosition.lng,
            ),
          });

          currentMarker.setMap(map);
          bounds.extend(
            new window.kakao.maps.LatLng(
              currentPosition.lat,
              currentPosition.lng,
            ),
          );
        }

        map.setBounds(bounds);
        return;
      }

      routes.forEach((route) => {
        const path = route.relativePath.map(
          (point) => new window.kakao.maps.LatLng(point.lat, point.lng),
        );

        path.forEach((point: any) => bounds.extend(point));

        const isSelected = route.id === selectedRouteId;

        const polyline = new window.kakao.maps.Polyline({
          path,
          strokeWeight: isSelected ? 6 : 4,
          strokeColor: route.color,
          strokeOpacity: isSelected ? 0.95 : 0.35,
          strokeStyle: "solid",
        });

        polyline.setMap(map);
      });

      map.setBounds(bounds);
    });
  }, [
    startPlace,
    endPlace,
    routes,
    selectedRouteId,
    navigationPath,
    currentPosition,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
}
