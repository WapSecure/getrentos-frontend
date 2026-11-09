import { ApiError } from '@/lib/api/client';

export const WATCHLIST_BLOCKED = 'WATCHLIST_BLOCKED';

export type WatchlistSeverity = 'BLOCK' | 'WATCH';

export type WatchlistMatchedOn = 'NAME' | 'PHONE' | 'PLATE';

export interface WatchlistMatch {
  entryId: string;
  label: string;
  subjectType: 'PERSON' | 'VEHICLE';
  severity: WatchlistSeverity;
  reason: string;
  matchedOn: WatchlistMatchedOn;
  blocked: boolean;
  message: string;
}

export interface WatchlistRefusal {
  message: string;
  /** Empty when the API withholds the estate's reason (a pass being issued). */
  matches: WatchlistMatch[];
}

// A refusal with no matches is still a refusal: falling through would toast a generic failure.
// Kept parallel with apps/web/lib/gateman/watchlistRefusal.ts.
export function readWatchlistRefusal(error: unknown): WatchlistRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== WATCHLIST_BLOCKED) return null;

  const body = (error.details ?? {}) as { message?: unknown; matches?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
    matches: Array.isArray(body.matches) ? (body.matches as WatchlistMatch[]) : [],
  };
}

// Must match the API's minimum.
export const OVERRIDE_REASON_MIN_LENGTH = 10;

export interface WatchlistScreening {
  flagged: boolean;
  blocked: boolean;
  matches: WatchlistMatch[];
  message?: string;
}
