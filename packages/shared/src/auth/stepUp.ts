export const STEP_UP_HEADER = 'x-step-up-token';
export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';
// Also returned by any route given the enrolment-only token such an account gets from its password.
export const STAFF_MFA_REQUIRED = 'STAFF_MFA_REQUIRED';

// A password alone never confirms anything, so an account with no factor gets `setup_required`.
export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'setup_required';

export const FACTOR_SETUP_REQUIRED = 'FACTOR_SETUP_REQUIRED';

// New PINs are six digits; older accounts may still confirm with four.
export const TRANSACTION_PIN_LENGTH = 6;

export interface StepUpRequest {
  challengeId?: string;
  summary?: string | null;
}

type Handler = (request: StepUpRequest) => Promise<string | null>;

let handler: Handler | null = null;
let summaries: string[] = [];
let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

export function registerStepUpHandler(next: Handler | null) {
  handler = next;
}

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

// A challengeId token approves exactly one request, so it is never cached or shared and prompts
// queue; without one it falls back to the cached, shared token.
export async function obtainStepUpToken(challengeId?: string): Promise<string | null> {
  if (!handler) return null;
  if (challengeId) {
    const ask = handler;
    // Captured now: a queued prompt opens after other requests may have pushed their own summaries.
    const summary = currentStepUpSummary();
    const turn = (inFlight ?? Promise.resolve(null))
      .catch(() => null)
      .then(() => ask({ challengeId, summary }));
    inFlight = turn.finally(() => {
      if (inFlight === turn) inFlight = null;
    });
    return turn;
  }
  const existing = currentStepUpToken();
  if (existing) return existing;
  const ask = handler;
  inFlight ??= ask({ summary: currentStepUpSummary() }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function stepUpChallengeId(err: unknown): string | undefined {
  const details = (err as { details?: { challengeId?: unknown } } | null)?.details;
  return typeof details?.challengeId === 'string' ? details.challengeId : undefined;
}

export function currentStepUpSummary(): string | null {
  return summaries.length ? summaries[summaries.length - 1] : null;
}

export async function withStepUpSummary<T>(summary: string, fn: () => Promise<T>): Promise<T> {
  summaries = [...summaries, summary];
  try {
    return await fn();
  } finally {
    const i = summaries.lastIndexOf(summary);
    if (i >= 0) summaries = [...summaries.slice(0, i), ...summaries.slice(i + 1)];
  }
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

export function onStaffMfaRequired(listener: StaffMfaListener): () => void {
  staffMfaListeners.add(listener);
  return () => {
    staffMfaListeners.delete(listener);
  };
}

// The cached token is the enrolment-only kind; replaying it would only earn the same refusal.
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
