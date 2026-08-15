import { apiFetch, ApiError, refreshSession } from '@/lib/apiClient';
import { getAuthToken } from '@/lib/authStorage';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function safeCall<T>(fn: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: err.message, message: err.message };
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

export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || response.error || 'Request failed');
  }
  return response.data;
}

export function toQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v && v !== 'all');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries as [string, string][]).toString();
}
