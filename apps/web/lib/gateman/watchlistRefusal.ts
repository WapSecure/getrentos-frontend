import { ApiError } from '@/lib/apiHelpers';
import type { WatchlistMatch } from '@/types/estate';

export const WATCHLIST_BLOCKED = 'WATCHLIST_BLOCKED';

export interface WatchlistRefusal {
  message: string;
  /** Empty when a pass is being issued: whoever issues it (often a neighbour) may not read the estate's reason. */
  matches: WatchlistMatch[];
}

// A refusal with no matches is still returned, so callers never show an estate's deliberate decision as an app failure.
export function readWatchlistRefusal(error: unknown): WatchlistRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== WATCHLIST_BLOCKED) return null;

  const body = (error.details ?? {}) as { message?: unknown; matches?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
    matches: Array.isArray(body.matches) ? (body.matches as WatchlistMatch[]) : [],
  };
}
