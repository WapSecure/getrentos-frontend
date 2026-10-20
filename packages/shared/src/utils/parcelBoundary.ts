/**
 * A land plot's outline as the apps handle it: an ordered list of corners.
 * The API stores it as a GeoJSON Polygon with one closed ring of
 * [longitude, latitude] pairs; these helpers convert both ways.
 */
export interface BoundaryCorner {
  latitude: number;
  longitude: number;
}

export interface ParcelBoundaryGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

/** The corners of a stored outline (without the repeated closing corner); null if unusable. */
export function boundaryCorners(geometry: unknown): BoundaryCorner[] | null {
  const g = geometry as { type?: unknown; geometry?: unknown; coordinates?: unknown } | null;
  const polygon = g?.type === 'Feature' ? (g.geometry as typeof g) : g;
  if (!polygon || polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) return null;
  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring)) return null;
  const corners: BoundaryCorner[] = [];
  for (const point of ring) {
    if (!Array.isArray(point) || typeof point[0] !== 'number' || typeof point[1] !== 'number') {
      return null;
    }
    corners.push({ longitude: point[0], latitude: point[1] });
  }
  const first = corners[0];
  const last = corners[corners.length - 1];
  if (
    corners.length > 1 &&
    first.latitude === last.latitude &&
    first.longitude === last.longitude
  ) {
    corners.pop();
  }
  return corners.length >= 3 ? corners : null;
}

/** The outline to send to the API; null when there are too few corners to make a plot. */
export function boundaryGeometry(corners: BoundaryCorner[]): ParcelBoundaryGeometry | null {
  if (corners.length < 3) return null;
  const ring = corners.map((c) => [c.longitude, c.latitude] as [number, number]);
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
}

const WGS84_A = 6_378_137;
const WGS84_E2 = 0.00669437999014;

/**
 * Approximate area enclosed by the corners, in square metres. Plots are small
 * enough that projecting onto a plane at their mean latitude is accurate to
 * well under 1%.
 */
export function boundaryAreaSqm(corners: BoundaryCorner[]): number {
  if (corners.length < 3) return 0;
  // Metres per degree on the WGS 84 ellipsoid at the plot's latitude (the
  // API's ringAreaSqm does the same), so both report the same area.
  const meanLat = corners.reduce((sum, c) => sum + c.latitude, 0) / corners.length;
  const phi = (meanLat * Math.PI) / 180;
  const w = 1 - WGS84_E2 * Math.sin(phi) ** 2;
  const perRadian = Math.PI / 180;
  const mLat = ((WGS84_A * (1 - WGS84_E2)) / w ** 1.5) * perRadian;
  const mLng = ((WGS84_A * Math.cos(phi)) / Math.sqrt(w)) * perRadian;
  const [origin] = corners;
  const xy = corners.map((c) => [
    (c.longitude - origin.longitude) * mLng,
    (c.latitude - origin.latitude) * mLat,
  ]);
  let twice = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

const SQM_PER_UNIT = { SQUARE_METERS: 1, ACRE: 4046.8564224, HECTARE: 10_000 } as const;

/**
 * How far the drawn outline is from the area the owner typed, when far enough
 * to say so. Buyers see both, so a 600 sqm plot outlined as two hectares (a
 * corner dropped in the wrong street, or the wrong unit picked) would read as
 * a misrepresentation. Null when there is nothing to compare or they agree
 * within the tolerance: hand-drawn outlines are rarely exact.
 */
export function boundaryAreaMismatch(
  corners: BoundaryCorner[],
  statedValue: number,
  statedUnit: keyof typeof SQM_PER_UNIT,
  tolerance = 0.25
): { outlinedSqm: number; statedSqm: number; ratio: number } | null {
  const outlinedSqm = boundaryAreaSqm(corners);
  const statedSqm = statedValue * (SQM_PER_UNIT[statedUnit] ?? 1);
  if (!(outlinedSqm > 0) || !(statedSqm > 0)) return null;
  const ratio = outlinedSqm / statedSqm;
  return Math.abs(ratio - 1) > tolerance ? { outlinedSqm, statedSqm, ratio } : null;
}
