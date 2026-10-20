/**
 * Mirror of the API's src/shared/geo/crs.ts, so the boundary editor can preview
 * survey-plan coordinates on the map before saving. The API converts again and
 * is the authority; keep the two files in step.
 */
/**
 * Coordinate reference systems used on Nigerian survey plans, and the maths to
 * turn their eastings and northings into the WGS 84 longitude/latitude the
 * apps store and draw.
 *
 * Survey plans in Nigeria give beacon coordinates on the Minna datum, either
 * on a UTM zone (31N west of 6°E, 32N east of it) or on one of the national
 * Transverse Mercator belts (West, Mid, East). A surveyor reading those
 * numbers into a form that expects latitude and longitude produces points in
 * the ocean, so the boundary parser asks which system the numbers are in and
 * converts them here.
 *
 * The Minna to WGS 84 shift is the published three-parameter transformation
 * (EPSG:1167, about ±15 m). That is enough to place and compare plots; the
 * surveyor's sign-off, not this conversion, is what vouches for a boundary.
 */

export type CrsCode =
  | 'EPSG:4326'
  | 'EPSG:26331'
  | 'EPSG:26332'
  | 'EPSG:32631'
  | 'EPSG:32632'
  | 'EPSG:26391'
  | 'EPSG:26392'
  | 'EPSG:26393';

interface Ellipsoid {
  a: number;
  f: number;
}

const WGS84: Ellipsoid = { a: 6378137, f: 1 / 298.257223563 };
/** Clarke 1880 (RGS), the ellipsoid of the Minna datum. */
const CLARKE_1880: Ellipsoid = { a: 6378249.145, f: 1 / 293.465 };
/** Minna to WGS 84, EPSG:1167 (Nigeria onshore), metres. */
const MINNA_TO_WGS84 = { dx: -92, dy: -93, dz: 122 };

interface TransverseMercator {
  /** Longitude of the central meridian, degrees. */
  lon0: number;
  /** Latitude of origin, degrees. */
  lat0: number;
  k0: number;
  falseEasting: number;
  falseNorthing: number;
}

interface ProjectedCrs {
  code: CrsCode;
  label: string;
  datum: 'MINNA' | 'WGS84';
  projection: TransverseMercator;
}

const utm = (zone: number): TransverseMercator => ({
  lon0: zone * 6 - 183,
  lat0: 0,
  k0: 0.9996,
  falseEasting: 500000,
  falseNorthing: 0,
});

const PROJECTED: readonly ProjectedCrs[] = [
  { code: 'EPSG:26331', label: 'Minna / UTM zone 31N', datum: 'MINNA', projection: utm(31) },
  { code: 'EPSG:26332', label: 'Minna / UTM zone 32N', datum: 'MINNA', projection: utm(32) },
  {
    code: 'EPSG:26391',
    label: 'Minna / Nigeria West Belt',
    datum: 'MINNA',
    projection: { lon0: 4.5, lat0: 4, k0: 0.99975, falseEasting: 230738.26, falseNorthing: 0 },
  },
  {
    code: 'EPSG:26392',
    label: 'Minna / Nigeria Mid Belt',
    datum: 'MINNA',
    projection: { lon0: 8.5, lat0: 4, k0: 0.99975, falseEasting: 670553.98, falseNorthing: 0 },
  },
  {
    code: 'EPSG:26393',
    label: 'Minna / Nigeria East Belt',
    datum: 'MINNA',
    projection: { lon0: 12.5, lat0: 4, k0: 0.99975, falseEasting: 1110369.7, falseNorthing: 0 },
  },
  { code: 'EPSG:32631', label: 'WGS 84 / UTM zone 31N', datum: 'WGS84', projection: utm(31) },
  { code: 'EPSG:32632', label: 'WGS 84 / UTM zone 32N', datum: 'WGS84', projection: utm(32) },
];

/** Every system a boundary can be entered in, for forms and validation. */
export const SUPPORTED_CRS: readonly { code: CrsCode; label: string }[] = [
  { code: 'EPSG:4326', label: 'Latitude and longitude (WGS 84, GPS)' },
  ...PROJECTED.map(({ code, label }) => ({ code, label })),
];

export const isSupportedCrs = (code: unknown): code is CrsCode =>
  typeof code === 'string' && SUPPORTED_CRS.some((c) => c.code === code);

