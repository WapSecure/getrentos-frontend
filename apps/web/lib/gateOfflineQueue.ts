import { useSyncExternalStore } from 'react';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { estateService } from '@/services/estateService';

/**
 * A durable queue for the two gate writes that must never be lost.
 *
 * The browser counterpart of `apps/mobile/lib/gateOfflineQueue.ts`, kept
 * deliberately parallel so the two behave the same way. Only check-in and
 * check-out are queued:
 *
 *  - They are text-only, so the queued payload serialises exactly. The
 *    photo-bearing writes (vehicle entry, deliveries, incidents) are NOT queued,
 *    because a `File` cannot be serialised into storage and would replay as an
 *    empty record — a record that looks complete but isn't is worse than a loud
 *    failure.
 *  - They are the writes where a missing record is a security and audit problem.
 *    "Who is inside the estate?" is only answerable if every arrival and
 *    departure survived the outage.
 *
 * Unlike the older `agentOfflineQueue`, this only queues genuine network
 * failures. Queueing on any error would park a rejected write in the queue and
 * replay it into the same rejection forever.
 */

const KEY = 'getrentos.gate.offline-queue';

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
  /**
   * An approved walk-in the guard admitted while the connection was down. The
   * household's consent is already on the server, so the barrier decision is
   * still the guard's to record — only the network is missing.
   */
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

/**
 * Identity of a write, ignoring when it was recorded. A guard whose send failed
 * will reasonably tap again, and queueing the same arrival twice would replay
 * the second copy into a 404 and a confusing "couldn't confirm" warning for a
 * visitor who is, in fact, correctly inside.
 */
function writeKey(write: GateWrite): string {
  if (write.type === 'check-in') return `check-in:${write.payload.estateId}:${write.payload.pin}`;
  return `${write.type}:${write.payload.estateId}:${write.payload.passId}`;
}

const listeners = new Set<() => void>();

/**
 * In-memory mirror of the queue. Cached rather than re-parsed on every read
 * because `useSyncExternalStore` compares snapshots by reference — returning a
 * fresh array each call would re-render forever.
 */
let cache: GateWrite[] | null = null;

function parseStored(): GateWrite[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as GateWrite[]) : [];
  } catch {
    // A corrupt queue must not break the gate console; losing it is bad, but
    // taking the screen down is worse.
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
    // Storage full or blocked (private mode). The in-memory copy below still
    // reflects the write, so the guard sees a truthful count even then.
  }
  for (const listener of listeners) listener();
}

// A guard often has the console open in more than one tab. Without this a second
// tab would show a stale queue and could replay writes the first tab already sent.
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

  /** Adds a write, or returns the equivalent one already waiting. */
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

/** True when a failure means "no connection", not "the estate said no". */
export function isOfflineFailure(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

type Outcome = 'sent' | 'already-applied' | 'unconfirmed' | 'rejected' | 'retry';

/**
 * Decides whether a failed replay should be retried, trusted, or handed to a
 * human. A queue that retries forever behind one poison item never drains, so
 * only genuinely transient problems hold the queue up.
 */
function classify(item: GateWrite, error: unknown): Outcome {
  if (!(error instanceof ApiError)) return 'retry';
  if (error.status === 0) return 'retry';

  // Auth: the session lapsed. Hold the write until the user is signed in again.
  if (error.status === 401 || error.status === 403) return 'retry';

  // Server-side fault: the payload is fine, the estate just couldn't take it.
  if (error.status >= 500) return 'retry';

  if (item.type === 'check-out' && error.status === 409) {
    // Already closed: either our earlier attempt landed and only its reply was
    // lost, or someone else closed it. The estate's record is correct either way.
    return 'already-applied';
  }

  if (item.type === 'admit' && error.status === 409) {
    // The pass is no longer in an admittable state — which is either "already
    // admitted" (our write landed) or "the approval lapsed while we were
    // offline" (it never will). Indistinguishable from here, so a person looks.
    return 'unconfirmed';
  }

  if (item.type === 'check-in' && error.status === 404) {
    // The API answers "invalid, expired, or already-used" with a single 404, so
    // this is genuinely ambiguous. Retrying can't tell the two apart and a bad
    // pass will never succeed, so stop and let a person look.
    return 'unconfirmed';
  }

  return 'rejected';
}

function dispatch(item: GateWrite): Promise<unknown> {
  switch (item.type) {
    // The gate travels with the write. By replay time the guard may have moved
    // to another estate or another barrier, so reading "where am I now" would
    // attribute the arrival to the wrong place — the record has to say where it
    // actually happened.
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
  /** Writes the estate accepted on this pass. */
  sent: number;
  /** Dropped because the estate's record already existed. */
  alreadyApplied: number;
  /** Dropped but needs a person: the estate could not confirm the arrival. */
  unconfirmed: string[];
  /** Dropped because the estate will never accept it. */
  rejected: string[];
  /** Still queued for the next attempt. */
  remaining: number;
}

let inFlight: Promise<GateReplaySummary | null> | null = null;

/**
 * The outcome of the most recent drain, for the verify screen to report inline.
 * The web app has no global toast provider — gate pages show feedback in a card
 * on the page — so a drain that happens in the background has to leave its
 * result somewhere the page can pick up rather than shouting over the top of it.
 */
let lastSummary: GateReplaySummary | null = null;
const summaryListeners = new Set<() => void>();

function setLastSummary(next: GateReplaySummary | null) {
  lastSummary = next;
  for (const listener of summaryListeners) listener();
}

/** The last drain's result, or null when there is nothing to report. */
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

/** Clears a reported result once the guard has seen it. */
export function clearGateReplaySummary() {
  setLastSummary(null);
}

/**
 * Sends everything queued, oldest first, stopping at the first transient
 * failure so ordering and rate are both preserved. Returns `null` when there was
 * nothing to send. Offline is checked first so a page that reconnects mid-flight
 * doesn't start a doomed drain.
 */
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

/** Live queue for rendering. */
export function useGateQueue(): GateWrite[] {
  return useSyncExternalStore(
    gateOfflineQueue.subscribe,
    gateOfflineQueue.list,
    () => [] as GateWrite[]
  );
}
