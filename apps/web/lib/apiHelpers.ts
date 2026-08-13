import { apiFetch, ApiError } from '@/lib/apiClient';
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

export function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
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
