/**
 * Addresses checked against Google Places, shared by web and mobile.
 *
 * A form keeps an `AddressValue`: the place the person picked (with its
 * checked details), or, when Google has no match and the form allows it, an
 * address they typed themselves, which the app marks as unchecked. The API
 * looks the place up again on save, so only `placeId` really matters there.
 */

/** What a search looks for: a full address, an area (neighbourhood, town, LGA), or either. */
export type PlaceKind = 'address' | 'area' | 'any';

export interface PlaceSuggestion {
  placeId: string;
  /** "12 Admiralty Way" */
  primary: string;
  /** "Lekki, Lagos" */
  secondary: string;
  /** Ranges of `primary` that match what was typed. */
  matches: [number, number][];
  types: string[];
}

/** GET /geo/places/:placeId — the address as Google knows it, in the app's terms. */
export interface VerifiedAddress {
  placeId: string;
  formatted: string;
  line1: string;
  area: string | null;
  city: string;
  lga: string | null;
  /** As the app names states: "Lagos", "FCT (Abuja)". */
  state: string;
  postcode: string | null;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  precision: 'premise' | 'street' | 'area' | 'city';
  source: 'google';
}

export interface AddressValue {
  /** Set for a picked place. */
  placeId?: string;
  /** The line shown in the field. */
  text: string;
  /** The checked details of a picked place; absent for a typed address. */
  verified?: VerifiedAddress;
}

/** A new id for one search, from first key press to the pick; Google bills the pair as one session. */
export function newPlacesSession(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC 4122 v4 from Math.random, for runtimes without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** The street line and area, as stored in an address column: "12 Admiralty Way, Lekki Phase I". */
export function addressLine(v: Pick<VerifiedAddress, 'line1' | 'area'>): string {
  return v.area && !v.line1.includes(v.area) ? `${v.line1}, ${v.area}` : v.line1;
}

/** A picked place as a form value. */
export function addressValueFrom(v: VerifiedAddress, text = v.formatted): AddressValue {
  return { placeId: v.placeId, text, verified: v };
}

/** A stored address as a form value: checked when it carries a place id, typed otherwise. */
export function storedAddressValue(
  text: string | null | undefined,
  placeId?: string | null
): AddressValue | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  return placeId ? { placeId, text: t } : { text: t };
}

/** Split `text` into plain and matched parts for bold highlighting. */
export function highlightParts(
  text: string,
  matches: [number, number][]
): { text: string; match: boolean }[] {
  const ranges = [...matches]
    .map(([s, e]) => [Math.max(0, s), Math.min(text.length, e)] as [number, number])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const out: { text: string; match: boolean }[] = [];
  let at = 0;
  for (const [s, e] of ranges) {
    if (s < at) continue;
    if (s > at) out.push({ text: text.slice(at, s), match: false });
    out.push({ text: text.slice(s, e), match: true });
    at = e;
  }
  if (at < text.length) out.push({ text: text.slice(at), match: false });
  return out.length ? out : [{ text, match: false }];
}

/** How sure the address is, in words for a badge. */
export function addressPrecisionLabel(p: VerifiedAddress['precision']): string {
  return p === 'premise'
    ? 'Exact address'
    : p === 'street'
      ? 'Street found'
      : p === 'area'
        ? 'Area'
        : 'City';
}
