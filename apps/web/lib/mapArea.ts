// Pure: shared by the browsers and the lazily loaded map, and safe on the server.

/** A map viewport: south-west and north-east corners, in degrees. */
export interface MapArea {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export type DiscoveryView = 'grid' | 'map';

/** Four decimals is about 11 m: precise enough for a viewport, short enough for a link. */
const round = (n: number) => Math.round(n * 10_000) / 10_000;

/** `area=minLat,minLng,maxLat,maxLng` in the URL. */
export function formatAreaParam(area: MapArea): string {
  return [area.minLat, area.minLng, area.maxLat, area.maxLng].map(round).join(',');
}

/** Undefined for anything that is not a valid box, so a mangled link falls back to the full list. */
export function parseAreaParam(value: string | null | undefined): MapArea | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [minLat, minLng, maxLat, maxLng] = parts;
  if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) return undefined;
  if (minLat >= maxLat || minLng >= maxLng) return undefined;
  return { minLat, minLng, maxLat, maxLng };
}

/** The API's four bounds; spread into a list query. */
export function areaQuery(area: MapArea | undefined) {
  return area
    ? {
        minLat: round(area.minLat),
        minLng: round(area.minLng),
        maxLat: round(area.maxLat),
        maxLng: round(area.maxLng),
      }
    : {};
}

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
