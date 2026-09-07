/**
 * Typed runtime config. `EXPO_PUBLIC_*` vars are inlined at build time by Metro
 * and are safe to ship (no secrets here). Per-environment values come from the
 * matching EAS build profile in `eas.json`.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

if (!/^https?:\/\//.test(API_URL)) {
  throw new Error(`EXPO_PUBLIC_API_URL is not a valid URL: "${API_URL}"`);
}

export const env = {
  apiUrl: API_URL.replace(/\/$/, ''),
  /** Sent as `x-client-app` so the API returns the refresh token in the body. */
  clientApp: 'mobile' as const,
};
