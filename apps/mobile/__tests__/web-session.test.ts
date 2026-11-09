import {
  authFetch,
  clearAuthSession,
  ensureValidSession,
  getAuthToken,
  getStoredUser,
  isAuthenticated,
  saveAuthSession,
  setAuthToken,
  STORAGE_KEYS,
} from '@getrentos/shared';

/**
 * The shared web client keeps the access token in memory only (security gap
 * AU-16). Web Storage holds the profile, never a token; a reload gets a new
 * token from the refresh cookie, and a refresh refused because another tab
 * rotated the cookie first is retried once instead of signing the user out.
 */
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** An unsigned JWT for user `sub`; the client only reads its payload. */
const jwt = (sub: string) =>
  `h.${btoa(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 900 }))}.s`;

const memoryStorage = () => {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
};

const local = memoryStorage();
const session = memoryStorage();
const everything = () => [...local.store.values(), ...session.store.values()].join('\n');

/** Simulates a page load: memory is gone, storage stays. */
const reload = () => setAuthToken(null);

describe('web session (access token in memory only)', () => {
  beforeAll(() => {
    Object.assign(globalThis, { window: globalThis, localStorage: local, sessionStorage: session });
  });

  beforeEach(() => {
    clearAuthSession();
    local.clear();
    session.clear();
  });

  it('keeps the token out of storage, and the profile free of it', () => {
    const token = jwt('u1');
    saveAuthSession({ accessToken: token, user: { id: 'u1', accessToken: token } }, true);

    expect(getAuthToken()).toBe(token);
    expect(everything()).not.toContain(token);
    expect(local.store.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(getStoredUser<{ id: string }>()).toEqual({ id: 'u1' });

    clearAuthSession();
    expect(getAuthToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('restores the token after a reload with a single refresh, keeping remember-me', async () => {
    saveAuthSession({ accessToken: jwt('u1'), user: { id: 'u1' } }, true);
    reload();
    expect(isAuthenticated()).toBe(true);

    const fresh = jwt('u1');
    const fetchMock = jest.fn(async () => reply(200, { accessToken: fresh }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    // A layout and a component asking at once share one refresh.
    await expect(Promise.all([ensureValidSession(), ensureValidSession()])).resolves.toEqual([
      true,
      true,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe(fresh);
    expect(local.store.has(STORAGE_KEYS.USER)).toBe(true);
    expect(everything()).not.toContain(fresh);
  });

  it('retries a refresh refused because another tab rotated the cookie first', async () => {
    saveAuthSession({ accessToken: jwt('u1'), user: { id: 'u1' } }, false);
    reload();

    const fresh = jwt('u1');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(reply(401, { message: 'Invalid or expired refresh token' }))
      .mockResolvedValueOnce(reply(200, { accessToken: fresh }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(ensureValidSession()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAuthToken()).toBe(fresh);
    expect(session.store.has(STORAGE_KEYS.USER)).toBe(true);
  });

  it('signs out when the retry is refused too', async () => {
    saveAuthSession({ accessToken: jwt('u1'), user: { id: 'u1' } }, true);
    reload();
    globalThis.fetch = jest.fn(async () => reply(401, {})) as unknown as typeof fetch;

    await expect(ensureValidSession()).resolves.toBe(false);
    expect(isAuthenticated()).toBe(false);
  });

  it('authFetch restores the token before its first request after a reload', async () => {
    saveAuthSession({ accessToken: jwt('u1'), user: { id: 'u1' } }, true);
    reload();

    const fresh = jwt('u1');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(reply(200, { accessToken: fresh }))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(authFetch('/landlord/properties')).resolves.toEqual({ ok: true });
    const [refreshUrl] = fetchMock.mock.calls[0] as [string];
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(refreshUrl).toMatch(/\/auth\/refresh$/);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${fresh}`);
  });

  // Last: a 429 pauses refreshing for the rest of this module's life.
  it('keeps the session when refreshing is rate limited, and backs off', async () => {
    saveAuthSession({ accessToken: jwt('u1'), user: { id: 'u1' } }, true);
    reload();
    const fetchMock = jest.fn(async () => reply(429, { message: 'Too many requests' }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(ensureValidSession()).resolves.toBe(false);
    expect(isAuthenticated()).toBe(true);
    await expect(ensureValidSession()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
