import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { ApiError } from './api/client';
import { gatemanApi } from './api/gateman';

/**
 * A durable queue for the gate writes that must never be lost.
 *
 * Scope is deliberate. Only the three text-only arrival and departure writes are
 * queued: a PIN check-in, a check-out, and admitting an approved walk-in.
 *
 *  - They serialise exactly, so a replay reconstructs the record faithfully. The
 *    photo-bearing writes (vehicle entry, deliveries, incidents) are NOT queued,
 *    because a picked file lives in a cache directory that a restart can empty.
 *    Replaying one could silently file a record without its evidence, and a
 *    record that looks complete but isn't is worse than a loud failure.
 *  - They are the writes where a missing record is a security and audit problem.
 *    "Who is inside the estate?" is only answerable if every arrival and
 *    departure survived the outage.
 *
 * Raising a walk-in is deliberately NOT queued: it asks a household to decide, so
 * it needs the network by definition and a queued request would ask permission
 * for somebody who left ten minutes ago.
 *
 * Check-in and check-out are mutually exclusive per visitor while offline (the
 * server-side "inside now" list is what offers a check-out, and a queued arrival
 * isn't on it yet), so arrival-then-departure can't be reordered by the queue.
 * Items replay in the order they were recorded regardless.
 */

const KEY = 'getrentos.gate.offline-queue';

export type GateWriteType = 'check-in' | 'check-out' | 'admit';

/**
 * Each write carries exactly what its API call needs, so a replay can switch on
 * `type` and get the right payload without a cast. `label` exists only so a
 * failure can be reported to the guard in words they recognise — a bare internal
 * id would tell them nothing.
 */
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
 * In-memory mirror of the queue so the screen can render it synchronously.
 * AsyncStorage stays the source of truth: every mutation re-reads and rewrites
 * it, so a cold start or a crash mid-write can't desync the two.
 */
let snapshot: GateWrite[] = [];
const listeners = new Set<() => void>();

function emit(next: GateWrite[]) {
  snapshot = next;
  for (const listener of listeners) listener();
}

/**
 * Serialises every mutation. Two writes racing (a check-in landing while a
 * replay drains) would otherwise read-modify-write the same key and drop one.
 */
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

async function readStored(): Promise<GateWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GateWrite[]) : [];
  } catch {
    // A corrupt or unreadable queue must not crash the gate console. Losing it
    // is bad, but taking the app down at the barrier is worse.
    return [];
  }
}

/**
 * `crypto.randomUUID` isn't guaranteed under Hermes, and the id only has to be
 * unique within one device's queue, so a timestamp plus entropy is enough and
 * avoids pulling in a crypto polyfill for a key nothing else reads.
 */
function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

export const gateOfflineQueue = {
  /** Current queue from memory. Call `hydrate()` first for a cold start. */
  getSnapshot: () => snapshot,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Loads the persisted queue into memory. Safe to call repeatedly. */
  hydrate: () =>
    serial(async () => {
      const stored = await readStored();
      emit(stored);
      return stored;
    }),

  read: () => readStored(),

  /**
   * Adds a write to the queue. Returns the item now queued — which is the
   * existing one when an equivalent write is already waiting, so a repeated tap
   * is idempotent rather than a second arrival.
   */
  enqueue: <K extends GateWriteType>(type: K, payload: GateWritePayloads[K]) =>
    serial(async () => {
      const item = {
        id: newId(),
        type,
        payload,
        createdAt: new Date().toISOString(),
      } as GateWrite;

      // Read through rather than trusting the in-memory copy, so a write landing
      // during a replay can't be lost by clobbering it with a stale array.
      const stored = await readStored();
      const key = writeKey(item);
      const duplicate = stored.find((existing) => writeKey(existing) === key);
      if (duplicate) return duplicate;

      const next = [...stored, item];
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      emit(next);
      return item;
    }),

  remove: (id: string) =>
    serial(async () => {
      // Re-read rather than filtering the in-memory copy, so a removal can never
      // resurrect an item another writer already dropped.
      const next = (await readStored()).filter((item) => item.id !== id);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      emit(next);
    }),
};

/** How a replayed write turned out. */
type Outcome = 'sent' | 'already-applied' | 'unconfirmed' | 'rejected' | 'retry';

/**
 * Decides whether a failed replay should be retried, trusted, or handed to a
 * human. A queue that retries forever behind one poison item never drains, so
 * only genuinely transient problems are allowed to hold the queue up.
 */
function classify(item: GateWrite, error: unknown): Outcome {
  if (!(error instanceof ApiError)) return 'retry';

  // Offline or timed out: the normal case, try again on the next signal.
  if (error.isNetwork) return 'retry';

  // Auth: the token is gone. Retrying without a login can't succeed, but the
  // write is not the user's fault either, so hold it until they sign in.
  if (error.status === 401 || error.status === 403) return 'retry';

  // Server-side fault: the payload is fine, the estate just couldn't take it.
  if (error.status >= 500) return 'retry';

  if (item.type === 'check-out' && error.status === 409) {
    // The pass is already closed. Either our own earlier attempt landed and only
    // its reply was lost, or someone else closed it. Both mean the estate's
    // record is correct, so there is nothing left to send.
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
    // this is genuinely ambiguous: our write may have landed with a lost reply,
    // or the pass may be past rescuing. Retrying can't tell them apart and a
    // bad pass will never succeed, so stop and let a person look. Reported as
    // unconfirmed rather than pretending either way.
    return 'unconfirmed';
  }

  // 400 and friends: this payload will never be accepted, however often we ask.
  return 'rejected';
}

function dispatch(item: GateWrite): Promise<unknown> {
  switch (item.type) {
    // The gate travels with the write. By replay time the guard may have moved
    // to another estate or another barrier, so reading "where am I now" would
    // attribute the arrival to the wrong place — the record has to say where it
    // actually happened.
    case 'check-in':
      return gatemanApi.verifyVisitorPass(item.payload.estateId, item.payload.pin, {
        occurredAt: item.payload.occurredAt,
        gateId: item.payload.gateId,
      });
    case 'check-out':
      return gatemanApi.checkOutVisitorPass(item.payload.estateId, item.payload.passId, {
        occurredAt: item.payload.occurredAt,
        gateId: item.payload.gateId,
      });
    case 'admit':
      return gatemanApi.admitWalkIn(item.payload.estateId, item.payload.passId, {
        occurredAt: item.payload.occurredAt,
        gateId: item.payload.gateId,
      });
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
 * Sends everything queued, oldest first, stopping at the first transient
 * failure so ordering and rate are both preserved. Returns `null` when there was
 * nothing to send, so callers can stay silent.
 */
export function replayGateQueue(): Promise<GateReplaySummary | null> {
  // NetInfo can fire several times in a burst and a manual retry can overlap it;
  // two drains would double-send. One at a time.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const queued = await gateOfflineQueue.hydrate();
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
        await gateOfflineQueue.remove(item.id);
        summary.sent += 1;
      } catch (error) {
        const outcome = classify(item, error);
        if (outcome === 'retry') break;
        if (outcome === 'unconfirmed') summary.unconfirmed.push(item.payload.label);
        else if (outcome === 'rejected') summary.rejected.push(item.payload.label);
        else summary.alreadyApplied += 1;
        await gateOfflineQueue.remove(item.id);
      }
    }

    summary.remaining = (await gateOfflineQueue.read()).length;
    return summary;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Live queue for rendering. */
export function useGateQueue(): GateWrite[] {
  return useSyncExternalStore(gateOfflineQueue.subscribe, gateOfflineQueue.getSnapshot);
}
