/**
 * "Confirm it's you" for sensitive changes (where payouts go, the sign-in
 * email). The API refuses those with `STEP_UP_REQUIRED` until the request
 * carries a short-lived step-up token. `authFetch` handles it in one place:
 * it asks the registered handler (a dialog in each app) for a token, then
 * replays the request — so no individual form needs to know about it.
 */

export const STEP_UP_HEADER = 'x-step-up-token';
export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';
/**
 * A staff account without an authenticator app. Every admin route answers this
 * until two-factor is on, and so does any other route handed the narrow
 * enrolment-only step-up token such an account gets from its password.
 */
export const STAFF_MFA_REQUIRED = 'STAFF_MFA_REQUIRED';

/** How the account proves it's the holder: its strongest factor wins. */
export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'password' | 'email_code';

type Handler = () => Promise<string | null>;

let handler: Handler | null = null;
let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

/** Called by the app shell with a function that prompts and resolves a token (or null if cancelled). */
export function registerStepUpHandler(next: Handler | null) {
  handler = next;
}

/** Remember a token so the next few sensitive calls don't ask again. */
export function rememberStepUpToken(token: string, expiresInSeconds: number) {
  // A little early, so a token doesn't lapse between check and use.
  cached = { token, expiresAt: Date.now() + Math.max(0, expiresInSeconds - 30) * 1000 };
}

export function currentStepUpToken(): string | null {
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  cached = null;
  return null;
}

export function clearStepUpToken() {
  cached = null;
}

/** Prompts once even if several requests hit the wall together. */
export async function obtainStepUpToken(): Promise<string | null> {
  const existing = currentStepUpToken();
  if (existing) return existing;
  if (!handler) return null;
  inFlight ??= handler().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function isStepUpRequired(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { status?: number }).status === 403 &&
    (err as { code?: string }).code === STEP_UP_REQUIRED
  );
}

export function isStaffMfaRequired(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { status?: number }).status === 403 &&
    (err as { code?: string }).code === STAFF_MFA_REQUIRED
  );
}

type StaffMfaListener = () => void;
const staffMfaListeners = new Set<StaffMfaListener>();

/**
 * Subscribes to "the API refused this because staff two-factor is off". The
 * back office uses it to swap the page for the two-factor set-up screen
 * instead of leaving a wall of failing requests. Returns an unsubscribe.
 */
export function onStaffMfaRequired(listener: StaffMfaListener): () => void {
  staffMfaListeners.add(listener);
  return () => {
    staffMfaListeners.delete(listener);
  };
}

/**
 * Called by authFetch on a STAFF_MFA_REQUIRED refusal. The cached step-up
 * token goes first: it is the enrolment-only kind, and replaying it would only
 * earn the same refusal.
 */
export function notifyStaffMfaRequired() {
  clearStepUpToken();
  // One listener throwing must not stop the others hearing about it.
  for (const listener of staffMfaListeners) {
    try {
      listener();
    } catch {
      // ignored on purpose
    }
  }
}
