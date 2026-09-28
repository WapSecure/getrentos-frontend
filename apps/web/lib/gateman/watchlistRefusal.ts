import { ApiError } from '@/lib/apiHelpers';
import type { WatchlistMatch } from '@/types/estate';

/** The code the API uses for "an estate has asked that this person is not admitted". */
export const WATCHLIST_BLOCKED = 'WATCHLIST_BLOCKED';

export interface WatchlistRefusal {
  /** The API's own wording, written for whoever is reading it. */
  message: string;
  /**
   * The entries that fired, with the estate's own reason.
   *
   * Empty when the API decided the caller should not see the estate's reason —
   * which happens when a pass is being *issued* rather than an entry being
   * attempted, because issuing is done by whoever the visitor asked, often a
   * neighbour, and "banned, they harassed Flat 4" is not theirs to read.
   */
  matches: WatchlistMatch[];
}

/**
 * Reads a watchlist refusal out of a failed gate write, or null when the failure
 * was something else.
 *
 * `ApiError.details` is `unknown`, so without this every call site would carry
 * the same cast — and there are four of them. One place, and one place to change
 * if the error envelope does.
 *
 * A refusal with no matches is still a refusal. It is returned rather than
 * discarded, because a caller that treated it as "not a watchlist problem" would
 * fall through to the generic failure path and show a guard something that reads
 * like the app broke — for a decision an estate made on purpose.
 */
export function readWatchlistRefusal(error: unknown): WatchlistRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== WATCHLIST_BLOCKED) return null;

  const body = (error.details ?? {}) as { message?: unknown; matches?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
    matches: Array.isArray(body.matches) ? (body.matches as WatchlistMatch[]) : [],
  };
}
