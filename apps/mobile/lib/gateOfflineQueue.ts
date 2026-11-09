import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { ApiError } from './api/client';
import { gatemanApi } from './api/gateman';
import { WATCHLIST_BLOCKED } from './gateman/watchlistRefusal';
import { CONTRACTOR_NOT_PERMITTED } from './gateman/contractorRefusal';

// Only text-only gate writes are queued: photo writes can't be, because a restart
// can empty the cache their files live in, and walk-in requests need a household's
// live answer.

const KEY = 'sureground.gate.offline-queue';

export type GateWriteType = 'check-in' | 'check-out' | 'admit' | 'patrol-scan';

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
  'patrol-scan': { estateId: string; code: string; occurredAt: string; label: string };
};

export type GateWrite = {
  [K in GateWriteType]: {
    id: string;
    type: K;
    payload: GateWritePayloads[K];
    createdAt: string;
  };
}[GateWriteType];

// AsyncStorage is the source of truth; every mutation re-reads it, so this mirror
// can't drift after a crash mid-write.
let snapshot: GateWrite[] = [];
const listeners = new Set<() => void>();

function emit(next: GateWrite[]) {
  snapshot = next;
  for (const listener of listeners) listener();
}

// Serialised so a write landing during a replay can't be lost to a concurrent
// read-modify-write of the same key.
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
    // A corrupt queue must not crash the gate console.
    return [];
  }
}

// crypto.randomUUID isn't guaranteed under Hermes.
function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Ignores the timestamp, so a guard tapping again doesn't queue the same write twice.
function writeKey(write: GateWrite): string {
  if (write.type === 'check-in') return `check-in:${write.payload.estateId}:${write.payload.pin}`;
  if (write.type === 'patrol-scan') {
    // Per local day: the same checkpoint is scanned again on the next night's patrol.
    const { estateId, code, occurredAt } = write.payload;
    return `patrol-scan:${estateId}:${code}:${occurredAt.slice(0, 10)}`;
  }
  return `${write.type}:${write.payload.estateId}:${write.payload.passId}`;
}

export const gateOfflineQueue = {
  getSnapshot: () => snapshot,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  hydrate: () =>
    serial(async () => {
      const stored = await readStored();
      emit(stored);
      return stored;
    }),

  read: () => readStored(),

  enqueue: <K extends GateWriteType>(type: K, payload: GateWritePayloads[K]) =>
    serial(async () => {
      const item = {
        id: newId(),
        type,
        payload,
        createdAt: new Date().toISOString(),
      } as GateWrite;

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
      const next = (await readStored()).filter((item) => item.id !== id);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      emit(next);
    }),
};

type Outcome = 'sent' | 'already-applied' | 'unconfirmed' | 'rejected' | 'retry';

// The patrol scan endpoint refuses with a 200 and a message (so codes can't be
// probed); without this a refused scan would be counted as sent.
class GateWriteRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GateWriteRefused';
  }
}

// Must be final answers: the drain stops at the first write it can't settle, so a
// retryable code here would strand every arrival queued behind it.
const FINAL_REFUSAL_CODES: ReadonlySet<string> = new Set([
  WATCHLIST_BLOCKED,
  CONTRACTOR_NOT_PERMITTED,
]);

function classify(item: GateWrite, error: unknown): Outcome {
  if (error instanceof GateWriteRefused) return 'rejected';
  if (!(error instanceof ApiError)) return 'retry';
  if (error.isNetwork) return 'retry';
  if (error.code !== undefined && FINAL_REFUSAL_CODES.has(error.code)) return 'rejected';
  // Held until the guard signs in again; the write itself is fine.
  if (error.status === 401 || error.status === 403) return 'retry';
  if (error.status >= 500) return 'retry';
  if (error.status === 429) return 'retry';
  if (item.type === 'check-out' && error.status === 409) {
    return 'already-applied';
  }
  // Ambiguous: our write may have landed with a lost reply, or the pass lapsed
  // offline. Retrying can't tell, so a person checks.
  if (item.type === 'admit' && error.status === 409) {
    return 'unconfirmed';
  }
  if (item.type === 'check-in' && error.status === 404) {
    return 'unconfirmed';
  }
  return 'rejected';
}

async function dispatch(item: GateWrite): Promise<unknown> {
  switch (item.type) {
    // The gate comes from the write, not the guard's current post: they may have moved.
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
    case 'patrol-scan': {
      const result = await gatemanApi.scanPatrolCheckpoint(
        item.payload.estateId,
        item.payload.code,
        { occurredAt: item.payload.occurredAt }
      );
      if (!result.accepted) throw new GateWriteRefused(`${result.message} ${result.instruction}`);
      return result;
    }
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

// Oldest first, stopping at the first transient failure so order is preserved.
// Returns null when there was nothing to send.
export function replayGateQueue(): Promise<GateReplaySummary | null> {
  // Network events arrive in bursts; two drains at once would double-send.
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

export function useGateQueue(): GateWrite[] {
  return useSyncExternalStore(gateOfflineQueue.subscribe, gateOfflineQueue.getSnapshot);
}
