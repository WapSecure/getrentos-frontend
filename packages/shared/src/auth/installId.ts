const KEY = 'sureground.installId';

// Lets the API notice many sign-ups from one device; identifies the install, not the person.
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

// Sent on every request so the API can tell a new device from a known one at sign-in.
export function installIdHeader(): Record<string, string> {
  const id = getInstallId();
  return id ? { 'x-device-id': id } : {};
}
