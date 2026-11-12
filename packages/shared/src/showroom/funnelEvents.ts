/**
 * Funnel and site-health events, sent through the same anonymous transport as the showroom events.
 * Must match the backend allow-list on POST /analytics/events; until it does, the API drops these
 * events one by one and keeps the rest of the batch.
 */
export const FUNNEL_EVENT_NAMES = [
  'session_start',
  'search_submit',
  'signup_start',
  'signup_complete',
  'inquiry_submitted',
  'inspection_request_submitted',
  'application_submitted',
  'offer_submitted',
  'booking_submitted',
  'pro_checkout_start',
  'payment_started',
  'web_vital',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

/** Which filters a search used, never their values: no typed text, no prices. */
export const SEARCH_FILTER_KEYS = [
  'query',
  'area',
  'city',
  'state',
  'estate',
  'min_price',
  'max_price',
  'bedrooms',
  'bathrooms',
  'property_type',
  'verified',
  'furnished',
  'pets',
  'monthly',
  'sort',
  'title_type',
  'min_size',
  'assurance',
  'road',
  'guests',
  'check_in',
  'check_out',
  'instant_book',
  'power',
  'amenities',
] as const;

export type SearchFilterKey = (typeof SEARCH_FILTER_KEYS)[number];

export type SignupEventRole =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate';

export type SignupEventMethod = 'email' | 'phone' | 'whatsapp' | 'google' | 'apple' | 'magic_link';

export type PaymentEventKind = 'rent' | 'deposit' | 'booking' | 'other';

export type WebVitalMetric = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';

export interface FunnelEventProps {
  /** Comma-separated `SearchFilterKey`s, sorted, no repeats. */
  filters?: string;
  filterCount?: number;
  role?: SignupEventRole;
  method?: SignupEventMethod;
  plan?: 'pro';
  interval?: 'monthly' | 'annual';
  kind?: PaymentEventKind;
  metric?: WebVitalMetric;
  /** Milliseconds; CLS in thousandths. Always a whole number. */
  value?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  /** The route pattern (`/rent/[id]`), never the address bar. */
  path?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** Host only, e.g. `google.com`. */
  referrerHost?: string;
}

const isFilterKey = (key: string): key is SearchFilterKey =>
  (SEARCH_FILTER_KEYS as readonly string[]).includes(key);

/** Props for `search_submit` from the filter keys in use; unknown keys are left out. */
export function searchFilterProps(
  keys: Iterable<string>
): Pick<FunnelEventProps, 'filters' | 'filterCount'> {
  const used = [...new Set([...keys].filter(isFilterKey))].sort();
  return used.length ? { filters: used.join(','), filterCount: used.length } : { filterCount: 0 };
}

/** Lowercase, safe characters only, capped: a campaign tag, never free text. Null when nothing usable is left. */
export function coarseUtmValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Capped before any pattern runs, so a crafted link cannot make the clean-up slow.
  const parts = raw
    .slice(0, 200)
    .toLowerCase()
    .split(/[^a-z0-9._-]/);
  const value = parts.filter(Boolean).join('_').slice(0, 60);
  // Something that looks like a phone or account number is dropped, not trimmed.
  return value && !/\d{7,}/.test(value) ? value : null;
}

/** The referrer's host without `www.`, or null when it is missing, malformed or this site. */
export function referrerHostOf(referrer: string, ownHost: string): string | null {
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host === ownHost.toLowerCase().replace(/^www\./, '')) return null;
    return /^(?=.{3,100}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
  } catch {
    return null;
  }
}
