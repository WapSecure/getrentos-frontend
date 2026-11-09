import { env } from '../env';
import { attachQueuedWebFiles } from './webFormFiles';
import {
  clearStepUpToken,
  currentStepUpToken,
  obtainStepUpToken,
  STEP_UP_HEADER,
  STEP_UP_REQUIRED,
} from '../stepUp';
import { getInstallId } from '../auth/installId';

export interface ApiErrorDetails {
  tierRequired?: number;
  currentTier?: number;
  reason?: string;
  /** The rest of the envelope, verbatim, for refusals whose structure a caller must act on. */
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details: ApiErrorDetails;
  constructor(message: string, status: number, code?: string, details: ApiErrorDetails = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
  get isAuth() {
    return this.status === 401;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export { toQuery, type QueryValue } from './query';

export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError && e.message ? e.message : fallback;
}

export interface ApiRequest extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  anonymous?: boolean;
  /** Internal: prevents infinite retry loops after a refresh. */
  _retry?: boolean;
  /** Internal: the request has already been replayed with a step-up token. */
  _stepUp?: boolean;
}

/** Injected by `AuthProvider`: importing the auth layer here would be circular. */
type Hooks = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
  onSuspended?: (message: string) => Promise<void> | void;
};
let hooks: Hooks = { getAccessToken: () => null, refresh: async () => null };

export const ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED';
export function configureApi(next: Hooks) {
  hooks = next;
}

const REQUEST_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 60_000;

async function send(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Sent on every request so the API can tell a new device from a known one at sign-in.
    const deviceId = await getInstallId();
    const headers = deviceId
      ? { ...(init.headers as Record<string, string>), 'x-device-id': deviceId }
      : init.headers;
    return await fetch(`${env.apiUrl}${path}`, { ...init, headers, signal: controller.signal });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      aborted ? 'The request timed out. Check your connection.' : 'Network request failed.',
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    const details: ApiErrorDetails = {};
    try {
      const payload = (await res.json()) as {
        message?: string;
        error?: string;
        // The API's exception filter names these `required` and `tier`.
        required?: unknown;
        tier?: unknown;
        reason?: unknown;
      };
      message = payload.message || message;
      code = payload.error;
      // The API spells the gate fields differently on the wire.
      if (typeof payload.required === 'number') details.tierRequired = payload.required;
      if (typeof payload.tier === 'number') details.currentTier = payload.tier;
      if (typeof payload.reason === 'string') details.reason = payload.reason;
      Object.assign(details, payload);
    } catch {
      // non-JSON body
    }
    throw new ApiError(message, res.status, code, details);
  }
  if (res.status === 204 || res.status === 205) return undefined as T;

  // Several endpoints answer success with an empty body, which `res.json()` would throw on.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiFetch<T>(path: string, options: ApiRequest = {}): Promise<T> {
  const { body, headers, anonymous, _retry, _stepUp, ...init } = options;
  const token = anonymous ? null : hooks.getAccessToken();
  const stepUp = anonymous ? null : currentStepUpToken();

  const res = await send(
    path,
    {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-client-app': env.clientApp,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(stepUp ? { [STEP_UP_HEADER]: stepUp } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS
  );

  if (res.status === 401 && !anonymous && !_retry) {
    const fresh = await hooks.refresh();
    if (fresh) return apiFetch<T>(path, { ...options, _retry: true });
  }

  try {
    return await readJson<T>(res);
  } catch (err) {
    if (err instanceof ApiError && err.code === ACCOUNT_SUSPENDED && token) {
      await hooks.onSuspended?.(err.message);
      throw err;
    }
    if (err instanceof ApiError && err.code === STEP_UP_REQUIRED && !_stepUp) {
      clearStepUpToken();
      // The token approves this exact request, once.
      const challengeId =
        typeof err.details?.challengeId === 'string' ? err.details.challengeId : undefined;
      const fresh = await obtainStepUpToken(challengeId);
      if (fresh) {
        return apiFetch<T>(path, {
          ...options,
          _stepUp: true,
          headers: { ...headers, [STEP_UP_HEADER]: fresh },
        });
      }
    }
    throw err;
  }
}

export async function apiDownload(
  path: string,
  _retry = false
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const token = hooks.getAccessToken();

  const res = await send(
    path,
    {
      method: 'GET',
      headers: {
        'x-client-app': env.clientApp,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    UPLOAD_TIMEOUT_MS
  );

  if (res.status === 401 && !_retry) {
    const fresh = await hooks.refresh();
    if (fresh) return apiDownload(path, true);
  }

  if (!res.ok) {
    return readJson(res);
  }

  const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
  return { bytes: new Uint8Array(await res.arrayBuffer()), mimeType };
}

/** The API sends "none" as an empty body, and React Query treats an `undefined` result as an error. */
export async function apiFetchOrNull<T>(path: string, options: ApiRequest = {}): Promise<T | null> {
  return (await apiFetch<T | null>(path, options)) ?? null;
}

/** Never set `Content-Type` by hand: native `fetch` sets the multipart boundary itself. */
export async function apiUpload<T>(path: string, form: FormData, _retry = false): Promise<T> {
  await attachQueuedWebFiles(form);
  const token = hooks.getAccessToken();

  const res = await send(
    path,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'x-client-app': env.clientApp,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    },
    UPLOAD_TIMEOUT_MS
  );

  if (res.status === 401 && !_retry) {
    const fresh = await hooks.refresh();
    if (fresh) return apiUpload<T>(path, form, true);
  }

  return readJson<T>(res);
}
