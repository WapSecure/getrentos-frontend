/**
 * "Confirm it's you" for sensitive changes (where payouts go, the sign-in
 * email). The API refuses those with `STEP_UP_REQUIRED` until the request
 * carries a short-lived step-up token. `authFetch` handles it in one place:
 * it asks the registered handler (a dialog in each app) for a token, then
 * replays the request — so no individual form needs to know about it.
 */

export const STEP_UP_HEADER = 'x-step-up-token';
export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';

/** How the account proves it's the holder: its strongest factor wins. */
export type StepUpMethod = 'passkey' | 'totp' | 'transaction_pin' | 'password' | 'email_code';

/** Told what the request being confirmed does, when the caller said (UX-30). */
type Handler = (summary: string | null) => Promise<string | null>;

let handler: Handler | null = null;
let summaries: string[] = [];
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
  inFlight ??= handler(currentStepUpSummary()).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** The newest summary set by `withStepUpSummary`, or null. */
export function currentStepUpSummary(): string | null {
  return summaries.length ? summaries[summaries.length - 1] : null;
}

/**
 * Runs a sensitive request with a one-line summary of what it does, e.g.
 * "Withdraw ₦250,000 to GTBank ••••1234", so a "Confirm it's you" prompt it
 * triggers can say what is being authorised rather than only that something is.
 */
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
