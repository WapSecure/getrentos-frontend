// Only a path on this site: a single leading "/", since browsers read "//" or "/\" as another host.
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

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

export function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

// Sign-up spans several pages, so the return path is kept for the tab while it runs.
const SIGNUP_NEXT_KEY = 'sureground:signup:next';

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
