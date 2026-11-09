// On STEP_UP_REQUIRED, apiFetch asks the registered prompt (the StepUpSheet) for a token and replays the request.
export const STEP_UP_HEADER = 'x-step-up-token';
export const STEP_UP_REQUIRED = 'STEP_UP_REQUIRED';

export interface StepUpRequest {
  challengeId?: string;
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

// A `challengeId` token approves exactly one request, once, so it is never cached or shared; prompts queue.
export async function obtainStepUpToken(challengeId?: string): Promise<string | null> {
  if (!prompt) return null;
  if (challengeId) {
    const ask = prompt;
    // Captured now: by the time a queued prompt opens, other requests may have set their own summaries.
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
