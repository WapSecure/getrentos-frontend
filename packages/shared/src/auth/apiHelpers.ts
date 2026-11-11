import {
  apiDownload,
  apiFetch,
  ApiError,
  apiUpload,
  currentAccessToken,
  refreshSession,
  type UploadOptions,
} from './apiClient';
import {
  clearStepUpToken,
  currentStepUpToken,
  isStaffMfaRequired,
  isStepUpRequired,
  notifyStaffMfaRequired,
  obtainStepUpToken,
  STEP_UP_HEADER,
  stepUpChallengeId,
} from './stepUp';
import { getAuthToken, getStoredUser, hasStoredSession } from './authStorage';

// Must match the backend's ActionVerificationGuard codes plus the trust guard's TRUST_TIER_REQUIRED.
export const VERIFICATION_REASONS = [
  'IDENTITY_REQUIRED',
  'LICENSE_REQUIRED',
  'OWNERSHIP_PROOF_REQUIRED',
  'TRUST_TIER_REQUIRED',
] as const;
export type VerificationReason = (typeof VERIFICATION_REASONS)[number];

// The user holds the tier's evidence but something else withholds it. Kept apart from
// VERIFICATION_REASONS so the UI never tells a verified user to go and get verified.
export const TRUST_WITHHELD_REASONS = [
  'SCORE_BELOW_TIER3_MIN',
  'OPEN_DISPUTE_AS_SUBJECT',
  'OPEN_REVIEW_CASE',
  'FAILED_FINANCIAL_CHECK',
  'ACCOUNT_RESTRICTED',
] as const;
export type TrustWithheldReason = (typeof TRUST_WITHHELD_REASONS)[number];

// Must match PlanTierGuard's PLAN_UPGRADE_REQUIRED and assertUnderPlanLimit's PLAN_LIMIT_REACHED.
export const PLAN_GATE_REASONS = ['PLAN_UPGRADE_REQUIRED', 'PLAN_LIMIT_REACHED'] as const;
export type PlanGateReason = (typeof PLAN_GATE_REASONS)[number];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  requestId?: string;
  // `error` is a softened sentence and can't be branched on; act on this code instead.
  code?: string;
  // Carried through `unwrap` so structured refusal detail survives (a guard needs the watch-list
  // entries that fired to decide whether to override).
  details?: unknown;
  reason?: VerificationReason;
  tierRequired?: number;
  currentTier?: number;
  withheldReason?: TrustWithheldReason;
  planGateReason?: PlanGateReason;
  planGateRequired?: string;
  planGateCurrent?: string | number;
  planGateLimit?: number;
}

export interface TrustTierMeta {
  tierRequired?: number;
  currentTier?: number;
}

export class VerificationRequiredError extends Error {
  reason: VerificationReason;
  tierRequired?: number;
  currentTier?: number;
  withheldReason?: TrustWithheldReason;
  constructor(
    message: string,
    reason: VerificationReason,
    meta?: TrustTierMeta & { withheldReason?: TrustWithheldReason }
  ) {
    super(message);
    this.name = 'VerificationRequiredError';
    this.reason = reason;
    this.tierRequired = meta?.tierRequired;
    this.currentTier = meta?.currentTier;
    this.withheldReason = meta?.withheldReason;
  }
}

export class PlanGateError extends Error {
  reason: PlanGateReason;
  required?: string;
  current?: string | number;
  limit?: number;
  constructor(
    message: string,
    reason: PlanGateReason,
    meta?: { required?: string; current?: string | number; limit?: number }
  ) {
    super(message);
    this.name = 'PlanGateError';
    this.reason = reason;
    this.required = meta?.required;
    this.current = meta?.current;
    this.limit = meta?.limit;
  }
}

function extractReason(details: unknown): VerificationReason | undefined {
  const code = (details as { error?: string } | undefined)?.error;
  return (VERIFICATION_REASONS as readonly string[]).includes(code ?? '')
    ? (code as VerificationReason)
    : undefined;
}

function extractTierMeta(details: unknown): TrustTierMeta {
  const body = (details ?? {}) as { required?: number; tier?: number };
  return { tierRequired: body.required, currentTier: body.tier };
}

function extractWithheldReason(details: unknown): TrustWithheldReason | undefined {
  const code = (details as { reason?: string } | undefined)?.reason;
  return (TRUST_WITHHELD_REASONS as readonly string[]).includes(code ?? '')
    ? (code as TrustWithheldReason)
    : undefined;
}

function extractPlanGateReason(details: unknown): PlanGateReason | undefined {
  const code = (details as { error?: string } | undefined)?.error;
  return (PLAN_GATE_REASONS as readonly string[]).includes(code ?? '')
    ? (code as PlanGateReason)
    : undefined;
}

function extractPlanGateMeta(details: unknown): {
  required?: string;
  current?: string | number;
  limit?: number;
} {
  const body = (details ?? {}) as { required?: string; current?: string | number; limit?: number };
  return { required: body.required, current: body.current, limit: body.limit };
}

