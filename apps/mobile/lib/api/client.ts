import { env } from '../env';

export class ApiError extends Error {
  status: number;
  /** Machine-readable code from the API envelope, e.g. `DATABASE_ERROR`. */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get isAuth() {
    return this.status === 401;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export interface ApiRequest extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip the Authorization header (used by the login/refresh calls). */
  anonymous?: boolean;
  /** Internal: prevents infinite retry loops after a refresh. */
  _retry?: boolean;
}

/**
 * The client is transport only. `AuthProvider` injects these two hooks so the
 * client can attach the current access token and, on a 401, ask for a silent
 * refresh — without importing the auth layer (which would be circular).
 */
type Hooks = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
};
let hooks: Hooks = { getAccessToken: () => null, refresh: async () => null };
export function configureApi(next: Hooks) {
  hooks = next;
}

const REQUEST_TIMEOUT_MS = 20_000;
/** Uploads get more room — they're bigger and slower than a JSON round-trip. */
const UPLOAD_TIMEOUT_MS = 60_000;

async function send(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${env.apiUrl}${path}`, { ...init, signal: controller.signal });
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

/** Parses a JSON envelope, throwing `ApiError` for a non-2xx response. */
async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const payload = (await res.json()) as { message?: string; error?: string };
      message = payload.message || message;
      code = payload.error;
    } catch {
      // non-JSON body
    }
    throw new ApiError(message, res.status, code);
  }
  if (res.status === 204 || res.status === 205) return undefined as T;
  return (await res.json()) as T;
}

export async function apiFetch<T>(path: string, options: ApiRequest = {}): Promise<T> {
  const { body, headers, anonymous, _retry, ...init } = options;
  const token = anonymous ? null : hooks.getAccessToken();

  const res = await send(
    path,
    {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-client-app': env.clientApp,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS
  );

  // One transparent retry after a silent token refresh.
  if (res.status === 401 && !anonymous && !_retry) {
    const fresh = await hooks.refresh();
    if (fresh) return apiFetch<T>(path, { ...options, _retry: true });
  }

  return readJson<T>(res);
}

/**
 * Multipart upload. Native `fetch` sets the `multipart/form-data` boundary
 * itself from a `FormData` body — never set `Content-Type` by hand here.
 */
export async function apiUpload<T>(path: string, form: FormData, _retry = false): Promise<T> {
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
