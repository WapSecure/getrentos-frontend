import {
  authFetch,
  clearStepUpToken,
  currentStepUpToken,
  onStaffMfaRequired,
  registerStepUpHandler,
  rememberStepUpToken,
} from '@getrentos/shared';

/**
 * The shared authFetch the back office uses: a STAFF_MFA_REQUIRED refusal must
 * drop the cached (enrolment-only) step-up token and tell the app, so it can
 * show the two-factor set-up screen.
 */
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('staff two-factor refusal', () => {
  beforeAll(() => {
    // The shared web client reads its session from browser storage.
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    };
    Object.assign(globalThis, { localStorage: storage, sessionStorage: storage });
  });

  beforeEach(() => {
    clearStepUpToken();
    registerStepUpHandler(null);
  });

  it('clears the step-up token and notifies listeners', async () => {
    globalThis.fetch = jest.fn(async () =>
      reply(403, { message: 'Turn on two-factor', error: 'STAFF_MFA_REQUIRED' })
    ) as unknown as typeof fetch;
    rememberStepUpToken('enrol-only', 300);
    const listener = jest.fn();
    const stop = onStaffMfaRequired(listener);

    await expect(authFetch('/admin/users')).rejects.toMatchObject({
      code: 'STAFF_MFA_REQUIRED',
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(currentStepUpToken()).toBeNull();
    stop();
  });

  it('leaves other refusals alone', async () => {
    globalThis.fetch = jest.fn(async () =>
      reply(403, { message: 'No', error: 'Forbidden' })
    ) as unknown as typeof fetch;
    rememberStepUpToken('full', 300);
    const listener = jest.fn();
    const stop = onStaffMfaRequired(listener);

    await expect(authFetch('/admin/users')).rejects.toMatchObject({ code: 'Forbidden' });
    expect(listener).not.toHaveBeenCalled();
    expect(currentStepUpToken()).toBe('full');
    stop();
  });
});
