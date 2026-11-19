export const PROPERTY_VERIFIED_FIELDS_LOCKED = 'PROPERTY_VERIFIED_FIELDS_LOCKED';
export const LEGAL_NAME_LOCKED = 'LEGAL_NAME_LOCKED';

// Must match the backend's VERIFIED_PROPERTY_FIELDS; the API reports the property name as `title`.
export const VERIFIED_PROPERTY_FIELDS = [
  'title',
  'address',
  'city',
  'state',
  'country',
  'latitude',
  'longitude',
] as const;
export type VerifiedPropertyField = (typeof VERIFIED_PROPERTY_FIELDS)[number];

// Must match the backend's VERIFIED_PARCEL_FIELDS.
export const VERIFIED_PARCEL_FIELDS = [
  'plotNumber',
  'block',
  'areaValue',
  'areaUnit',
  'boundaryGeometry',
  'titleType',
  'titleNumber',
  'surveyNumber',
  'registryAuthority',
  'tenure',
] as const;
export type VerifiedParcelField = (typeof VERIFIED_PARCEL_FIELDS)[number];

const LOCKED_FIELD_LABELS: Record<string, string> = {
  title: 'property name',
  name: 'property name',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  latitude: 'map pin',
  longitude: 'map pin',
  plotNumber: 'plot number',
  block: 'block or phase',
  areaValue: 'land area',
  areaUnit: 'area unit',
  boundaryGeometry: 'plot outline',
  titleType: 'title type',
  titleNumber: 'title or file number',
  surveyNumber: 'survey number',
  registryAuthority: 'registry authority',
  tenure: 'tenure',
};

export const PROPERTY_CHANGE_REQUEST_WARNING =
  'Your property loses its verified status until we check the new details again. Listings that need a verified property pause until then.';

export const LEGAL_NAME_LOCKED_NOTE =
  'Locked because your identity is verified. Verify again to change it.';

function errorBody(err: unknown): Record<string, unknown> {
  const details = (err as { details?: unknown } | null)?.details;
  return details && typeof details === 'object' ? (details as Record<string, unknown>) : {};
}

function errorCode(err: unknown): string | undefined {
  const body = errorBody(err);
  const code = body.code ?? body.error ?? (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** The fields a 409 PROPERTY_VERIFIED_FIELDS_LOCKED names, or null for any other error. */
export function lockedVerifiedFields(err: unknown): string[] | null {
  if ((err as { status?: number } | null)?.status !== 409) return null;
  if (errorCode(err) !== PROPERTY_VERIFIED_FIELDS_LOCKED) return null;
  const fields = errorBody(err).fields;
  return Array.isArray(fields) ? fields.filter((f): f is string => typeof f === 'string') : [];
}

export function isLegalNameLockedError(err: unknown): boolean {
  return (
    (err as { status?: number } | null)?.status === 409 && errorCode(err) === LEGAL_NAME_LOCKED
  );
}

/** "property name, address and map pin" */
export function describeLockedFields(fields: readonly string[]): string {
  const labels = [...new Set(fields.map((field) => LOCKED_FIELD_LABELS[field] ?? field))];
  if (labels.length === 0) return 'verified details';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/** Same rule as the backend: either flag counts. Accepts the raw enum or the apps' lower-case forms. */
export function isVerifiedPropertyStatus(
  verificationStatus: string | null | undefined,
  isVerified?: boolean | null
): boolean {
  if (isVerified) return true;
  const status = (verificationStatus ?? '').toUpperCase();
  return status === 'APPROVED' || status === 'VERIFIED';
}

export interface LegalNameLockSource {
  legalNameLocked?: boolean;
  identityVerified?: boolean;
  identity?: { status?: string } | null;
}

/** From GET /users/me/kyc. Older APIs lack legalNameLocked, so the 409 still has to be handled. */
export function isLegalNameLockedByKyc(kyc: LegalNameLockSource | null | undefined): boolean {
  if (!kyc) return false;
  if (kyc.legalNameLocked) return true;
  return Boolean(kyc.identityVerified) || kyc.identity?.status?.toUpperCase() === 'APPROVED';
}

export interface PropertyChangeRequestBody {
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

export interface VerifiedPropertyDetails {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const COORDINATE_EPSILON = 1e-7;

function sameText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').trim() === (b ?? '').trim();
}

/** Only the verified details that differ, shaped for POST .../change-requests. */
export function verifiedPropertyChanges(
  current: VerifiedPropertyDetails,
  next: VerifiedPropertyDetails
): PropertyChangeRequestBody {
  const body: PropertyChangeRequestBody = {};
  if (next.name != null && !sameText(current.name, next.name)) body.title = next.name.trim();
  for (const key of ['address', 'city', 'state', 'country'] as const) {
    const value = next[key];
    if (value != null && !sameText(current[key], value)) body[key] = value.trim();
  }
  const moved =
    next.latitude != null &&
    next.longitude != null &&
    (current.latitude == null ||
      current.longitude == null ||
      Math.abs(current.latitude - next.latitude) >= COORDINATE_EPSILON ||
      Math.abs(current.longitude - next.longitude) >= COORDINATE_EPSILON);
  if (moved) {
    body.latitude = next.latitude!;
    body.longitude = next.longitude!;
  }
  const addressChanged = body.address || body.city || body.state || body.country;
  if (addressChanged && next.placeId && next.placeId !== current.placeId) {
    body.placeId = next.placeId;
  }
  return body;
}

export function hasVerifiedPropertyChanges(body: PropertyChangeRequestBody): boolean {
  return (Object.keys(body) as (keyof PropertyChangeRequestBody)[]).some(
    (key) => key !== 'reason' && body[key] !== undefined
  );
}
