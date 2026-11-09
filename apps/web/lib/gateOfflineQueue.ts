import { useSyncExternalStore } from 'react';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { WATCHLIST_BLOCKED } from '@/lib/gateman/watchlistRefusal';
import { CONTRACTOR_NOT_PERMITTED } from '@/lib/gateman/contractorRefusal';
import { estateService } from '@/services/estateService';

// Kept parallel to apps/mobile/lib/gateOfflineQueue.ts. Only text-only gate writes are
// queued (a `File` can't be stored), and only on network failures: queueing a rejected
// write would replay it into the same rejection forever.

const KEY = 'sureground.gate.offline-queue';

export type GateWriteType = 'check-in' | 'check-out' | 'admit';

export type GateWritePayloads = {
  'check-in': { estateId: string; pin: string; occurredAt: string; gateId?: string; label: string };
  'check-out': {
    estateId: string;
    passId: string;
    occurredAt: string;
    gateId?: string;
    label: string;
  };
  admit: { estateId: string; passId: string; occurredAt: string; gateId?: string; label: string };
};

export type GateWrite = {
  [K in GateWriteType]: {
    id: string;
    type: K;
    payload: GateWritePayloads[K];
    createdAt: string;
  };
}[GateWriteType];

// Ignores the timestamp, so a guard tapping again doesn't queue the same write twice.
function writeKey(write: GateWrite): string {
  if (write.type === 'check-in') return `check-in:${write.payload.estateId}:${write.payload.pin}`;
  return `${write.type}:${write.payload.estateId}:${write.payload.passId}`;
}

const listeners = new Set<() => void>();

// Cached because useSyncExternalStore compares snapshots by reference: a fresh array
// each read would re-render forever.
let cache: GateWrite[] | null = null;

function parseStored(): GateWrite[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as GateWrite[]) : [];
  } catch {
    // A corrupt queue must not crash the gate console.
    return [];
  }
}

function list(): GateWrite[] {
  if (cache === null) cache = parseStored();
  return cache;
}

function commit(items: GateWrite[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked (private mode): the in-memory copy still reflects the write.
  }
  for (const listener of listeners) listener();
}

// Keeps other open tabs in step, so one can't replay writes another already sent.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    cache = parseStored();
    for (const listener of listeners) listener();
  });
}

export const gateOfflineQueue = {
  list,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  enqueue: <K extends GateWriteType>(type: K, payload: GateWritePayloads[K]) => {
    const item = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    } as GateWrite;

    const items = list();
    const key = writeKey(item);
    const duplicate = items.find((existing) => writeKey(existing) === key);
    if (duplicate) return duplicate;

    commit([...items, item]);
    return item;
  },

  remove: (id: string) => commit(list().filter((item) => item.id !== id)),
};

// Must be final answers: the drain stops at the first write it can't settle, so a
// retryable code here would strand every arrival queued behind it.
const FINAL_REFUSAL_CODES: ReadonlySet<string> = new Set([
  WATCHLIST_BLOCKED,
  CONTRACTOR_NOT_PERMITTED,
]);

export function isOfflineFailure(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

type Outcome = 'sent' | 'already-applied' | 'unconfirmed' | 'rejected' | 'retry';

function classify(item: GateWrite, error: unknown): Outcome {
  if (!(error instanceof ApiError)) return 'retry';
  if (error.status === 0) return 'retry';

  if (error.code !== undefined && FINAL_REFUSAL_CODES.has(error.code)) return 'rejected';

  // Held until the guard signs in again; the write itself is fine.
  if (error.status === 401 || error.status === 403) return 'retry';

  if (error.status >= 500) return 'retry';

  if (error.status === 429) return 'retry';

  if (item.type === 'check-out' && error.status === 409) {
    return 'already-applied';
  }

  if (item.type === 'admit' && error.status === 409) {
    // Ambiguous: our write may have landed with a lost reply, or the pass lapsed
    // offline. Retrying can't tell, so a person checks.
    return 'unconfirmed';
  }

  if (item.type === 'check-in' && error.status === 404) {
    // One 404 covers invalid, expired and already used, so a person checks.
    return 'unconfirmed';
  }

  return 'rejected';
}

function dispatch(item: GateWrite): Promise<unknown> {
  switch (item.type) {
    // The gate comes from the write, not the guard's current post: they may have moved.
    case 'check-in':
      return unwrap(
        estateService.verifyVisitorPass(item.payload.estateId, item.payload.pin, {
          occurredAt: item.payload.occurredAt,
          gateId: item.payload.gateId,
        })
      );
    case 'check-out':
      return unwrap(
        estateService.checkOutVisitorPass(item.payload.estateId, item.payload.passId, {
          occurredAt: item.payload.occurredAt,
          gateId: item.payload.gateId,
        })
      );
    case 'admit':
      return unwrap(
        estateService.admitWalkInVisitorPass(item.payload.estateId, item.payload.passId, {
          occurredAt: item.payload.occurredAt,
          gateId: item.payload.gateId,
        })
      );
  }
}

export interface GateReplaySummary {
  sent: number;
  alreadyApplied: number;
  unconfirmed: string[];
  rejected: string[];
  remaining: number;
}

let inFlight: Promise<GateReplaySummary | null> | null = null;

// The web app has no global toast, so a background drain leaves its result here for the page.
let lastSummary: GateReplaySummary | null = null;
const summaryListeners = new Set<() => void>();

function setLastSummary(next: GateReplaySummary | null) {
  lastSummary = next;
  for (const listener of summaryListeners) listener();
}

export function useGateReplaySummary(): GateReplaySummary | null {
  return useSyncExternalStore(
    (listener) => {
      summaryListeners.add(listener);
      return () => summaryListeners.delete(listener);
    },
    () => lastSummary,
    () => null
  );
}

export function clearGateReplaySummary() {
  setLastSummary(null);
}

// Oldest first, stopping at the first transient failure so order is preserved.
// Returns null when there was nothing to send.
export function replayGateQueue(): Promise<GateReplaySummary | null> {
  if (inFlight) return inFlight;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.resolve(null);

  inFlight = (async () => {
    const queued = gateOfflineQueue.list();
    if (queued.length === 0) return null;

    const summary: GateReplaySummary = {
      sent: 0,
      alreadyApplied: 0,
      unconfirmed: [],
      rejected: [],
      remaining: 0,
    };

    for (const item of queued) {
      try {
        await dispatch(item);
        gateOfflineQueue.remove(item.id);
        summary.sent += 1;
      } catch (error) {
        const outcome = classify(item, error);
        if (outcome === 'retry') break;
        if (outcome === 'unconfirmed') summary.unconfirmed.push(item.payload.label);
        else if (outcome === 'rejected') summary.rejected.push(item.payload.label);
        else summary.alreadyApplied += 1;
        gateOfflineQueue.remove(item.id);
      }
    }

    summary.remaining = gateOfflineQueue.list().length;
    setLastSummary(summary);
    return summary;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function useGateQueue(): GateWrite[] {
  return useSyncExternalStore(
    gateOfflineQueue.subscribe,
    gateOfflineQueue.list,
    () => [] as GateWrite[]
  );
}
