import { ApiError } from '@/lib/api/client';

/** The code the API uses for "an estate has asked that this person is not admitted". */
export const WATCHLIST_BLOCKED = 'WATCHLIST_BLOCKED';

/** `BLOCK` refuses entry; `WATCH` admits them but tells the estate office. */
export type WatchlistSeverity = 'BLOCK' | 'WATCH';

/**
 * Which detail the match was found on.
 *
 * Not cosmetic: a plate or a phone number is an identifier, while a name is a
 * coincidence waiting to happen, and a guard looking at a real person is
 * entitled to know which one they are looking at before deciding.
 */
export type WatchlistMatchedOn = 'NAME' | 'PHONE' | 'PLATE';

/** One entry an attempt to enter matched. */
export interface WatchlistMatch {
  entryId: string;
  label: string;
  subjectType: 'PERSON' | 'VEHICLE';
  severity: WatchlistSeverity;
  reason: string;
  matchedOn: WatchlistMatchedOn;
  /** True when this match should refuse the entry, false when it only warns. */
  blocked: boolean;
  /** Written server-side and shown verbatim — see `WatchlistBlockedSheet`. */
  message: string;
}

export interface WatchlistRefusal {
  /** The API's own wording, written for whoever is reading it. */
  message: string;
  /**
   * The entries that fired, with the estate's own reason.
   *
   * Empty when the API decided the caller should not see the estate's reason,
   * which happens when a pass is being *issued* rather than an entry attempted.
   */
  matches: WatchlistMatch[];
}

/**
 * Reads a watchlist refusal out of a failed gate write, or null when the failure
 * was something else.
 *
 * `ApiError.details` is `unknown`, so without this every call site would carry
 * the same cast. The mobile counterpart of `apps/web/lib/gateman/watchlistRefusal.ts`,
 * kept parallel on purpose so a guard gets the same answer on either device.
 *
 * A refusal with no matches is still a refusal. It is returned rather than
 * discarded, because a caller that treated it as "not a watchlist problem" would
 * fall through to the generic failure path and toast something that reads like
 * the app broke — for a decision an estate made on purpose.
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

/** Matches the API's floor, so the form never allows something the server will reject. */
export const OVERRIDE_REASON_MIN_LENGTH = 10;

/**
 * The answer to "is this person on the list?", asked before anything is
 * attempted.
 *
 * Everything here is released to the estate's own gate staff, including the
 * reason an entry gives. The reason is withheld only when a pass is being
 * *issued*, because that is often done by whoever the visitor asked.
 */
export interface WatchlistScreening {
  flagged: boolean;
  blocked: boolean;
  matches: WatchlistMatch[];
  /**
   * The refusal in words, when there is one to give.
   *
   * Undefined when nothing blocked — "nothing found" is better said plainly by
   * the caller than by a sentence that has to hedge about what it did not cover.
   */
  message?: string;
}
