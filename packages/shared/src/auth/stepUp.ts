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

/**
 * How the account proves it's the holder: its strongest factor wins. A
 * password alone never confirms anything, so an account with no factor gets
 * `setup_required`: its password and an emailed code earn a set-up-only token
 * that opens just the routes that add a factor.
 */
export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'setup_required';

/** A refusal from a route handed the set-up-only token: add a factor first. */
export const FACTOR_SETUP_REQUIRED = 'FACTOR_SETUP_REQUIRED';

/** A new transaction PIN is six digits; older accounts may still confirm with four. */
export const TRANSACTION_PIN_LENGTH = 6;

/** What the confirm dialog is asked for: the challenge the API raised, when there was one. */
export interface StepUpRequest {
  challengeId?: string;
}

type Handler = (request: StepUpRequest) => Promise<string | null>;

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

/**
 * Gets a confirmation for a refused request. With a `challengeId` (the API
 * now always sends one, security gap AU-02) the token approves exactly that
 * request, once, so it is never cached and never shared: prompts for
 * different requests queue one after another. Without one (an older API, or
 * the staff enrolment flow) it falls back to the cached, shared token.
 */
export async function obtainStepUpToken(challengeId?: string): Promise<string | null> {
  if (!handler) return null;
  if (challengeId) {
    const ask = handler;
    const turn = (inFlight ?? Promise.resolve(null))
      .catch(() => null)
      .then(() => ask({ challengeId }));
    inFlight = turn.finally(() => {
      if (inFlight === turn) inFlight = null;
    });
    return turn;
  }
  const existing = currentStepUpToken();
  if (existing) return existing;
  const ask = handler;
  inFlight ??= ask({}).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** The challenge id a STEP_UP_REQUIRED refusal carries (in the API error's details). */
export function stepUpChallengeId(err: unknown): string | undefined {
  const details = (err as { details?: { challengeId?: unknown } } | null)?.details;
  return typeof details?.challengeId === 'string' ? details.challengeId : undefined;
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
