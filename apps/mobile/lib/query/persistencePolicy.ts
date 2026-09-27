const SENSITIVE_CACHE_TERMS = [
  'auth',
  'profile',
  'message',
  'conversation',
  'document',
  'payment',
  'receipt',
  'lease',
  'kyc',
  'identity',
  'security',
  'visitor',
] as const;

/** Only non-sensitive successful queries may be written to unencrypted AsyncStorage. */
export function shouldPersistQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
  meta?: Record<string, unknown> | null;
}) {
  if (query.state.status !== 'success' || query.meta?.persist === false) return false;
  const key = JSON.stringify(query.queryKey).toLowerCase();
  return !SENSITIVE_CACHE_TERMS.some((term) => key.includes(term));
}
