// The role guard's refusal lists account types, which mean nothing to firm staff, so it is replaced; other messages pass through.
export const NO_ACCESS_MESSAGE =
  'Your account does not have access to this part of the agency workspace.';

export function describeAgencyError(error: unknown, fallback = 'Something went wrong.'): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!message) return fallback;
  if (/^This area is for .+ accounts\b/i.test(message)) return NO_ACCESS_MESSAGE;
  return message;
}
