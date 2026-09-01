import * as SecureStore from 'expo-secure-store';

/**
 * Minimal GetRentos API client for React Native.
 *
 * The web app shares a richer client via `@getrentos/shared`, but that layer is
 * built on `localStorage`/`sessionStorage`, which don't exist in React Native.
 * This client mirrors the same backend contract and keeps the access token in
 * the OS secure store (Keychain / Keystore) instead.
 *
 * Env: EXPO_PUBLIC_API_URL (defaults to the local dev API, matching the web app).
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'getrentos_auth_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {
      // Non-JSON error body — fall back to the status-based message.
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
