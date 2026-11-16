// Anonymous by design, like the web's apps/web/lib/analytics.ts: no token, user id or device id, just a session id per launch.

import { AppState, Dimensions } from 'react-native';
import { randomUUID } from 'expo-crypto';
import type { ShowroomEvent, ShowroomEventInput } from '@sureground/shared/showroom';
import { env } from './env';

const MAX_BATCH = 50;
const FLUSH_MS = 5000;

let queue: ShowroomEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
let session: string | null = null;

const sessionId = () => (session ??= randomUUID());

const device = (): ShowroomEvent['device'] => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) < 600 ? 'phone' : 'tablet';
};

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  while (queue.length) {
    const batch = queue.slice(0, MAX_BATCH);
    queue = queue.slice(MAX_BATCH);
    try {
      void fetch(`${env.apiUrl}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        credentials: 'omit',
      }).catch(() => undefined);
    } catch {
      // Measurement must never break the screen.
    }
  }
}

export function trackShowroom(event: ShowroomEventInput) {
  try {
    queue.push({
      ...event,
      surface: event.surface ?? 'app_listing',
      occurredAt: new Date().toISOString(),
      sessionId: sessionId(),
      device: device(),
    });
    if (!listening) {
      listening = true;
      AppState.addEventListener('change', (state) => {
        if (state !== 'active') flush();
      });
    }
    if (queue.length >= MAX_BATCH) flush();
    else if (!timer) timer = setTimeout(flush, FLUSH_MS);
  } catch {
    /* never throw from instrumentation */
  }
}
