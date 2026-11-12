import type { FraudAlertMediaReuse } from '@/types/admin';

const MEDIA_REUSE_PREFIX = 'Reused media detected on upload';
export const MEDIA_REUSE_GENERIC = 'Photo reused from another listing';

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3000';

/** The API sends `summary`; an older API sends only the machine reason, which must never reach staff as-is. */
export function fraudAlertSummary(alert: { summary?: string | null; reason: string }): string {
  if (alert.summary) return alert.summary;
  return alert.reason.startsWith(MEDIA_REUSE_PREFIX) ? MEDIA_REUSE_GENERIC : alert.reason;
}

/** Activity rows from an older API embed the raw reason ("… (1 match(es); closest=…) — Name"). */
export function readableActivityDescription(type: string, description: string): string {
  if (type !== 'fraud' || !description.startsWith(MEDIA_REUSE_PREFIX)) return description;
  const subject = description.match(/\s—\s([^—]+)$/)?.[1];
  return subject ? `${MEDIA_REUSE_GENERIC} — ${subject}` : MEDIA_REUSE_GENERIC;
}

/** Only published rent and sale listings have a public page to open. */
export function matchedListingUrl(listing: FraudAlertMediaReuse['matchedListing']): string | null {
  if (!listing || listing.status !== 'PUBLISHED') return null;
  if (listing.type === 'RENT') return `${WEB_APP_URL}/rent/${encodeURIComponent(listing.id)}`;
  if (listing.type === 'SALE') return `${WEB_APP_URL}/buy/${encodeURIComponent(listing.id)}`;
  return null;
}

export const isStorageKey = (value: string) => value.includes('/');
