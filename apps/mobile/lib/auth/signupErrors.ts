import { ERROR_MESSAGES } from '@sureground/shared';
import { ApiError } from '../api/client';
import { authApi } from '../api/auth';

export type SignupField = 'identifier' | 'password' | 'referralCode';

export interface SignupIssue {
  field: SignupField;
  message: string;
  /** The identifier already has an account: offer sign-in with it filled in. */
  accountExists?: boolean;
}

/** The API's machine code: `code` on the newer envelope, `error` on the older one. */
export function apiErrorCode(err: unknown): string | undefined {
  if (!(err instanceof ApiError)) return undefined;
  const code = err.details?.code;
  return typeof code === 'string' ? code : err.code;
}

export function retryAfterSeconds(err: unknown): number | null {
  if (!(err instanceof ApiError)) return null;
  const raw = err.details?.retryAfterSeconds;
  const seconds = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

function waitPhrase(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export function isAccountExists(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const code = apiErrorCode(err);
  return code === 'ACCOUNT_EXISTS' || (err.status === 409 && (!code || code === 'Conflict'));
}

export function accountExistsCopy(method: 'email' | 'phone'): string {
  return method === 'email'
    ? 'An account already uses this email.'
    : 'An account already uses this phone number.';
}

const PASSWORD_BREACHED_COPY =
  'This password has appeared in a data breach. Choose a different one.';
const REFERRAL_INVALID_COPY = 'We don’t recognise that referral code. Check it or leave it blank.';

/** A refusal that belongs to one step-1 field, or null. */
export function signupFieldIssue(err: unknown, method: 'email' | 'phone'): SignupIssue | null {
  if (!(err instanceof ApiError)) return null;
  if (isAccountExists(err)) {
    return { field: 'identifier', message: accountExistsCopy(method), accountExists: true };
  }
  switch (apiErrorCode(err)) {
    case 'PASSWORD_TOO_SHORT':
      return { field: 'password', message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
    case 'PASSWORD_BREACHED':
      return { field: 'password', message: PASSWORD_BREACHED_COPY };
    case 'REFERRAL_INVALID':
      return { field: 'referralCode', message: REFERRAL_INVALID_COPY };
    default:
      return null;
  }
}

/** Fixed copy for the code-sending refusals; the server's text otherwise. */
export function codeSendErrorCopy(err: unknown, fallback: string): string {
  const code = apiErrorCode(err);
  const wait = retryAfterSeconds(err);
  if (code === 'RESEND_TOO_SOON') {
    return wait
      ? `Wait ${waitPhrase(wait)} before asking for another code.`
      : 'Wait a moment before asking for another code.';
  }
  if (code === 'TOO_MANY_CODES') {
    return wait
      ? `Too many codes sent. Try again in ${waitPhrase(wait)}.`
      : 'Too many codes sent. Try again later.';
  }
  if (err instanceof ApiError && err.isNetwork)
    return 'Can’t reach Sureground. Check your connection.';
  return err instanceof ApiError && err.message ? err.message : fallback;
}

/**
 * Checks the password and referral code before a code is sent. An older API without the route,
 * or no connection, lets sign-up carry on: the sign-up call checks them again.
 */
export async function precheckSignup(
  input: { password?: string; referralCode?: string },
  method: 'email' | 'phone'
): Promise<SignupIssue | null> {
  try {
    await authApi.signupPrecheck(input);
    return null;
  } catch (err) {
    return err instanceof ApiError && err.status === 400 ? signupFieldIssue(err, method) : null;
  }
}

const OAUTH_COPY: Record<string, string> = {
  OAUTH_FAILED: 'Could not sign you in. Try again.',
  ACCOUNT_SUSPENDED: 'This account is suspended. Contact support for help.',
  EMAIL_UNVERIFIED: 'Verify your email with that provider first, then try again.',
};

/** Never shows text from the redirect URL itself. */
export function oauthErrorCopy(code: string | null | undefined): string {
  return (code && OAUTH_COPY[code]) || OAUTH_COPY.OAUTH_FAILED;
}
