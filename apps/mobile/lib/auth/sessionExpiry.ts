// Set only when a session ends involuntarily, so sign-in can explain why. Voluntary sign-out never sets it.
const DEFAULT_MESSAGE = 'Your session has expired. Please sign in again.';
let notice: { message: string; tone: 'info' | 'error' } | null = null;

export function markSessionExpired(reason?: { message: string; tone?: 'info' | 'error' }) {
  notice = { message: reason?.message ?? DEFAULT_MESSAGE, tone: reason?.tone ?? 'info' };
}

export function consumeSessionExpired(): { message: string; tone: 'info' | 'error' } | null {
  const v = notice;
  notice = null;
  return v;
}