export async function safeCall<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      const reason = err.status === 403 ? extractReason(err.details) : undefined;
      const tier = reason === 'TRUST_TIER_REQUIRED' ? extractTierMeta(err.details) : undefined;
      const withheldReason =
        reason === 'TRUST_TIER_REQUIRED' ? extractWithheldReason(err.details) : undefined;
      const planGateReason = err.status === 403 ? extractPlanGateReason(err.details) : undefined;
      const planGateMeta = planGateReason ? extractPlanGateMeta(err.details) : undefined;
      return {
        success: false,
        error: err.message,
        message: err.message,
        status: err.status,
        requestId: err.requestId,
        code: err.code,
        details: err.details,
        reason,
        tierRequired: tier?.tierRequired,
        currentTier: tier?.currentTier,
        withheldReason,
        planGateReason,
        planGateRequired: planGateMeta?.required,
        planGateCurrent: planGateMeta?.current,
        planGateLimit: planGateMeta?.limit,
      };
    }
    return {
      success: false,
      error: 'Something went wrong',
      message: 'Something went wrong. Please try again.',
    };
  }
}

// expectedUserId pins a deferred write to its original account through retries.
export async function authFetch<T>(
  path: string,
  options: RequestInit = {},
  expectedUserId?: string
): Promise<T> {
  const assertAccount = () => {
    if (expectedUserId && getStoredUser<{ id?: string }>()?.id !== expectedUserId) {
      throw new ApiError(409, 'Your account changed. Sign in again before retrying this action.');
    }
  };
  // apiFetch's own retry is off so one request can't fan out into several attempts.
  const doFetch = (token: string | null, stepUp: string | null = currentStepUpToken()) => {
    assertAccount();
    return apiFetch<T>(
      path,
      {
        ...options,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(stepUp ? { [STEP_UP_HEADER]: stepUp } : {}),
          ...options.headers,
        },
      },
      false
    );
  };

  // After a page load the token is restored before the first request; that refresh stands in for
  // the one a 401 would trigger.
  const restoredFirst = !getAuthToken() && hasStoredSession();
  try {
    return await doFetch(await currentAccessToken());
  } catch (err) {
    assertAccount();
    if (isStepUpRequired(err)) {
      clearStepUpToken();
      // The step-up token approves this exact request, once.
      const stepUp = await obtainStepUpToken(stepUpChallengeId(err));
      if (stepUp) {
        try {
          return await doFetch(getAuthToken(), stepUp);
        } catch (replayErr) {
          if (isStaffMfaRequired(replayErr)) notifyStaffMfaRequired();
          throw replayErr;
        }
      }
    }
    if (isStaffMfaRequired(err)) notifyStaffMfaRequired();
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !restoredFirst &&
      path !== '/auth/refresh' &&
      path !== '/auth/login'
    ) {
      const refreshed = await refreshSession();
      if (refreshed) return doFetch(getAuthToken());
    }
    throw err;
  }
}

/**
 * `authFetch` for a multipart POST that reports upload progress and can be cancelled.
 * Same bearer and one refresh-and-retry on a 401 (progress restarts from 0); no step-up, which no upload route asks for.
 */
export async function authUpload<T>(
  path: string,
  body: FormData,
  options: UploadOptions = {}
): Promise<T> {
  const send = (token: string | null) =>
    apiUpload<T>(path, body, token ? { Authorization: `Bearer ${token}` } : {}, options);
  const restoredFirst = !getAuthToken() && hasStoredSession();
  try {
    return await send(await currentAccessToken());
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !restoredFirst) {
      const refreshed = await refreshSession();
      if (refreshed) return send(getAuthToken());
    }
    throw err;
  }
}

export async function authDownload(path: string, options: RequestInit = {}): Promise<Blob> {
  const doDownload = (token: string | null) =>
    apiDownload(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  const restoredFirst = !getAuthToken() && hasStoredSession();
  try {
    return await doDownload(await currentAccessToken());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !restoredFirst) {
      const refreshed = await refreshSession();
      if (refreshed) return doDownload(getAuthToken());
    }
    throw error;
  }
}

export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (!response.success) {
    const message = response.message || response.error || 'Request failed';
    if (response.reason)
      throw new VerificationRequiredError(message, response.reason, {
        tierRequired: response.tierRequired,
        currentTier: response.currentTier,
        withheldReason: response.withheldReason,
      });
    if (response.planGateReason)
      throw new PlanGateError(message, response.planGateReason, {
        required: response.planGateRequired,
        current: response.planGateCurrent,
        limit: response.planGateLimit,
      });
    // Throw the API's own body where there was one, so callers can act on its code and detail.
    throw new ApiError(
      response.status ?? 0,
      message,
      response.details ?? {
        error: response.code ?? response.error,
        requestId: response.requestId,
      }
    );
  }
  return response.data as T;
}

// A 404 resolves to the empty value: a renter whose lease awaits signature gets 404s for lease
// data, and failing on them hid the screen that lets them sign.
export async function unwrapOptional<T>(
  promise: Promise<ApiResponse<T>>,
  whenMissing: T
): Promise<T> {
  try {
    const value = await unwrap(promise);
    // Nest sends an empty 200 when a handler returns null; it arrives as undefined, which
    // react-query rejects.
    return value ?? whenMissing;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return whenMissing;
    throw error;
  }
}

export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '' && v !== 'all'
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
}
