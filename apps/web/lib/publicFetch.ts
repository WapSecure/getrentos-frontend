// Server-safe (no client imports).
export const PUBLIC_REVALIDATE = 60;

// Public photo links are signed for 2 hours and Next serves stale fetches while refreshing, so the key
// rotates every 30 minutes: with pages capped at an hour (expireTime) no link is over 90 minutes old.
const WINDOW_MS = 30 * 60 * 1000;

// Marketing pages render on every request (the CSP nonce), so an uncached fetch holds back the
// whole page. Sections that can render without their data pass this to give up instead.
export const OPTIONAL_FETCH_TIMEOUT_MS = 3000;

export const publicFetchInit = ({ timeoutMs }: { timeoutMs?: number } = {}): RequestInit & {
  next: { revalidate: number };
} => ({
  headers: { 'x-cache-window': String(Math.floor(Date.now() / WINDOW_MS)) },
  next: { revalidate: PUBLIC_REVALIDATE },
  ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
});
