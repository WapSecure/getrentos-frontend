// Pure: shared by the browsers and the lazily loaded map, and safe on the server.

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * A searched area: a box (south-west and north-east corners, in degrees), or a drawn polygon with its
 * bounding box. The box is always set, so framing the map works the same for both.
 */
export interface MapArea {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  polygon?: LatLng[];
}

/** The API takes at most this many corners on a drawn area, and at least three. */
export const MAP_POLYGON_MAX_POINTS = 50;
export const MAP_POLYGON_MIN_POINTS = 3;

export type DiscoveryView = 'grid' | 'map';

/** Four decimals is about 11 m: precise enough for a viewport, short enough for a link. */
const round = (n: number) => Math.round(n * 10_000) / 10_000;

/** Five decimals is about 1 m: a drawn corner keeps its shape, and 50 of them still fit a link. */
const roundPoint = (n: number) => Math.round(n * 100_000) / 100_000;

/** `lat,lng,lat,lng,...`: what the API's `polygon` parameter reads. */
export const formatPolygon = (points: LatLng[]) =>
  points.flatMap((p) => [roundPoint(p.lat), roundPoint(p.lng)]).join(',');

export function boundsOfPolygon(points: LatLng[]): MapArea {
  return {
    minLat: Math.min(...points.map((p) => p.lat)),
    minLng: Math.min(...points.map((p) => p.lng)),
    maxLat: Math.max(...points.map((p) => p.lat)),
    maxLng: Math.max(...points.map((p) => p.lng)),
  };
}

/**
 * A drawn shape as a search area, or undefined when it cannot be one (too few corners or no size).
 * A shape with more corners than the API takes is thinned evenly rather than refused.
 */
export function polygonArea(points: LatLng[]): MapArea | undefined {
  let clean = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({
      lat: roundPoint(Math.min(Math.max(p.lat, -90), 90)),
      lng: roundPoint(Math.min(Math.max(p.lng, -180), 180)),
    }))
    .filter((p, i, all) => i === 0 || p.lat !== all[i - 1].lat || p.lng !== all[i - 1].lng);
  if (clean.length > 1) {
    const [first, last] = [clean[0], clean[clean.length - 1]];
    if (first.lat === last.lat && first.lng === last.lng) clean = clean.slice(0, -1);
  }
  if (clean.length > MAP_POLYGON_MAX_POINTS) {
    const step = clean.length / MAP_POLYGON_MAX_POINTS;
    clean = Array.from({ length: MAP_POLYGON_MAX_POINTS }, (_, i) => clean[Math.floor(i * step)]);
  }
  if (clean.length < MAP_POLYGON_MIN_POINTS) return undefined;
  const box = boundsOfPolygon(clean);
  if (box.minLat >= box.maxLat || box.minLng >= box.maxLng) return undefined;
  return { ...box, polygon: clean };
}

/** `area=minLat,minLng,maxLat,maxLng` in the URL, or `area=lat,lng,lat,lng,...` (three or more points) for a drawn shape. */
export function formatAreaParam(area: MapArea): string {
  if (area.polygon) return formatPolygon(area.polygon);
  return [area.minLat, area.minLng, area.maxLat, area.maxLng].map(round).join(',');
}

/** Undefined for anything that is not a valid box or shape, so a mangled link falls back to the full list. */
export function parseAreaParam(value: string | null | undefined): MapArea | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return undefined;
  if (parts.length >= MAP_POLYGON_MIN_POINTS * 2) {
    if (parts.length % 2 !== 0 || parts.length > MAP_POLYGON_MAX_POINTS * 2) return undefined;
    const points: LatLng[] = [];
    for (let i = 0; i < parts.length; i += 2) points.push({ lat: parts[i], lng: parts[i + 1] });
    if (points.some((p) => Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180)) return undefined;
    return polygonArea(points);
  }
  if (parts.length !== 4) return undefined;
  const [minLat, minLng, maxLat, maxLng] = parts;
  if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) return undefined;
  if (minLat >= maxLat || minLng >= maxLng) return undefined;
  return { minLat, minLng, maxLat, maxLng };
}

/** The API's four bounds, or its `polygon` for a drawn shape (never both); spread into a list query. */
export function areaQuery(area: MapArea | undefined) {
  if (area?.polygon) return { polygon: formatPolygon(area.polygon) };
  return area
    ? {
        minLat: round(area.minLat),
        minLng: round(area.minLng),
        maxLat: round(area.maxLat),
        maxLng: round(area.maxLng),
      }
    : {};
}

/** A stable key for an area, so effects refit or redraw only when it really changes. */
export const areaKey = (area: MapArea | undefined) => (area ? formatAreaParam(area) : '');

export const parseView = (value: string | null | undefined): DiscoveryView =>
  value === 'map' ? 'map' : 'grid';

/** A point the map can draw. The API only sends one where the listing's location is public. */
export interface MapPoint {
  latitude?: number;
  longitude?: number;
  /** "approximate" points are blurred by the API until the property is verified. */
  locationPrecision?: 'exact' | 'approximate';
}

export const hasMapPoint = <T extends MapPoint>(
  item: T
): item is T & { latitude: number; longitude: number } =>
  typeof item.latitude === 'number' &&
  typeof item.longitude === 'number' &&
  Number.isFinite(item.latitude) &&
  Number.isFinite(item.longitude);