export const crsLabel = (code: CrsCode) =>
  SUPPORTED_CRS.find((c) => c.code === code)?.label ?? code;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Meridian arc length from the equator to latitude phi (radians), metres. */
function meridianArc(phi: number, { a, f }: Ellipsoid): number {
  const e2 = f * (2 - f);
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  return (
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi))
  );
}

/** Easting/northing to longitude/latitude on the projection's own ellipsoid (Snyder 8-12). */
function inverseTm(x: number, y: number, p: TransverseMercator, ell: Ellipsoid): [number, number] {
  const { a, f } = ell;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const m = meridianArc(rad(p.lat0), ell) + (y - p.falseNorthing) / p.k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sin = Math.sin(phi1);
  const cos = Math.cos(phi1);
  const tan = Math.tan(phi1);
  const c1 = ep2 * cos * cos;
  const t1 = tan * tan;
  const n1 = a / Math.sqrt(1 - e2 * sin * sin);
  const r1 = (a * (1 - e2)) / (1 - e2 * sin * sin) ** 1.5;
  const d = (x - p.falseEasting) / (n1 * p.k0);
  const lat =
    phi1 -
    ((n1 * tan) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) * d ** 6) / 720);
  const lon =
    rad(p.lon0) +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) * d ** 5) / 120) /
      cos;
  return [deg(lon), deg(lat)];
}

/** Longitude/latitude to easting/northing (Snyder 8-9, 8-10); the inverse of inverseTm. */
function forwardTm(
  lng: number,
  lat: number,
  p: TransverseMercator,
  ell: Ellipsoid
): [number, number] {
  const { a, f } = ell;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const phi = rad(lat);
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);
  const n = a / Math.sqrt(1 - e2 * sin * sin);
  const t = tan * tan;
  const c = ep2 * cos * cos;
  const A = rad(lng - p.lon0) * cos;
  const m = meridianArc(phi, ell);
  const m0 = meridianArc(rad(p.lat0), ell);
  const x =
    p.falseEasting +
    p.k0 *
      n *
      (A + ((1 - t + c) * A ** 3) / 6 + ((5 - 18 * t + t * t + 72 * c - 58 * ep2) * A ** 5) / 120);
  const y =
    p.falseNorthing +
    p.k0 *
      (m -
        m0 +
        n *
          tan *
          (A ** 2 / 2 +
            ((5 - t + 9 * c + 4 * c * c) * A ** 4) / 24 +
            ((61 - 58 * t + t * t + 600 * c - 330 * ep2) * A ** 6) / 720));
  return [x, y];
}

function toCartesian(lng: number, lat: number, { a, f }: Ellipsoid): [number, number, number] {
  const e2 = f * (2 - f);
  const phi = rad(lat);
  const lambda = rad(lng);
  const n = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  return [
    n * Math.cos(phi) * Math.cos(lambda),
    n * Math.cos(phi) * Math.sin(lambda),
    n * (1 - e2) * Math.sin(phi),
  ];
}

function fromCartesian(x: number, y: number, z: number, { a, f }: Ellipsoid): [number, number] {
  const e2 = f * (2 - f);
  const p = Math.hypot(x, y);
  let phi = Math.atan2(z, p * (1 - e2));
  for (let i = 0; i < 10; i++) {
    const n = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
    phi = Math.atan2(z + e2 * n * Math.sin(phi), p);
  }
  return [deg(Math.atan2(y, x)), deg(phi)];
}

/** Shift a point on the Minna datum (Clarke 1880) to WGS 84, or back with sign -1. */
function shiftMinna(lng: number, lat: number, sign: 1 | -1): [number, number] {
  const [from, to] = sign === 1 ? [CLARKE_1880, WGS84] : [WGS84, CLARKE_1880];
  const [x, y, z] = toCartesian(lng, lat, from);
  return fromCartesian(
    x + sign * MINNA_TO_WGS84.dx,
    y + sign * MINNA_TO_WGS84.dy,
    z + sign * MINNA_TO_WGS84.dz,
    to
  );
}

const projected = (code: CrsCode) => PROJECTED.find((c) => c.code === code);

