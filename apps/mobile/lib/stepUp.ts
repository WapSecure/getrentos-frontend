/**
 * "Confirm it's you" for sensitive changes (where payouts go, the sign-in
 * email). The API refuses those with STEP_UP_REQUIRED until the request
 * carries a short-lived token. `apiFetch` asks the registered prompt (the
 * StepUpSheet at the app root) for one and replays the request, so no screen
 * has to handle it.
 */
export const STEP_UP_HEADER = 'x-step-up-token';
export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';

/** What the sheet is asked for: the challenge the API raised, when there was one. */
export interface StepUpRequest {
  challengeId?: string;
  /** What the request being confirmed does, when the caller said (UX-30). */
  summary?: string | null;
}

type Prompt = (request: StepUpRequest) => Promise<string | null>;

let prompt: Prompt | null = null;
let summaries: string[] = [];
let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

export function registerStepUpPrompt(next: Prompt | null) {
  prompt = next;
}

export function rememberStepUpToken(token: string, expiresInSeconds: number, now = Date.now()) {
  // A little early, so a token doesn't lapse between check and use.
  cached = { token, expiresAt: now + Math.max(0, expiresInSeconds - 30) * 1000 };
}

export function currentStepUpToken(now = Date.now()): string | null {
  if (cached && cached.expiresAt > now) return cached.token;
  cached = null;
  return null;
}

export function clearStepUpToken() {
  cached = null;
}

/**
 * Gets a confirmation for a refused request. With a `challengeId` (security
 * gap AU-02) the token approves exactly that request, once, so it is never
 * cached or shared: prompts for different requests queue. Without one it
 * falls back to the cached, shared token.
 */
export async function obtainStepUpToken(challengeId?: string): Promise<string | null> {
  if (!prompt) return null;
  if (challengeId) {
    const ask = prompt;
    // Captured now: by the time a queued prompt opens, other requests may have
    // pushed their own summaries.
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
  const ask = prompt;
  inFlight ??= ask({ summary: currentStepUpSummary() }).finally(() => {
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
 * "Withdraw ₦250,000 to GTBank ••••1234", so the StepUpSheet it triggers says
 * what is being authorised rather than only that something is.
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
