import { ApiError } from '@/lib/apiHelpers';

/**
 * The code the API uses when a standing authorisation says no.
 *
 * One code covers every way it can say no: withdrawn by the office, run past its
 * end date, or outside the days and hours the estate agreed. A caller cannot act
 * on the difference — all three mean the barrier stays shut and somebody has to
 * be told why — so the API sends one code for the class and the reason in
 * `message`.
 *
 * It exists as a named constant because the offline queue has to recognise it by
 * name. A 403 it does not recognise reads as a lapsed session.
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
 * There is nothing here but the message, and that is the point: unlike a watch
 * list entry there is no list of "who it was" to show, because the guard is
 * looking at the person. What they need is which rule applied, and the API
 * writes that sentence — "They are authorised for Monday, and today is Friday."
 */
export function readContractorRefusal(error: unknown): ContractorRefusal | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== CONTRACTOR_NOT_PERMITTED) return null;

  const body = (error.details ?? {}) as { message?: unknown };
  return {
    message: typeof body.message === 'string' && body.message ? body.message : error.message,
  };
}
