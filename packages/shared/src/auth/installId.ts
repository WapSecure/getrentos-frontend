const KEY = 'getrentos.installId';

/**
 * A random id this browser keeps for itself, sent with sign-ups so the API
 * can notice many new accounts coming from one device. It identifies the
 * install, not the person, and carries nothing about them. Undefined when
 * storage isn't available (server render, private mode).
 */
export function getInstallId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') return undefined;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return undefined;
  }
}
