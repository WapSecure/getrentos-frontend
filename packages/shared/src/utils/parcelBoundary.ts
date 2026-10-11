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

const EARTH_RADIUS_M = 6_371_008.8;

/**
 * Approximate area enclosed by the corners, in square metres. Plots are small
 * enough that projecting onto a plane at their mean latitude is accurate to
 * well under 1%.
 */
export function boundaryAreaSqm(corners: BoundaryCorner[]): number {
  if (corners.length < 3) return 0;
  const toRad = Math.PI / 180;
  const meanLat = (corners.reduce((sum, c) => sum + c.latitude, 0) / corners.length) * toRad;
  const xy = corners.map((c) => [
    c.longitude * toRad * EARTH_RADIUS_M * Math.cos(meanLat),
    c.latitude * toRad * EARTH_RADIUS_M,
  ]);
  let twice = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}
