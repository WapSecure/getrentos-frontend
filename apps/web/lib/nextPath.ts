/**
 * Where to send someone after they sign in or sign up, when a page asked them
 * to come back (`?next=`). Only a path on this site is accepted: it must start
 * with a single "/" (not "//" or "/\", which browsers read as another host).
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

/** Appends `next` to an auth page's URL, when there is a safe one to carry. */
export function withNext(
  path: string,
  next: string | null | undefined,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams(extra);
  const safe = safeNextPath(next);
  if (safe) params.set('next', safe);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** The current page, as a `next` value. */
export function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

// Sign-up spans several pages (details, code, roles), so the return path is
// kept for the tab while it runs.
const SIGNUP_NEXT_KEY = 'getrentos:signup:next';

export function rememberSignupNext(next: string | null | undefined) {
  if (typeof window === 'undefined') return;
  try {
    const safe = safeNextPath(next);
    if (safe) window.sessionStorage.setItem(SIGNUP_NEXT_KEY, safe);
    else window.sessionStorage.removeItem(SIGNUP_NEXT_KEY);
  } catch {
    // Storage unavailable: sign-up still ends on the dashboard.
  }
}

export function takeSignupNext(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(SIGNUP_NEXT_KEY);
    window.sessionStorage.removeItem(SIGNUP_NEXT_KEY);
    return safeNextPath(value);
  } catch {
    return null;
  }
}
