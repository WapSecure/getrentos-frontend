// Server-safe (no client imports).
export const PUBLIC_REVALIDATE = 60;

// Photo links are signed for 2 hours and stale fetches are served while refreshing, so the key rotates every 30 minutes.
const WINDOW_MS = 30 * 60 * 1000;

// Marketing pages render per request (CSP nonce), so sections that can do without their data pass this to give up.
export const OPTIONAL_FETCH_TIMEOUT_MS = 3000;

export const publicFetchInit = ({ timeoutMs }: { timeoutMs?: number } = {}): RequestInit & {
  next: { revalidate: number };
} => ({
  headers: { 'x-cache-window': String(Math.floor(Date.now() / WINDOW_MS)) },
  next: { revalidate: PUBLIC_REVALIDATE },
  ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
});
