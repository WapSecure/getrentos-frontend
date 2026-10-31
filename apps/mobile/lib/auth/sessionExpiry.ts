/**
 * One-shot notice set when a session ends involuntarily (refresh failed, or the
 * account was suspended), so the sign-in screen can explain *why* the user
 * landed back there. Voluntary sign-out never sets it.
 */
const DEFAULT_MESSAGE = 'Your session has expired. Please sign in again.';
let notice: { message: string; tone: 'info' | 'error' } | null = null;

export function markSessionExpired(reason?: { message: string; tone?: 'info' | 'error' }) {
  notice = { message: reason?.message ?? DEFAULT_MESSAGE, tone: reason?.tone ?? 'info' };
}

/** Reads and clears the notice. */
export function consumeSessionExpired(): { message: string; tone: 'info' | 'error' } | null {
  const v = notice;
  notice = null;
  return v;
}
