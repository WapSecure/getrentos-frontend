/**
 * A refusal's message, fit to show in the agency workspace.
 *
 * The API's role guard answers with the full list of account types that may
 * use an area. That list means nothing to a firm's staff, so it is replaced
 * with a plain sentence; every other message passes through unchanged.
 */
export const NO_ACCESS_MESSAGE =
  'Your account does not have access to this part of the agency workspace.';

export function describeAgencyError(error: unknown, fallback = 'Something went wrong.'): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!message) return fallback;
  if (/^This area is for .+ accounts\b/i.test(message)) return NO_ACCESS_MESSAGE;
  return message;
}
