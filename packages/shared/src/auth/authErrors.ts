import type { ApiResponse } from './apiHelpers';

type ErrorSource = Pick<ApiResponse, 'code' | 'details'>;

const CODE_PATTERN = /^[A-Z][A-Z0-9_]+$/;

function detailsOf(res: ErrorSource): Record<string, unknown> {
  return res.details && typeof res.details === 'object'
    ? (res.details as Record<string, unknown>)
    : {};
}

// Auth endpoints send `code`; other endpoints put theirs in `error`, which Nest also fills with "Bad Request".
export function authErrorCode(res: ErrorSource): string | undefined {
  const fromBody = detailsOf(res).code;
  if (typeof fromBody === 'string' && CODE_PATTERN.test(fromBody)) return fromBody;
  return res.code && CODE_PATTERN.test(res.code) ? res.code : undefined;
}

export function authErrorField(res: ErrorSource): string | undefined {
  const field = detailsOf(res).field;
  return typeof field === 'string' ? field : undefined;
}

export function retryAfterSeconds(res: ErrorSource): number | undefined {
  const value = Number(detailsOf(res).retryAfterSeconds);
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined;
}

export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export const AUTH_ERROR_COPY: Record<string, string> = {
  ACCOUNT_EXISTS: 'There is already an account with these details. Sign in instead.',
  TOO_MANY_CODES: 'We have sent several codes already. Wait a while before asking for another.',
  RESEND_TOO_SOON: 'Wait a moment before asking for a new code.',
  TEXT_CODES_PAUSED:
    "We can't send codes by text right now. Use email instead, or try again later.",
  PASSWORD_TOO_SHORT: 'Use at least 12 characters. A short phrase works well.',
  PASSWORD_BREACHED:
    'This password has appeared in a data breach elsewhere. Choose a different one.',
  REFERRAL_INVALID: 'We could not find that referral code. Check it, or leave it empty.',
  INITIAL_ROLES_CLOSED: 'Your account is already set up. You can add roles later in settings.',
  OAUTH_CANCELLED: 'Sign-in with Google was cancelled. You can try again.',
  OAUTH_FAILED: 'We could not sign you in with Google. Try again, or use your email.',
  ACCOUNT_SUSPENDED: 'This account is suspended. Contact support if you think this is a mistake.',
  EMAIL_UNVERIFIED: 'Google has not confirmed this email address yet. Verify it with Google first.',
};

const WAIT_COPY: Record<string, (wait: string) => string> = {
  TOO_MANY_CODES: (wait) => `We have sent several codes already. Try again in ${wait}.`,
  RESEND_TOO_SOON: (wait) => `Wait ${wait} before asking for a new code.`,
};

/** Fixed copy for a known code, else the server's message, else the fallback. */
export function authErrorMessage(
  res: ErrorSource & Pick<ApiResponse, 'message'>,
  fallback: string
): string {
  const code = authErrorCode(res);
  if (!code) return res.message || fallback;
  const wait = retryAfterSeconds(res);
  if (wait && WAIT_COPY[code]) return WAIT_COPY[code](formatWait(wait));
  return AUTH_ERROR_COPY[code] ?? (res.message || fallback);
}

/** Never shows text from the URL: an unknown value gets the generic failure copy. */
export function oauthErrorMessage(code: string | null | undefined): string {
  return (code && AUTH_ERROR_COPY[code]) || AUTH_ERROR_COPY.OAUTH_FAILED;
}
