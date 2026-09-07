import { apiDownload, apiFetch, ApiError, refreshSession } from './apiClient';
import { getAuthToken } from './authStorage';

/**
 * Machine-readable codes the backend attaches to a 403 when an action is gated
 * on verification or trust — the ActionVerificationGuard codes plus the trust
 * guard's TRUST_TIER_REQUIRED (which carries required + current tier).
 */
export const VERIFICATION_REASONS = [
  'IDENTITY_REQUIRED',
  'LICENSE_REQUIRED',
  'OWNERSHIP_PROOF_REQUIRED',
  'TRUST_TIER_REQUIRED',
] as const;
export type VerificationReason = (typeof VERIFICATION_REASONS)[number];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  requestId?: string;
  /** Set when a 403 was rejected by a verification/trust guard — see VERIFICATION_REASONS. */
  reason?: VerificationReason;
  /** TRUST_TIER_REQUIRED only: the minimum tier the action requires (backend `required`). */
  tierRequired?: number;
  /** TRUST_TIER_REQUIRED only: the caller's current trust tier (backend `tier`). */
  currentTier?: number;
}

export interface TrustTierMeta {
  tierRequired?: number;
  currentTier?: number;
}

/**
 * Thrown by unwrap() when a request 403s because an action-level verification
 * or trust-tier requirement wasn't met. Carries the tier numbers for
 * TRUST_TIER_REQUIRED so the UI can upsell to the Verification Center.
 */
export class VerificationRequiredError extends Error {
  reason: VerificationReason;
  tierRequired?: number;
  currentTier?: number;
  constructor(message: string, reason: VerificationReason, meta?: TrustTierMeta) {
    super(message);
    this.name = 'VerificationRequiredError';
    this.reason = reason;
    this.tierRequired = meta?.tierRequired;
    this.currentTier = meta?.currentTier;
  }
}

function extractReason(details: unknown): VerificationReason | undefined {
  const code = (details as { error?: string } | undefined)?.error;
  return (VERIFICATION_REASONS as readonly string[]).includes(code ?? '')
    ? (code as VerificationReason)
    : undefined;
}

/** Reads the tier numbers off a TRUST_TIER_REQUIRED 403 body. */
function extractTierMeta(details: unknown): TrustTierMeta {
  const body = (details ?? {}) as { required?: number; tier?: number };
  return { tierRequired: body.required, currentTier: body.tier };
}

export async function safeCall<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      const reason = err.status === 403 ? extractReason(err.details) : undefined;
      const tier = reason === 'TRUST_TIER_REQUIRED' ? extractTierMeta(err.details) : undefined;
      return {
        success: false,
        error: err.message,
        message: err.message,
        status: err.status,
        requestId: err.requestId,
        reason,
        tierRequired: tier?.tierRequired,
        currentTier: tier?.currentTier,
      };
    }
    return {
      success: false,
      error: 'Something went wrong',
      message: 'Something went wrong. Please try again.',
    };
  }
}

/** Fetches with the Bearer token attached, silently refreshing on 401 once. */
export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = (token: string | null) =>
    apiFetch<T>(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  try {
    return await doFetch(getAuthToken());
  } catch (err) {
    // The access token expired — exchange the refresh token for a fresh pair
    // and retry the request once. Single-flight refresh prevents the rotation
    // race when many requests 401 at the same moment.
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      path !== '/auth/refresh' &&
      path !== '/auth/login'
    ) {
      const refreshed = await refreshSession();
      if (refreshed) return doFetch(getAuthToken());
    }
    throw err;
  }
}

/** Downloads an authenticated binary response, refreshing an expired session once. */
export async function authDownload(path: string, options: RequestInit = {}): Promise<Blob> {
  const doDownload = (token: string | null) =>
    apiDownload(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  try {
    return await doDownload(getAuthToken());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
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
      });
    throw new ApiError(response.status ?? 0, message, {
      error: response.error,
      requestId: response.requestId,
    });
  }
  return response.data as T;
}

export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '' && v !== 'all'
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
}