/**
 * One coordinate pair in `crs` as WGS 84 [longitude, latitude]. Projected
 * systems take [easting, northing]; EPSG:4326 takes [longitude, latitude] and
 * is returned unchanged.
 */
export function toWgs84([x, y]: [number, number], crs: CrsCode): [number, number] {
  const def = projected(crs);
  if (!def) return [x, y];
  const ellipsoid = def.datum === 'MINNA' ? CLARKE_1880 : WGS84;
  const [lng, lat] = inverseTm(x, y, def.projection, ellipsoid);
  return def.datum === 'MINNA' ? shiftMinna(lng, lat, 1) : [lng, lat];
}

/** WGS 84 [longitude, latitude] into `crs`: for tests and for showing a plan's own numbers. */
export function fromWgs84([lng, lat]: [number, number], crs: CrsCode): [number, number] {
  const def = projected(crs);
  if (!def) return [lng, lat];
  const ellipsoid = def.datum === 'MINNA' ? CLARKE_1880 : WGS84;
  const [l, p] = def.datum === 'MINNA' ? shiftMinna(lng, lat, -1) : [lng, lat];
  return forwardTm(l, p, def.projection, ellipsoid);
}

/** Roughly Nigeria's extent, generous at the edges; the precise test lives in property-location. */
const inNigeriaBox = ([lng, lat]: [number, number]) =>
  lat >= 4 && lat <= 14 && lng >= 2.6 && lng <= 14.7;

export type CoordinateDiagnosis =
  | { kind: 'ok' }
  | { kind: 'swapped' }
  | { kind: 'projected'; candidates: CrsCode[] }
  | { kind: 'unknown' };

/**
 * Why corners that should be longitude/latitude are not plausible, so the
 * person entering them can be told how to fix it: numbers the size of
 * eastings and northings (a survey plan read as if it were GPS), or latitude
 * and longitude the wrong way round.
 */
export function diagnoseCoordinates(points: [number, number][]): CoordinateDiagnosis {
  if (points.length === 0) return { kind: 'unknown' };
  if (points.every(inNigeriaBox)) return { kind: 'ok' };
  if (points.every(([x, y]) => inNigeriaBox([y, x]))) return { kind: 'swapped' };
  const large = points.every(([x, y]) => Math.abs(x) > 1000 && Math.abs(y) > 1000);
  if (large) {
    const candidates = PROJECTED.filter(({ code }) =>
      points.every((p) => inNigeriaBox(toWgs84(p, code)))
    ).map(({ code }) => code);
    return { kind: 'projected', candidates };
  }
  return { kind: 'unknown' };
}

export type LandBoundarySignOffStatus = 'UNREVIEWED' | 'SIGNED_OFF' | 'REJECTED';
export type LandBoundarySource = 'OWNER_DRAWN' | 'SURVEY_COORDINATES' | 'STAFF';

export interface LandBoundarySignOff {
  status: LandBoundarySignOffStatus;
  by: string | null;
  at: string | null;
  note: string | null;
}

export interface LandBoundaryVersion {
  id: string;
  version: number;
  current: boolean;
  geometry: Record<string, unknown>;
  areaSqm: number;
  source: LandBoundarySource;
  coordinateSystem: { code: CrsCode; label: string };
  sourceCoordinates: [number, number][] | null;
  surveyNumber: string | null;
  createdAt: string;
  supersededAt: string | null;
  signOff: LandBoundarySignOff;
}

export interface LandBoundaryStatus {
  version: number;
  signOff: LandBoundarySignOff;
  coordinateSystem: { code: CrsCode; label: string };
  source: LandBoundarySource;
}

export const BOUNDARY_SOURCE_LABEL: Record<LandBoundarySource, string> = {
  OWNER_DRAWN: 'Drawn on the map',
  SURVEY_COORDINATES: 'From survey plan coordinates',
  STAFF: 'Set by GetRentos staff',
};

/** One line on what a surveyor said about an outline, for owners and buyers. */
export function boundarySignOffText(signOff: Pick<LandBoundarySignOff, 'status'>): string {
  switch (signOff.status) {
    case 'SIGNED_OFF':
      return 'Checked against the survey plan by a surveyor';
    case 'REJECTED':
      return 'A surveyor found a problem with this outline';
    default:
      return 'Not yet checked by a surveyor';
  }
}
