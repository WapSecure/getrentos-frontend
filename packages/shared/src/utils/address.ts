// The API looks the place up again on save, so only `placeId` really matters there.

export type PlaceKind = 'address' | 'area' | 'any';

export interface PlaceSuggestion {
  placeId: string;
  primary: string;
  secondary: string;
  matches: [number, number][];
  types: string[];
}

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
  placeId?: string;
  text: string;
  verified?: VerifiedAddress;
}

// Google bills a search and its pick as one session, so one id spans first key press to the pick.
export function newPlacesSession(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC 4122 v4 from Math.random, for runtimes without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// The format stored in an address column: "12 Admiralty Way, Lekki Phase I".
export function addressLine(v: Pick<VerifiedAddress, 'line1' | 'area'>): string {
  return v.area && !v.line1.includes(v.area) ? `${v.line1}, ${v.area}` : v.line1;
}

export function addressValueFrom(v: VerifiedAddress, text = v.formatted): AddressValue {
  return { placeId: v.placeId, text, verified: v };
}

export function storedAddressValue(
  text: string | null | undefined,
  placeId?: string | null
): AddressValue | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  return placeId ? { placeId, text: t } : { text: t };
}

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

export function addressPrecisionLabel(p: VerifiedAddress['precision']): string {
  return p === 'premise'
    ? 'Exact address'
    : p === 'street'
      ? 'Street found'
      : p === 'area'
        ? 'Area'
        : 'City';
}

/** "Lagos, Lagos" → "Lagos": seed and imported listings often repeat the city as the state. */
export function tidyPlace(place: string): string {
  const parts = place
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts
    .filter((p, i) => i === 0 || p.toLowerCase() !== parts[i - 1]!.toLowerCase())
    .join(', ');
}
