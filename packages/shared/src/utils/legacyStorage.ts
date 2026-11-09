/**
 * GetRentos became Sureground. Browser storage written before the rename uses
 * keys that start with "getrentos" (getrentos.sidebar.rail, getrentos_user,
 * getrentos:signup:next, …). Move each one to its "sureground" key once, so
 * nobody is signed out or loses a preference. A value already saved under the
 * new key wins. Safe to call more than once; does nothing on the server.
 */
const LEGACY_PREFIX = 'getrentos';
const NEW_PREFIX = 'sureground';

interface KeyValueStore {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// Typed structurally so this compiles in packages without the DOM library.
const browser = globalThis as unknown as {
  localStorage?: KeyValueStore;
  sessionStorage?: KeyValueStore;
  document?: { cookie: string };
};

export function migrateLegacyBrowserStorage(): void {
  if (!browser.document) return;
  for (const store of [browser.localStorage, browser.sessionStorage]) {
    try {
      if (!store) continue;
      const legacy: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key?.startsWith(LEGACY_PREFIX)) legacy.push(key);
      }
      for (const key of legacy) {
        const next = NEW_PREFIX + key.slice(LEGACY_PREFIX.length);
        const value = store.getItem(key);
        if (value !== null && store.getItem(next) === null) store.setItem(next, value);
        store.removeItem(key);
      }
    } catch {
      // Storage blocked (private mode, policy): nothing to carry over.
    }
  }
  try {
    const doc = browser.document;
    const cookie = doc.cookie.split('; ').find((c) => c.startsWith(`${LEGACY_PREFIX}_language=`));
    if (cookie && !doc.cookie.includes(`${NEW_PREFIX}_language=`)) {
      const value = cookie.split('=')[1];
      doc.cookie = `${NEW_PREFIX}_language=${value}; path=/; max-age=31536000; samesite=lax`;
      doc.cookie = `${LEGACY_PREFIX}_language=; path=/; max-age=0; samesite=lax`;
    }
  } catch {
    // Cookies unavailable: the language falls back to the default.
  }
}
