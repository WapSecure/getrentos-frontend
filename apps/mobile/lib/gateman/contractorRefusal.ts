import { ApiError } from '@/lib/api/client';

/**
 * The code the API uses when a standing authorisation says no.
 *
 * One code covers every way it can say no: withdrawn by the office, run past its
 * end date, or outside the days and hours the estate agreed — a caller cannot
 * act on the difference, so the API sends one code and the reason in `message`.
 *
 * Kept as a named constant because the offline queue recognises it by name. A
 * 403 it does not recognise reads as a lapsed session, and the queue replays
 * those forever. The mobile counterpart of
 * `apps/web/lib/gateman/contractorRefusal.ts`, kept parallel on purpose so a
 * guard gets the same answer on either device.
 */
export const CONTRACTOR_NOT_PERMITTED = 'CONTRACTOR_NOT_PERMITTED';

export interface ContractorRefusal {
  /** The API's own wording. It names the rule that stopped them. */
  message: string;
}

/**
 * Reads a contractor refusal out of a failed gate write, or null when the
 * failure was something else.
 *
 * Nothing but the message, deliberately: unlike a watch list entry there is no
 * list of "who it was" to show, because the guard is looking at the person. What
 * they need is which rule applied.
 */
export function readContractorRefusal(error: unknown): ContractorRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== CONTRACTOR_NOT_PERMITTED) return null;

  const body = (error.details ?? {}) as { message?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
  };
}
