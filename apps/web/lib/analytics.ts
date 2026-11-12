// No 'use client': services call `track` after an API success, and on the server it does nothing.
import type { ShowroomEvent, ShowroomEventInput } from '@sureground/shared/showroom';

const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/analytics/events`;
const SESSION_KEY = 'sureground.analytics.session';
const MAX_BATCH = 50;
const FLUSH_MS = 5000;

let queue: ShowroomEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

// A random id per tab, never tied to the account: we measure journeys, not people.
function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const device = (): ShowroomEvent['device'] =>
  window.innerWidth < 640 ? 'phone' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

const connection = (): ShowroomEvent['connection'] => {
  const type = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
    ?.effectiveType;
  return type === 'slow-2g' || type === '2g' || type === '3g' || type === '4g' ? type : undefined;
};

function flush(useBeacon = false) {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  const body = JSON.stringify({ events: batch });
  try {
    if (useBeacon && navigator.sendBeacon) {
      // text/plain needs no CORS preflight, which a beacon can't make; the API accepts it on this route.
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
    } else {
      void fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
      }).catch(() => {});
    }
  } catch {
    // Measurement must never break the page.
  }
  if (queue.length) flush(useBeacon);
}

/** Fire and forget. Skipped when the browser asks not to be tracked. */
export function track(event: ShowroomEventInput) {
  if (typeof window === 'undefined' || navigator.doNotTrack === '1') return;
  queue.push({
    ...event,
    occurredAt: new Date().toISOString(),
    sessionId: sessionId(),
    device: device(),
    connection: connection(),
  });
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush(true);
    });
  }
  // Web vitals arrive as the tab is hidden, after the hidden-tab flush may already have run.
  if (document.visibilityState === 'hidden') flush(true);
  else if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

/**
 * Records a funnel event only when the API call it describes succeeded, and hands the response back.
 * The API drops event names it does not know yet, so this never affects the call.
 */
export function trackOnSuccess<T extends { success: boolean }>(
  response: T,
  event: ShowroomEventInput
): T {
  try {
    if (response.success) track(event);
  } catch {
    // Measurement must never break the action.
  }
  return response;
}
