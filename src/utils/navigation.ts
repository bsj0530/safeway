import type { RouteItem, RoutePoint, RiskPoint } from "../types/route";

export function buildAbsolutePath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  route: RouteItem,
): RoutePoint[] {
  return route.relativePath.map((point, index, arr) => {
    if (index === 0) {
      return { lat: startLat, lng: startLng };
    }

    if (index === arr.length - 1) {
      return { lat: endLat, lng: endLng };
    }

    return {
      lat:
        startLat + (endLat - startLat) * (index / (arr.length - 1)) + point.lat,
      lng:
        startLng + (endLng - startLng) * (index / (arr.length - 1)) + point.lng,
    };
  });
}

export function buildAbsoluteDangerPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  route: RouteItem,
): RiskPoint[] {
  return route.dangerPoints.map((point) => ({
    lat: startLat + (endLat - startLat) * 0.5 + point.lat,
    lng: startLng + (endLng - startLng) * 0.5 + point.lng,
    message: point.message,
  }));
}

export function getDistanceMeters(
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

export function getNearestPathIndex(
  currentLat: number,
  currentLng: number,
  path: RoutePoint[],
) {
  let minDistance = Number.MAX_SAFE_INTEGER;
  let nearestIndex = 0;

  path.forEach((point, index) => {
    const distance = getDistanceMeters(
      currentLat,
      currentLng,
      point.lat,
      point.lng,
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export function getRemainingDistance(
  currentLat: number,
  currentLng: number,
  path: RoutePoint[],
  currentIndex: number,
) {
  let total = 0;

  if (path.length === 0) return 0;

  total += getDistanceMeters(
    currentLat,
    currentLng,
    path[currentIndex].lat,
    path[currentIndex].lng,
  );

  for (let i = currentIndex; i < path.length - 1; i += 1) {
    total += getDistanceMeters(
      path[i].lat,
      path[i].lng,
      path[i + 1].lat,
      path[i + 1].lng,
    );
  }

  return total;
}

export function isOffRoute(
  currentLat: number,
  currentLng: number,
  path: RoutePoint[],
  thresholdMeters = 45,
) {
  if (path.length === 0) return false;

  const nearestIndex = getNearestPathIndex(currentLat, currentLng, path);
  const nearestPoint = path[nearestIndex];

  const distance = getDistanceMeters(
    currentLat,
    currentLng,
    nearestPoint.lat,
    nearestPoint.lng,
  );

  return distance > thresholdMeters;
}

export function isArrived(
  currentLat: number,
  currentLng: number,
  destination: RoutePoint,
  thresholdMeters = 25,
) {
  const distance = getDistanceMeters(
    currentLat,
    currentLng,
    destination.lat,
    destination.lng,
  );

  return distance <= thresholdMeters;
}
