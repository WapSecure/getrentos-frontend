import Constants from 'expo-constants';

/**
 * API base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL — set explicitly (EAS build profiles, CI, staging).
 *  2. In a dev client / Expo Go: derive it from the Metro host so the app on a
 *     physical device talks to the laptop running the API, with no hard-coded
 *     IP. Assumes the API is on port 4000 on the same machine as Metro.
 *  3. Fallback: localhost (simulator / web).
 */
function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');

  // Metro host, e.g. "192.168.1.23:8081" — present in a dev client / Expo Go.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;

  if (typeof hostUri === 'string') {
    const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000`;
    }
  }
  return 'http://localhost:4000';
}

const API_URL = resolveApiUrl();

export const env = {
  apiUrl: API_URL,
  /** Sent as `x-client-app` so the API returns the refresh token in the body. */
  clientApp: 'mobile' as const,
};
